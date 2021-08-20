const md5 = require('md5');
const config = require('../config');
const log = require('logflake')('user');
const __cv = require('./cv.js');
const __utils = require('./utils.js');
const __email = require('./email.js');
const __userFiles = require('./userFiles.js');

const Credentials = require('../models/credentials.js');
const Registering = require('../models/registering.js');
const Curriculum = require('../models/curriculum.js');
const ForgotPass = require('../models/forgotPass.js');

module.exports = {
	get(query, options = {}) {
		if (typeof query === 'string') {
			query = { email: query };
		}

		return new Promise(async (resolve, reject) => {
			Credentials.findOne(query, (error, credentials) => {
				if (error) {
					reject(error);
					return false;
				}

				if (!credentials) {
					resolve(null);
					return false;
				}

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
		return new Promise((resolve, reject) => {
			if (!data.email || !data.username) {
				reject(`Error while creating user, ${item} is undefined`);
			}

			data.username = __utils.slugify(data.username);

			const findUserQuery = {
				$or: [
					{
						email: data.email,
						username: data.username,
					},
				],
			};

			Credentials.findOne(findUserQuery, (error, user) => {
				if (error || user) {
					const eqEmail = user.email == data.email;
					const duplicate = eqEmail ? 'error.emailAlreadyTaken' : 'error.usernameAlreadyTaken';

					return reject(error || duplicate);
				}

				new Credentials(data).save((error, state) => {
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

			Credentials.findOneAndUpdate(query, { $set: { ...data } }, options, (error, status) => {
				!error ? resolve(status) : reject(error);
			});
		});
	},

	updateOrCreate(email, data, options = { upsert: true}) {
		return this.update(email, data, options);
	},

	reactivate(email) {
		return new Promise((resolve, reject) => {
			const query = { 'email': email };

			Credentials.findOneAndUpdate(query, { $set: { active: true } }, { upsert: false }, (error, status) => {
				error ? reject(error) : resolve(status.modified);
			});
		});
	},

	createRegisteringHash(email) {
		return md5(`${config.secret}|${new Date()}|${email}`);
	},

	register(newUser) {
		return new Promise((resolve, reject) => {
			const User = new Registering(newUser);

			User.save(newUser, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	updateRegistering(data) {
		return new Promise((resolve, reject) => {
			data.registering.hash = this.createRegisteringHash(data.email);

			const query = {
				find: { 'registering.email': data.email },
				set: { $set: { registering: data.registering } },
			};

			Registering.findOneAndUpdate(query.find, query.set, (error, status) => {
				!error ? resolve(status) : reject(error);
			});
		});
	},

	isRegistering(email) {
		return new Promise((resolve, reject) => {
			Registering.findOne({ 'registering.email': email }, (error, user) => {
				error ? reject(error) : resolve(user);
			});
		});
	},

	getRegisteringByHash(hash) {
		return new Promise((resolve, reject) => {
			Registering.findOne({ 'registering.hash': hash }, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	removeRegistering(hash) {
		return new Promise((resolve, reject) => {
			Registering.deleteOne({ 'registering.hash': hash }, (error, status) => {
				error ? reject(error) : resolve(status);
			});
		});
	},

	encodePassword(pass) {
		return md5(`${pass}/${config.secret}`);
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
				const setNewEmail = { $set: { email: newEmail } };

				try {
					await Curriculum.findOneAndUpdate({ email: currentEmail }, setNewEmail);
					await ForgotPass.findOneAndUpdate({ email: currentEmail }, setNewEmail);
					await Credentials.findOneAndUpdate({ email: currentEmail }, setNewEmail);

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

			ForgotPass.findOneAndUpdate(query, { $set: set }, { upsert: true }, error => {
				if (!error) {
					__email.send({
						to: email,
						subject: 'Nova Senha',
						template: 'forgotpass',
						hash: hash,
						locale: res.i18n.locale,
					}).catch(error => log('error', error));

					resolve({ ok: true, errors: false });
				} else {
					reject(error);
				}
			});
		});
	},

	removeForgotPass(hash) {
		return new Promise((resolve, reject) => {
			return ForgotPass.deleteOne({ hash: hash }, (error, data) => {
				(error || !data) ? reject(error || 'error.internalUnexpectedError') : resolve(data);
			});
		});
	},

	validateForgottenPassHash(hash) {
		return new Promise((resolve, reject) => {
			ForgotPass.findOne({ hash: hash}, (error, data) => {
				(error || !data) ? reject(error || 'error.invalidToken') : resolve(data);
			});
		}).then(data => {
			return new Promise(resolve => {
				const hashAgeInDays = (new Date().getTime() - new Date(data.created).getTime()) / (1000 * 3600 * 24);

				if (hashAgeInDays <= 2) {
					resolve(true);
				} else {
					ForgotPass.deleteOne({ hash: hash });
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

	getSchema(data = {}) {
		return new Credentials(data);
	},
};
