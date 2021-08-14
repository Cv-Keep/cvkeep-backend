const log = require('logflake')('auth-guard');
const config = require(`${__basedir}/config`);
const { __auth } = require(`${__basedir}/functions/`);

module.exports = (req, res, next) => {
	const logged = req.signedCookies[config.jwtCookieName] || req.token;

	new Promise((resolve, reject) => {
		if (!logged) reject(null);

		__auth.verifyToken(logged)
			.then(user => {
				user ? resolve(user) : reject(null);
			})
			.catch(error => {
				__auth.signOut(res, 403);
				reject(error);
			});
	})
		.then(user => {
			req.$user = user;
			next();
		})
		.catch(error => {
			log('error',  error);

			const message = res.i18n.t(error || 'error.doLoginToExecuteAction');

			return res.status(403).send({ auth: false, message });
		});
};
