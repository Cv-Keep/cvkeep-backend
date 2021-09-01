const { fnUser } = require('../../../functions');

module.exports = (req, res) => {
	const sendError = (error, status = 403) => {
		return res.status(status).json({ sucess: false, error: res.i18n.t(error) });
	};

	if (!req.$user) {
		return sendError('error.invalidRequest');
	}

	fnUser.removeAvatar(req.$user.email )
		.then(() => res.status(200).json({ error: false, success: true }))
		.catch(error => sendError(error, 500));
};
