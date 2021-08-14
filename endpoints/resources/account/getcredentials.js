const log = require('logflake')('get-credentials');
const config = require(`${__basedir}/config`);

const {
	__cv,
	__user,
	__auth,
	__utils,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	new Promise(async (resolve, reject) => {
		const logged = await __auth.getLoggedUser(req);

		if (!logged) {
			return resolve( __utils.schema('credentials', { logged: false }) );
		}

		const user = await __user.get(logged.email, { sanitize: true }).catch(reject);
		const cv = await __cv.get(logged.email).catch(reject);

		if (!user || !cv) {
			const missing = res.i18n.t(!user ? 'error.missingUser' : 'error.missingCv');

			return res
				.status(404)
				.cookie(config.jwtCookieName, '', { maxAge: 0, signed: true })
				.json({ error: true, message: missing });
		} else {
			user.logged = true;
			user.fullname = cv.basics.fullname;
			user.photo = cv.basics.photo;
		}

		resolve(user);
	})
		.then(user => {
			return res.status(200).json(user);
		})
		.catch(error => {
			log('error',  error);

			res.status(500).json(error);
		});
};
