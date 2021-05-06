const __db = require(`${__basedir}/database/`);
const __ngrams = require('./ngrams.js');

module.exports = {
	_flatObjectStrings(obj) {
		if (!obj) return [];

		const strList = Object.keys(obj).reduce((acc, k) => {
			const value = typeof obj[k] === 'string' ? obj[k] : this._flatObjectStrings(obj[k]);

			return acc.concat(value);
		}, []);

		return [...new Set(strList)]
			.filter(k => k.length);
	},

	_generateCvNgrams(data) {
		const ngramsIndexes = [
			data.basics.fullname,
			data.basics.role,
			data.location.country,
			data.location.region,
			data.location.city,
		].join(' ').trim();

		return __ngrams.generate(ngramsIndexes);
	},

	_generateCvRawText(data) {
		const rawTextIndexes = [
			data.skills,
			data.prizes,
			data.location,
			data.education,
			data.languages,
			data.experience,
			data.basics.role,
			data.basics.fullname,
			data.portfolio.introduction,
			data.presentation.description,
		];

		return this._flatObjectStrings(rawTextIndexes);
	},

	updateCvSearchIndex(userEmail) {
		const options = { upsert: true, multi: true };

		return new Promise((resolve, reject) => {
			__db.curriculum.findOne({ email: userEmail }, (err, data) => {
				if (err) return reject(err);

				const toInsert = {
					cvId: data._id,
					email: data.email,
					locked: data.locked,
					username: data.username,
					ngrams: this._generateCvNgrams(data).join(' '),
					rawtext: this._generateCvRawText(data).join(' '),
				};

				__db.cvSearchIndex.update({ cvId: data._id }, { $set: {...toInsert} }, options, (err, doc) => {
					err && reject(err, doc);

					resolve(doc);
				});
			});
		});
	},
};
