const log = require('logflake')('gh-login');
const config = require('../../../../config/');
const request = require('superagent');
const md5 = require('md5');

const {
	__cv,
	__user,
	__auth,
	__utils,
} = require('../../../../functions/');

module.exports = (req, res) => {
	const code = req.query.code;

	if (!code) {
		return __utils.errorPage(res, res.i18n.t('error.noGithubAccessCode'));
	} else {
		new Promise((resolve, reject) => {
			request.post('https://github.com/login/oauth/access_token')
				.send({
					code,
					client_id: config.social_login.github.client_id,
					client_secret: config.social_login.github.client_secret,
				})
				.set('Accept', 'application/json')
				.then(resp => {
					const data = resp.body;
					data.error ? reject(data.error) : resolve(data);
				})
				.catch(reject);
		}).then(data => {
			return new Promise((resolve, reject) => {
				request.get('https://api.github.com/user')
					.set('Authorization', `token ${data.access_token}`)
					.set('User-Agent', config.brandName)
					.then(resp => {
						const user = JSON.parse(resp.text);
						user.access_token = data.access_token;
						resolve(user);
					})
					.catch(reject);
			});
		}).then(user => {
			return new Promise((resolve, reject) => {
				request.get('https://api.github.com/user/emails')
					.set('Authorization', `token ${user.access_token}`)
					.set('User-Agent', config.brandName)
					.then(resp => {
						user.emails = JSON.parse(resp.text);
						resolve(user);
					})
					.catch(reject);
			});
		}).then(ghUser => {
			return new Promise((resolve, reject) => {
				const userEmail = ghUser.email || ghUser.emails.filter(item => item.primary)[0].email;
				const username = md5(`${Date.now()}.${userEmail}.${ghUser.id}`);

				__user.get(userEmail).then(async cvUser => {
					if (cvUser) {
						resolve(cvUser);
					} else {
						const credentials = {
							active: true,
							email: userEmail,
							username: username,
							fullname: ghUser.name,
						};

						const curriculum = {
							email: userEmail,
							username: username,
							basics: {
								role: 'Developer',
								fullname: ghUser.name,
								photo: ghUser.avatar_url,
							},
						};

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
				log('error', error);

				return __utils.errorPage(res, res.i18n.t(error) || 'error.internalUnexpectedError');
			});
	}
};
