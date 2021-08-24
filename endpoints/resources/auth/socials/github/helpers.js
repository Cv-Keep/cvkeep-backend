const request = require('superagent');
const config = require('../../../../../config');

module.exports = {
	getAccessToken(ghCode, ghClientId, ghClientSecret) {
		return new Promise((resolve, reject) => {
			request.post('https://github.com/login/oauth/access_token')
				.send({ code: ghCode, client_id: ghClientId, client_secret: ghClientSecret })
				.set('Accept', 'application/json')
				.then(response => {
					const data = response.body;

					data.error ? reject(data.error) : resolve(data.access_token);
				})
				.catch(reject);
		});
	},

	getUser(accessToken) {
		return new Promise((resolve, reject) => {
			request.get('https://api.github.com/user')
				.set('Authorization', `token ${accessToken}`)
				.set('User-Agent', config.brandName)
				.set('Accept', 'application/json')
				.then(response => {
					const data = response.body;

					data.error ? reject(data.error) : resolve(data);
				})
				.catch(reject);
		});
	},

	getUserEmail(accessToken) {
		return new Promise((resolve, reject) => {
			request.get('https://api.github.com/user/emails')
				.set('Authorization', `token ${accessToken}`)
				.set('User-Agent', config.brandName)
				.set('Accept', 'application/json')
				.then(response => {
					const data = response.body;
					const userEmail = data.find(item => item.primary);
					data.error ? reject(data.error) : resolve(userEmail ? userEmail.email : null);
				})
				.catch(reject);
		});
	},
};
