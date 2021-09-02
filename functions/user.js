const md5 = require('md5');
const config = require('../config');
const log = require('logflake')('user');
const fnCv = require('./cv.js');
const fnUtils = require('./utils.js');
const fnEmail = require('./email.js');

const Credentials = require('../models/credentials.js');
const Registering = require('../models/registering.js');
const Curriculum = require('../models/curriculum.js');
const ForgotPass = require('../models/forgotpass.js');

module.exports = {
	get(query, options = {}) {
		return new Promise(async (resolve, reject) => {
			const select = {};

			if (!query) {
				return reject(query);
			}

			if (typeof query === 'string') {
				query = { email: query };
			}

			if (options.sanitize) {
				[
					'password',
					'hasPassword',
					'confirm_password',
					'pendingUrlActions',
				].forEach(item => {
					select[item] = 0;
				});
			}

			Credentials.findOne(query, select, (error, credentials) => {
				error ? reject(error) : resolve(credentials);
			});
		});
	},

	create(data) {
		return new Promise((resolve, reject) => {
			if (!data.email || !data.username) {
				reject(`Error while creating user, ${item} is undefined`);
			}

			data.username = fnUtils.slugify(data.username);

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

	reactivate(email) {
		return new Promise((resolve, reject) => {
			const query = { 'email': email };

			Credentials.findOneAndUpdate(query, { $set: { active: true } }, { upsert: false }, (error, credentials) => {
				error ? reject(error) : resolve(credentials);
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

				await Curriculum.findOneAndUpdate({ email: currentEmail }, setNewEmail)
					.catch(reject);

				await ForgotPass.findOneAndUpdate({ email: currentEmail }, setNewEmail)
					.catch(reject);

				await Credentials.findOneAndUpdate({ email: currentEmail }, setNewEmail)
					.catch(reject);

				resolve(true);
			} else {
				reject('error.emailNotAvailableForUse');
			}
		});
	},

	changePassword(email, newPassword) {
		newPassword = this.encodePassword(newPassword);

		return this.update(email, { password: newPassword, hasPassword: true });
	},

	changeUsername(currentUserEmail, newUsername) {
		newUsername = fnUtils.slugify(newUsername);

		return new Promise(async (resolve, reject) => {
			const alreadyExists = await this.get({ username: newUsername });

			if (!alreadyExists) {
				const cvChangeStatus = await fnCv.update(currentUserEmail, { username: newUsername })
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
			const query = { email };
			const set = { hash: hash, created: new Date() };

			ForgotPass.findOneAndUpdate(query, { $set: set }, { upsert: true }, error => {
				if (!error) {
					fnEmail.send({
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
			return ForgotPass.deleteOne({ hash }, (error, data) => {
				(error || !data) ? reject(error || 'error.internalUnexpectedError') : resolve(data);
			});
		});
	},

	getForgotPassObject(hash) {
		return new Promise((resolve, reject) => {
			ForgotPass.findOne({ hash}, async (error, data) => {
				if (error || !data) {
					return reject(error || 'error.invalidToken');
				}

				resolve(data);
			});
		});
	},

	validateForgottenPassHash(forgotPassObject) {
		if (!forgotPassObject) return false;

		const hashAgeInDays = fnUtils.daysSince(forgotPassObject.created);
		const isHashAllowed = hashAgeInDays <= 2;

		if (!isHashAllowed) {
			this.removeForgotPass(hash)
				.catch(error => log('error', error));
		}

		return isHashAllowed;
	},

	getForgotPassCompleteData(hash) {
		return new Promise(async (resolve, reject) => {
			const forgotPassObj = await this.getForgotPassObject(hash).catch(error => log('error', error));
			const isValidHash = forgotPassObj && this.validateForgottenPassHash(forgotPassObj);
			const user = forgotPassObj && await this.get(forgotPassObj.email).catch(error => log('error', error));

			if (!forgotPassObj || !isValidHash || !user) {
				return reject(false);
			}

			resolve({ user, isValidHash, forgotPassObj });
		});
	},

	setAvatar(userEmail, file) {
		return new Promise(async (resolve, reject) => {
			if (!userEmail || !file) {
				return reject('error.nonExistentUserOfFile');
			}

			const user = await Credentials.findOne({ email: userEmail })
				.select('photo')
				.catch(reject);

			if (!user || !file.data || !file.mimetype) {
				return reject('error.internalUnexpectedError');
			}

			user.photo = {
				data: file.data,
				contentType: file.mimetype,
			};

			await user.save();
			resolve(true);
		});
	},

	getAvatar(username) {
		return new Promise(async (resolve, reject) => {
			const user = await Credentials.findOne({ username })
				.select('photo')
				.catch(reject);

			if (!user) {
				return reject('error.internalUnexpectedError');
			}

			resolve(user.photo);
		});
	},

	removeAvatar(userEmail) {
		return new Promise(async (resolve, reject) => {
			await this.update(userEmail, { photo: null })
				.catch(reject);

			resolve(true);
		});
	},

	deactivateAccount(userEmail) {
		const userhash = md5(`${Date.now()}.${userEmail}.${Math.random().toString(32)}`);

		return new Promise(async (resolve, reject) => {
			await this.changeUsername(userEmail, userhash);

			this.update(userEmail, { active: false, deativated_at: new Date() })
				.then(resolve)
				.catch(reject);
		});
	},

	getSchema(data = {}) {
		return new Credentials(data);
	},
};
