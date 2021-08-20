const log = require('logflake')('auth-guard');
const config = require('../../../../config/');
const { fnAuth } = require('../../../../functions/');

module.exports = async (req, res, next) => {
	const logged = req.signedCookies[config.jwtCookieName] || req.token;

	const sendError = (error = 'error.doLoginToExecuteAction', status = 403) => {
		log('error', status, error);

		return res.status(status).send({
			auth: false,
			message: error,
		});
	};

	if (!logged) {
		return sendError();
	}

	fnAuth.verifyToken(logged)
		.then(user => {
			if (!user) {
				return sendError();
			}

			req.$user = user;
			next();
		})
		.catch(error => {
			fnAuth.signOut(res, 500);
			sendError(error, 500);
		});
};
