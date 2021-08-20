const config = require('../../../config/');
const log = require('logflake')('get-credentials');
const { fnCv, fnUser, fnAuth } = require('../../../functions/');

module.exports = async (req, res) => {
	const loggedUser = await fnAuth.getLoggedUser(req);

	/**
	 * When there is no logged user, we send an empty credential
	 * to satisfy the frontend. With no user, the request ends
	 * here, otherwise it goes on to deliver a real logged one
	 */
	if (!loggedUser) {
		const notLoggedUser = fnUser.getSchema({ logged: false });

		return res.status(200).json(notLoggedUser);
	}
	/** -------------------------------------------------------- */

	const sendError = (error, status = 500) => {
		log('error', status, error);

		return res.status(status).json(error);
	};

	const user = await fnUser.get(loggedUser.email, { sanitize: true })
		.catch(sendError);

	const cv = await fnCv.get(loggedUser.email)
		.catch(sendError);

	if (!user || !cv) {
		const missing = res.i18n.t(!user ? 'error.missingUser' : 'error.missingCv');

		return res
			.status(404)
			.cookie(config.jwtCookieName, '', { maxAge: 0, signed: true })
			.json({ error: true, message: missing });
	} else {
		user.logged = true;

		return res.status(200).json(user);
	}
};
