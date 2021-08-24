const request = require('superagent');
const querystring = require('querystring');

module.exports = {
	getUserData(userID, accessToken) {
		return new Promise((resolve, reject) => {
			const fbUserQuery = querystring.stringify({
				pretty: 0,
				sdk: 'joey',
				method: 'get',
				suppress_http_code: 1,
				access_token: accessToken,
				fields: ['id', 'email', 'name', 'picture.width(300)'].join(','),
			});

			request.get(`https://graph.facebook.com/v7.0/${userID}?${fbUserQuery}`)
				.set('Accept', 'application/json')
				.then(response => {
					const data = response.body;
					data && !data.error ? resolve(data) : reject('error.invalidLoginAttempt');
				});
		});
	},
};
