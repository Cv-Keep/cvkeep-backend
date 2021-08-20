const log = require('logflake')('change-lang');
const { fnCv, fnUser } = require('../../../functions/');

module.exports = async (req, res) => {
	const sendError = (error, status) => {
		log('error', status, error);

		return res.status(status).send(res.i18n.t(error));
	};

	if (!req.$user) {
		return sendError('error.userMustBeLogged', 403);
	}

	if (!req.body.lang) {
		sendError('error.languageNotDefined', 400);
	}

	res.i18n.locale = req.body.lang;

	await fnCv.update(req.$user.email, { lang: req.body.lang })
		.catch(error => sendError(error, 500));

	await fnUser.update(req.$user.email, { lang: req.body.lang })
		.catch(error => sendError(error, 500));

	res.status(200)
		.send(res.i18n.t('success.languageSuccessfullyChanged'));
};
