const log = require('logflake')('cv-searchable');
const { fnCv } = require('../../../functions/');

module.exports = async (req, res) => {
	const userEmail = req.$user.email;
	const searchable = Boolean(req.body.searchable);

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(400).json({
			updated: false,
			errors: [error],
		});
	};

	if (!userEmail) {
		return sendError('error.notEnoughDataOrMalformedRequest');
	}

	const cvUpdateStatus = await fnCv.update(userEmail, { searchable })
		.catch(error => sendError(error, 500));

	cvUpdateStatus ?
		res.status(200).json({ updated: true, errors: false }) :
		sendError('error.internalUnexpectedError', 500);
};
