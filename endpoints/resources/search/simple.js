const { fnNgrams } = require('../../../functions/');
const CvSearchIndex = require('./../../../models/cvSearchIndex.js');

module.exports = async (req, res) => {
	res.connection.setTimeout(300000);

	const subject = req.query.subject || '';
	const search = `${subject} ${fnNgrams.generate(subject).join(' ')}`;

	const page = (Number(req.query.page) || 0);
	const offset = Number(req.query.offset) || 100;

	// used for aggregate and count

	const match = {
		active: true,
		searchable: true,
		passwordProtected: false,

		$text: {
			$search: search,
			$caseSensitive: false,
			$diacriticSensitive: false,
		},
	};

	// search for results

	const result = await new Promise((resolve, reject) => {
		const cb = (err, docs) => err ? reject(err) : resolve(docs);

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
					from: 'curriculum',
					localField: 'cvId',
					foreignField: '_id',
					as: 'cv',
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
		]).exec(cb);
	});

	// count total items

	const totalCount = await CvSearchIndex
		.find(match)
		.estimatedDocumentCount();

	// send response

	res.status(200).json({
		page,
		items: result,
		search: subject,
		totalItems: totalCount,
		totalPages: Math.floor(totalCount / offset),
		isLastPage: page >= Math.floor(totalCount / offset),
	});
};
