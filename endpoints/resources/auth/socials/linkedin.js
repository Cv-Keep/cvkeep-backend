const config = require(`${__basedir}/config`);
const request = require('superagent');
const md5 = require('md5');
const Entities = require('html-entities').XmlEntities;

const {
	__cv,
	__user,
	__auth,
	__debug,
	__utils,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const inResponse = req.query;

	if (inResponse.error) {
		if (['user_cancelled_login', 'user_cancelled_authorize'].includes(inResponse.error)) {
			return res.redirect(`${config.clientURL}`);
		} else {
			__debug.error(inResponse);

			const message = inResponse.error_description || 'Erro inesperado';

			return __utils.errorPage(res, new Entities().decode(message));
		}
	} else {
		if (!inResponse.code) {
			__utils.errorPage(res, res.i18n.t('error.linkedInUnauthorizedLogin'));
		}

		new Promise((resolve, reject) => {
			request.post('https://www.linkedin.com/oauth/v2/accessToken')
				.send({
					code: inResponse.code,
					grant_type: 'authorization_code',
					redirect_uri: 'http://localhost:5000/auth/linkedin',
					client_id: config.social_login.linkedin.client_id,
					client_secret: config.social_login.linkedin.client_secret,
				})
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.then(resp => {
					const data = resp.body;
					data.error ? reject(data.error) : resolve(data);
				})
				.catch(reject);
		})
			.then(data => {
				inResponse.token = data.access_token;

				return new Promise((resolve, reject) => {
					request.get('https://api.linkedin.com/v2/me')
						.set('Authorization', `Bearer ${inResponse.token}`)
						.set('Connection', 'Keep-Alive')
						.then(resp => {
							const user = JSON.parse(resp.text);
							resolve(user);
						})
						.catch(reject);
				});
			})
			.then(user => {
				return new Promise((resolve, reject) => {
					request.get(`https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`)
						.set('Authorization', `Bearer ${inResponse.token}`)
						.set('Connection', 'Keep-Alive')
						.then(resp => {
							try {
								user.emailAddress = resp.body.elements.map(item => item['handle~'].emailAddress)[0];
								resolve(user);
							} catch (error) {
								reject(error);
							}
						})
						.catch(reject);
				});
			})
			.then(user => {
				return new Promise((resolve, reject) => {
					/* eslint-disable-next-line */
					request.get(`https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~digitalmediaAsset:playableStreams))`)
						.set('Authorization', `Bearer ${inResponse.token}`)
						.set('Connection', 'Keep-Alive')
						.then(resp => {
							try {
								/**
               * The LinkedIn API has a very strange response for Profile Picture,
               * a huge and non-sense object will be provided. Here is a "one-liner"
               * reducer to transform it into an array of strings containing only
               * useful pics URLs. Good luck and dont panic!
               */
								const pics = resp.body.profilePicture['displayImage~'].elements
									.map(item => item.identifiers)
									.map(idfs => idfs.map(item => item.identifier))
									.reduce((acc, val) => acc.concat(val), []);

								user.pics = pics;
								resolve(user);
							} catch (error) {
								reject(error);
							}
						})
						.catch(reject);
				});
			})
			.then(inUser => {
				return new Promise((resolve, reject) => {
					const userEmail = inUser.emailAddress;
					const username = md5(`${Date.now()}.${userEmail}.${inUser.id}`);
					const fullname = `${inUser.localizedFirstName} ${inUser.localizedLastName}`;

					__user.get(userEmail).then(async cvUser => {
						if (cvUser) {
							resolve(cvUser);
						} else {
							const credentials = {
								active: true,
								email: userEmail,
								username: username,
								fullname: fullname,
							};

							const curriculum = {
								email: userEmail,
								username: username,
								basics: {
									role: 'Ocupação',
									fullname: fullname,
								},
							};

							if (inUser.pics.length) {
								curriculum.basics.photo = inUser.pics[inUser.pics.length - 1];
							}

							const newUser = await __user.create(credentials).catch(reject);
							await __cv.create(curriculum).catch(reject);

							resolve(newUser);
						}
					});
				});
			})
			.then(async user => {
				const logged = await __auth.signIn(user, res);

				if (logged) {
					return res.redirect(`${config.clientURL}/cv/`);
				} else {
					return __utils.errorPage(res, res.i18n.t('error.couldNotLogin'));
				}
			})
			.catch(error => {
				__debug.error(error);

				return __utils.errorPage(res, res.i18n.t(error) || 'error.internalUnexpectedError');
			});
	}
};
