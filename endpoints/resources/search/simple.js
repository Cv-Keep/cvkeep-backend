const __db = require(`${__basedir}/database/`);

module.exports = (req, res) => {
	const subject = req.query.subject || '';
	const terms = subject.split(' ').join(',');

	__db.curriculum.createIndex({ subject: '*' });

	__db.curriculum.aggregate(
		[
			{
				$match: {
					$text: {
						$search: 'nome',
					},
				},
			},
		],

		(done, error) => {
			console.log(done);
		},
	);

	res.send(terms);
};
