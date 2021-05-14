const request = require('superagent');
const md5 = require('md5');
const querystring = require('querystring');

const {
	__cv,
	__user,
	__auth,
	__utils,
	__log,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	new Promise((resolve, reject) => {
		if (req.body.fb.status != 'connected') {
			reject(`${res.i18n.t('error.facebookStatusErrorReturned')}: "${req.body.fb.status}"`);
		} else {
			const fbCredentials = req.body.fb.authResponse || {};

			const fbUserQuery = querystring.stringify({
				pretty: 0,
				sdk: 'joey',
				method: 'get',
				suppress_http_code: 1,
				access_token: fbCredentials.accessToken,
				fields: ['id', 'email', 'name', 'picture.width(300)'].join(','),
			});

			request.get(`https://graph.facebook.com/v7.0/${fbCredentials.userID}?${fbUserQuery}`)
				.then(resp => {
					fbUserData = JSON.parse(resp.text);
					const isSecure = fbUserData.id === fbCredentials.userID;
					isSecure ? resolve(fbUserData) : reject('error.invalidLoginAttempt');
				});
		}
	})
		.then(data => {
			return new Promise((resolve, reject) => {
				__user.get(data.email).then(async user => {
					if (user) {
						if (!user.active) {
							await __user.reactivate(user.email).catch(reject);
						}

						resolve(user);
					} else {
						const username = md5(`${Date.now()}.${data.email}.${data.id}`);
						const curriculum = __utils.schema('curriculum');

						curriculum.email = data.email;
						curriculum.username = username;
						curriculum.basics.fullname = data.name;

						const credentials = {
							active: true,
							email: data.email,
							username: username,
							fullname: data.name,
						};

						if (!curriculum.basics.photo) {
							curriculum.basics.photo = data.picture.data.url;
						}

						const newUser = await __user.create(credentials).catch(reject);
						await __cv.create(curriculum).catch(reject);

						resolve(newUser);
					}
				}).catch(reject);
			});
		})
		.then(async user => {
			const signed = await __auth.signIn(user, res);
			return signed ? res.status(200).json(signed) : res.status(403).send(res.i18n.t('error.couldNotLogin'));
		})
		.catch(error => {
			__log.error(error);

			res.status(403).send(res.i18n.t(error || 'error.internalUnexpectedError'));
		});
};
