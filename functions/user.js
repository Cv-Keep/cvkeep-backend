const md5 = require('md5');
const config = require('../config');
const __db = require('../database/');
const __cv = require('./cv.js');
const __utils = require('./utils.js');
const __email = require('./email.js');
const __userFiles = require('./userFiles.js');

module.exports = {
	get(query, options = {}) {
		if (typeof query === 'string') {
			query = { email: query };
		}

		return new Promise((resolve, reject) => {
			__db.credentials.findOne(query, (error, credentials) => {
				if (error) {
					reject(error);
					return false;
				}

				if (!credentials) {
					resolve(credentials);
					return false;
				}

				credentials = __utils.schema('credentials', credentials);
				credentials.hasPassword = !!credentials.password;

				if (options.sanitize) {
					delete credentials.password;
					delete credentials.confirm_password;
					delete credentials.pendingUrlActions;
				}

				resolve(credentials);
			});
		});
	},

	create(data) {
		data = __utils.schema('credentials', data);

		['email', 'username'].forEach(item => {
			if (!data[item]) {
				throw new Error(`Error while creating user, ${item} is undefined`);
			}
		});

		return new Promise((resolve, reject) => {
			data.username = __utils.slugify(data.username);

			const findUserQuery = {
				$or: [
					{
						email: data.email,
						username: data.username,
					},
				],
			};

			__db.credentials.findOne(findUserQuery, (error, user) => {
				if (error || user) {
					const eqEmail = user.email == data.email;
					const duplicate = eqEmail ? 'error.emailAlreadyTaken' : 'error.usernameAlreadyTaken';

					reject(error || duplicate);
				}

				__db.credentials.save(data, (error, state) => {
					error ? reject(error) : resolve(state);
				});
			});
		});
	},

	getActiveUser(query, options = {}) {
		return new Promise((resolve, reject) => {
			this.get(query, options)
				.then(user => {
					user && user.active ? resolve(user) : resolve(null);
				})
				.catch(reject);
		});
	},

	update(query, data, options = { upsert: false }) {
		if (typeof query === 'string') {
			query = { email: query };
		}

		return new Promise((resolve, reject) => {
			delete data._id;

			__db.credentials.update(query, { $set: { ...data } }, options, (error, status) => {
				(!error && status.ok) ? resolve(status) : reject(error || `Error: DB Query Status: ${ status.ok }`);
			});
		});
	},

	updateOrCreate(email, data, options = { upsert: true}) {
		return this.update(email, data, options);
	},

	reactivate(email) {
		return new Promise((resolve, reject) => {
			const query = { 'email': email };

			__db.credentials.update(query, { $set: { active: true } }, { upsert: false }, (error, status) => {
				error ? reject(error) : resolve(status.modified);
			});
		});
	},

	createRegisteringHash(email) {
		return md5(`${config.secret}|${new Date()}|${email}`);
	},

	register(newUser) {
		return new Promise((resolve, reject) => {
			__db.registering.save(newUser, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	updateRegistering(newUser) {
		const daysPassed = __utils.secsToDays(newUser.registering.created);

		return new Promise((resolve, reject) => {
			if (daysPassed > 2) {
				++newUser.registering.renewed;

				newUser.registering.hash = this.createRegisteringHash(email);

				const query = { 'registering.email': newUser.email };

				__db.registering.update(query, { $set: { registering: newUser.registering } }, (error, status) => {
					(!error && status.ok) ? resolve(status) : reject(error || `Error: DB Query Status: ${ status.ok }`);
				});
			} else {
				resolve(newUser);
			}
		});
	},

	isRegistering(email) {
		return new Promise((resolve, reject) => {
			__db.registering.findOne({ 'registering.email': email }, (error, user) => {
				error ? reject(error) : resolve(user);
			});
		});
	},

	getRegisteringByHash(hash) {
		return new Promise((resolve, reject) => {
			__db.registering.findOne({ 'registering.hash': hash }, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	removeRegistering(hash) {
		return new Promise((resolve, reject) => {
			__db.registering.remove({ 'registering.hash': hash }, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	encodePassword(pass) {
		return md5(`${pass}/${config.secret}`);
	},

	generateRandomPassword: () => {
		return generatePass.generate({
			length: 8,
			strict: true,
			numbers: true,
			uppercase: true,
			excludeSimilarCharacters: true,
		});
	},

	passwordsMatch(passA, passB, encode = false) {
		if (encode) {
			passA = this.encodePassword(passA);
			passB = this.encodePassword(passB);
		}

		return passA === passB;
	},

	changeEmail(currentEmail, newEmail) {
		return new Promise(async (resolve, reject) => {
			const alreadyExists = await this.get({ email: newEmail });

			if (!alreadyExists) {
				try {
					await __db.curriculum.update({ email: currentEmail }, { $set: { email: newEmail } });
					await __db.forgotpass.update({ email: currentEmail }, { $set: { email: newEmail } });
					await __db.credentials.update({ email: currentEmail }, { $set: { email: newEmail } });

					resolve(true);
				} catch (error) {
					reject(error);
				}
			} else {
				reject('error.emailNotAvailableForUse');
			}
		});
	},

	changePassword(email, newPassword) {
		newPassword = this.encodePassword(newPassword);
		return this.update(email, { password: newPassword });
	},

	changeUsername(currentUserEmail, newUsername) {
		newUsername = __utils.slugify(newUsername);

		return new Promise(async (resolve, reject) => {
			const alreadyExists = await this.get({ username: newUsername });

			if (!alreadyExists) {
				const cvChangeStatus = await __cv.update(currentUserEmail, { username: newUsername })
					.catch(reject);

				const userChangeStatus = await this.update(currentUserEmail, { username: newUsername })
					.catch(reject);

				resolve({ credentials: userChangeStatus, curriculum: cvChangeStatus });
			} else {
				reject('error.usernameAlreadyTaken');
			}
		});
	},

	forgotPass(email, res) {
		const hash = md5(`${config.secret}|${new Date()}|${email}`);

		return new Promise((resolve, reject) => {
			const query = { 'email': email };
			const set = { hash: hash, created: new Date() };

			__db.forgotpass.update(query, { $set: set }, { upsert: true }, (error, status) => {
				if (!error && status.ok) {
					__email.send({
						to: email,
						subject: 'Nova Senha',
						template: 'forgotpass',
						hash: hash,
						locale: res.i18n.locale,
					})
						.catch(console.error); ;

					resolve({ ok: true });
				} else {
					reject({ errors: [error || `Error: DB Query Status: ${ status.ok }`] });
				}
			});
		});
	},

	removeForgotPass(hash) {
		return new Promise((resolve, reject) => {
			return __db.forgotpass.remove({ hash: hash }, (error, data) => {
				(error || !data) ? reject(error || 'error.internalUnexpectedError') : resolve(data);
			});
		});
	},

	validateForgottenPassHash(hash) {
		return new Promise((resolve, reject) => {
			__db.forgotpass.findOne({ hash: hash}, (error, data) => {
				(error || !data) ? reject(error || 'error.invalidToken') : resolve(data);
			});
		}).then(data => {
			return new Promise(resolve => {
				const hashAgeInDays = (new Date().getTime() - new Date(data.created).getTime()) / (1000 * 3600 * 24);

				if (hashAgeInDays <= 2) {
					resolve(true);
				} else {
					__db.forgotpass.remove({ hash: hash });
					resolve(false);
				}
			});
		});
	},

	setAvatar(userEmail, file) {
		return new Promise(async (resolve, reject) => {
			if (!userEmail || !file) reject('error.nonExistentUserOfFile');

			const user = await this.get(userEmail).catch(reject);
			const uploadingFile = typeof file !== 'string';

			let resource = null;

			if (uploadingFile) {
				resource = await __userFiles.uploadAvatar(user._id, file).catch(reject);
			} else {
				resource = file;
			}

			await this.update(userEmail, { photo: resource }).catch(reject);
			await __cv.update(userEmail, {basics: { photo: resource }}).catch(reject);

			resolve(resource);
		});
	},

	deactivateAccount(userEmail) {
		const userhash = md5(`${Date.now()}.${userEmail}.${Math.random().toString(32)}`);

		return new Promise(async (resolve, reject) => {
			await this.changeUsername(userEmail, userhash);

			this.update(userEmail, { active: false })
				.then(resolve)
				.catch(reject);
		});
	},
};
