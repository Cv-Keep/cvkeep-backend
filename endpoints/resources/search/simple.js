const { fnCvNgrams } = require('../../../functions/');

module.exports = async (req, res) => {
	res.connection.setTimeout(300000);

	const subject = req.query.subject || '';
	const page = Number(req.query.page) || 0;
	const offset = Number(req.query.offset) || 100;

	const searched = await fnCvNgrams.searchCvByNgrams(subject, page, offset)
		.catch(error => res.status(500).json({ error, failed: true }));

	console.log(searched);

	res.status(200).json({
		page,
		search: subject,
		items: searched.result,
		totalItems: searched.count,
		isLastPage: page >= Math.floor(searched.count / offset),
		totalPages: searched.count > offset ? Math.floor(searched.count / offset) : 0,
	});
};
