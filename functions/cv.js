const fnCvNgrams = require('./cvNgrams.js');
const log = require('logflake')('cv');

const Curriculum = require('../models/curriculum.js');
const Credentials = require('../models/credentials.js');

module.exports = {
	get(query) {
		if (typeof query === 'string') {
			query = { email: query };
		}

		return new Promise((resolve, reject) => {
			Curriculum.findOne(query, (error, cv) => {
				error ? reject(error) : resolve(cv);
			});
		});
	},

	create(data) {
		['email', 'username'].forEach(item => {
			if (!data[item]) {
				throw new Error(`Error while creating a new CV, ${item} no defined`);
			}
		});

		return new Promise((resolve, reject) => {
			const findCvQuery = {$or: [{ email: data.email, username: data.username }]};

			Curriculum.findOne(findCvQuery, (error, cv) => {
				if (error || cv) {
					const duplicate = cv.email == data.email ? 'error.emailAlreadyTaken' : 'error.usernameAlreadyTaken';

					return reject(error || duplicate);
				}

				new Curriculum(data).save((error, state) => {
					error ? reject(error) : resolve(state);
				});
			});
		});
	},

	update(email, data, options = { upsert: false }) {
		return new Promise((resolve, reject) => {
			delete data._id;

			Curriculum.findOneAndUpdate({ email }, { $set: { ...data } }, options, (error, cv) => {
				fnCvNgrams.updateCvSearchIndex(email)
					.catch(error => log('error', error));

				if (data.basics && data.basics.fullname) {
					Credentials.updateOne({ email }, { $set: { fullname: data.basics.fullname } })
						.catch(error => log('error', error));
				}

				!error ? resolve(cv) : reject(error);
			});
		});
	},

	lock(cv, photo) {
		username = typeof cv === 'string' ? cv : cv.username;

		return {
			locked: true,
			passwordProtected: true,
			username: username,
			background: cv.background,
		};
	},

	sanitizeCvOnSave(cv) {
		if (!cv || typeof cv !== 'object') {
			return cv;
		}

		const nonEditables = [
			'views',
			'email',
			'editing',
			'created',
			'username',
		];

		nonEditables.forEach(item => {
			delete cv[item];
		});

		// validates that a phone number has only [0-9] and " ", *#-() chars
		if (cv.contact && cv.contact.primaryNumber) {
			cv.contact.primaryNumber = cv.contact.primaryNumber.replace(/[^\d.\-\(\)\+\#\*\ ]/g, '');
		}

		// background values must start with the given pathname
		if (cv.background && cv.background.trim().indexOf('/img/backgrounds/') !== 0) {
			cv.background = '';
		}

		// validation for civil states
		if (!['doNotInform', 'married', 'single', 'divorced'].includes(cv.civilState)) {
			cv.civilState = 'doNotInform';
		}

		return cv;
	},

	incViewCounter(email) {
		Curriculum.findOneAndUpdate({ email: email }, { $inc: { views: 1 } }).exec();
	},
};
