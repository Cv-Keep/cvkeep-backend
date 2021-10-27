const log = require('logflake')('save-cv');
const { fnCv } = require('../../../functions/');

module.exports = async (req, res) => {
	const loggedUser = req.$user;
	const curriculum = fnCv.sanitizeCv(req.body.curriculum);
	const isValidLoggedUser = loggedUser && loggedUser.email && loggedUser.username;
	const isValidCurriculum = curriculum && curriculum.username && (loggedUser.username === curriculum.username);

	const sendError = (error, details, status = 500) => {
		log('error', error, details, status);

		return res.status(status).json({
			details,
			errors: [res.i18n.t(error)],
		});
	};

	if (!isValidLoggedUser || !isValidCurriculum) {
		const errorDetails = {
			isValidUser: isValidLoggedUser,
			isValidCv: isValidCurriculum,
		};

		return sendError('error.youHaveNoPermission', errorDetails, 403);
	}

	fnCv.update(loggedUser.email, curriculum)
		.then(() => res.status(200).json({ errors: false, saved: true }))
		.catch(error => {
			log('error', error);

			return sendError('error.internalUnexpectedError', {}, 500);
		});
};
