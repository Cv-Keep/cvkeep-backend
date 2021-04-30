const __db = require(`${__basedir}/database/`);
const __ngrams = require('./ngrams.js');
const __utils = require('./utils.js');

module.exports = {

	get(query) {
		if (typeof query === 'string') {
			query = { email: query };
		}

		return new Promise((resolve, reject) => {
			__db.curriculum.findOne(query, (error, cv) => {
				cv = cv ? __utils.schema('curriculum', cv) : null;
				error ? reject(error) : resolve(cv);
			});
		});
	},

	create(data) {
		data = __utils.schema('curriculum', data);

		['email', 'username'].forEach(item => {
			if (!data[item]) {
				throw new Error(`Error while creating a new CV, ${item} no defined`);
			}
		});

		return new Promise((resolve, reject) => {
			const findCvQuery = {$or: [{ email: data.email, username: data.username }]};

			__db.curriculum.findOne(findCvQuery, (error, cv) => {
				if (error || cv) {
					const duplicate = cv.email == data.email ? 'error.emailAlreadyTaken' : 'error.usernameAlreadyTaken';

					reject(error || duplicate);
				}

				__db.curriculum.save(data, (error, state) => {
					error ? reject(error) : resolve(state);
				});
			});
		});
	},

	update(email, data, options = { upsert: false }) {
		return new Promise((resolve, reject) => {
			delete data._id;

			__db.curriculum.update({ email: email }, { $set: { ...data } }, options, (error, status) => {
				__ngrams.updateCvSearchIndex(email);

				(!error && status.ok) ? resolve(status) : reject(error || `Error: DB Query Status: ${status.ok}`);
			});
		});
	},

	updateOrCreate(email, data, options = { upsert: true}) {
		return this.update(email, data, options);
	},

	lock(cv, photo = undefined) {
		username = typeof cv === 'string' ? cv : cv.username;
		photo = photo ? photo : cv.basics.photo;

		return {
			locked: true,
			passwordProtected: true,
			username: username,
			background: cv.background,
			basics: {
				photo: photo,
			},
		};
	},

	incViewCounter(email) {
		__db.curriculum.update({ email: email }, { $inc: { views: 1 } });
	},
};
