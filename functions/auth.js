const jwt = require('./jwt');
const config = require(`${__basedir}/config`);
const __user = require('./user.js');
const log = require('logflake')('auth');

module.exports = {
	async signIn(credentials, res) {
		['email', 'username'].forEach(item => {
			if (!credentials[item]) {
				return false;
			}
		});

		let token = undefined;
		const maxAge = 365 * 24 * 60 * 60 * 1000;

		delete credentials.password;
		delete credentials.confirm_password;

		if (!credentials.active) {
			await __user.reactivate(credentials.email);
		}

		try {
			token = jwt.sign(credentials);

			res.cookie(config.jwtCookieName, token, {
				httpOnly: true,
				maxAge: maxAge,
				signed: true,
				secure: true,
				sameSite: 'none',
			});
		} catch (error) {
			log('error',  error);

			return false;
		}

		return {
			jwt: token,
			logged: true,
			messages: [],
			user: credentials,
		};
	},

	getLoggedUser(req) {
		const token = req.signedCookies[config.jwtCookieName];
		return token ? jwt.verify(token) : false;
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
