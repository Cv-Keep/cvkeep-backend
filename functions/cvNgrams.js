const fnNgrams = require('./ngrams.js');
const Credentials = require('../models/credentials.js');
const Curriculum = require('../models/curriculum.js');
const CvSearchIndex = require('../models/cvsearchindex.js');

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
			data.username,
		].join(' ').trim();

		return fnNgrams.generate(ngramsIndexes);
	},

	_generateCvRawText(data) {
		const rawTextIndexes = [
			data.skills,
			data.prizes,
			data.location,
			data.education,
			data.languages,
			data.username,
			data.experience,
			data.basics.role,
			data.basics.fullname,
			data.portfolio.introduction,
			data.presentation.description,
		];

		return this._flatObjectStrings(rawTextIndexes);
	},

	async updateCvSearchIndex(userEmail) {
		const options = { upsert: true, multi: true };

		const user = await new Promise((resolve, reject) => {
			Credentials.findOne({ email: userEmail }, (err, doc) => {
				err ? reject(err) : resolve(doc);
			});
		});

		return new Promise((resolve, reject) => {
			Curriculum.findOne({ email: userEmail }, (err, data) => {
				if (err) return reject(err);

				const toInsert = {
					cvId: data._id,
					email: data.email,
					active: user.active,
					username: data.username,
					searchable: data.searchable || false,
					passwordProtected: data.passwordProtected,
					ngrams: this._generateCvNgrams(data).join(' '),
					rawtext: this._generateCvRawText(data).join(' '),
				};

				CvSearchIndex.findOneAndUpdate({ cvId: data._id }, { $set: {...toInsert} }, options, (err, doc) => {
					err ? reject(err, doc) : resolve(doc);
				});
			});
		});
	},

	searchCvByNgrams(subject, page, offset) {
		return new Promise((resolve, reject) => {
			const searchFor = `${subject} ${fnNgrams.generate(subject).join(' ')}`;

			const match = {
				active: true,
				searchable: true,
				passwordProtected: false,

				$text: {
					$search: searchFor,
					$caseSensitive: false,
					$diacriticSensitive: false,
				},
			};

			CvSearchIndex.aggregate([
				{
					$match: match,
				},
				{
					$sort: {
						score: {
							$meta: 'textScore',
						},
					},
				},
				{
					$lookup: {
						as: 'cv',
						localField: 'cvId',
						foreignField: '_id',
						from: Curriculum.collection.collectionName,
					},
				},
				{
					$project: {
						'cv.username': 1,
						'cv.color': 1,
						'cv.basics': 1,
						'cv.availability': 1,
						'cv.location': 1,
						'score': { $meta: 'textScore' },
					},
				},
				{
					$skip: (page * offset),
				},
				{
					$limit: offset,
				},
			]).exec(async (error, docs) => {
				if (error) {
					return reject(error);
				}

				const total = await CvSearchIndex
					.find(match).estimatedDocumentCount();

				resolve({ result: docs, count: total });
			});
		});
	},
};
