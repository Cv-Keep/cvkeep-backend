const jwt = require('./jwt');
const config = require('../config');
const log = require('logflake')('auth');
const fnUser = require('./user.js');

module.exports = {
	signIn(credentials, res) {
		return new Promise((resolve, reject) => {
			const maxAge = 365 * 24 * 60 * 60 * 1000;

			if (!credentials.email || !credentials.username) {
				return reject(res.i18n.t('error.invalidLoginAttempt'));
			}

			if (!credentials.active) {
				fnUser.reactivate(credentials.email);
			}

			try {
				const token = jwt.sign(credentials);

				res.cookie(config.jwtCookieName, token, {
					httpOnly: true,
					maxAge: maxAge,
					signed: true,
					secure: true,
					sameSite: 'none',
				});

				resolve({
					token,	
					logged: true,
					messages: [],
					user: credentials,
				});
			} catch (error) {
				log('error', error);

				reject(error);
			}
		});
	},

	async getLoggedUser(req) {
		const token = req.signedCookies[config.jwtCookieName] || req.token;

		return token && await this.verifyToken(token)
			.catch(error => {
				log('error', `Error while verifying token: `, error);
			});
	},

	signOut(res, statusCode = 200) {
		return res.status(statusCode).cookie(config.jwtCookieName, '', {
			maxAge: 0,
			signed: true,
			secure: true,
			httpOnly: true,
			sameSite: 'none',
		});
	},

	verifyToken(token) {
		return jwt.verify(token);
	},
};
