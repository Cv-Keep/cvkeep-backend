const log = require('logflake')('change-privacy');
const { fnCv, fnUser } = require('../../../functions/');

module.exports = async (req, res) => {
	const userEmail = req.$user.email;
	const privacy = req.body.privacy;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(400).json({
			updated: false,
			errors: [error],
		});
	};

	const cvPrivacy = {
		allowPublicMessages: privacy.allowPublicMessages,
		passwordProtected: privacy.cvPasswordProtected.enabled,
	};

	if (!privacy || !userEmail) {
		return sendError('error.notEnoughDataOrMalformedRequest');
	}

	const userUpdateStatus = await fnUser.update(userEmail, { privacy })
		.catch(error => sendError(error, 500));

	const cvUpdateStatus = await fnCv.update(userEmail, cvPrivacy)
		.catch(error => sendError(error, 500));

	userUpdateStatus && cvUpdateStatus ?
		res.status(200).json({ updated: true, errors: false }) :
		sendError('error.internalUnexpectedError', 500);
};
