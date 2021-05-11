const __db = require(`${__basedir}/database/`);
const { __ngrams } = require(`${__basedir}/functions/`);

module.exports = async (req, res) => {
	res.connection.setTimeout(300000);

	const subject = req.query.subject || '';
	const search = `${subject} ${__ngrams.generate(subject).join(' ')}`;

	const page = (Number(req.query.page) || 0);
	const offset = Number(req.query.offset) || 100;

	// index

	await __db.cvSearchIndex.createIndex(
		{
			'ngrams': 'text',
			'rawtext': 'text',
		},
		{
			weights: {
				ngrams: 10,
				rawtext: 5,
			},
			name: 'TextIndex',
		},
	);

	// search results

	const result = await new Promise((resolve, reject) => {
		const cb = (err, docs) => err ? reject(err) : resolve(docs);

		__db.cvSearchIndex.aggregate([
			{
				$match: {
					locked: false,
					searchable: true,

					$text: {
						$search: search,
						$caseSensitive: false,
						$diacriticSensitive: false,
					},
				},
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
		], cb);
	});

	// count total items

	const totalCount = await new Promise((resolve, reject) => {
		const cb = (err, docs) => err ? reject(err) : resolve(docs);

		__db.cvSearchIndex
			.find({
				locked: false,

				$text: {
					$search: search,
					$caseSensitive: false,
					$diacriticSensitive: false,
				},
			})
			.count(cb);
	});

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
