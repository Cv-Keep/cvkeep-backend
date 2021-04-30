const __db = require(`${__basedir}/database/`);
const { __ngrams } = require(`${__basedir}/functions/`);

module.exports = async (req, res) => {
	const subject = req.query.subject || '';
	const search = __ngrams.generate(subject).join(' ');

	__db.cvSearchIndex.createIndex({ 'ngrams': 'text' });

	const findings = await new Promise((resolve, reject) => {
		const cb = (err, docs) => err ? reject(err) : resolve(docs);

		__db.collection('cvSearchIndex')
			.find(
				{
					$text: {
						$search: search,
						$caseSensitive: false,
						$diacriticSensitive: false,
					},
				},
				{
					score: {
						$meta: 'textScore',
					},
				},
			)
			.sort(
				{
					score: {
						$meta: 'textScore',
					},
				},
				cb,
			);
	});


	res.send(findings);
};
