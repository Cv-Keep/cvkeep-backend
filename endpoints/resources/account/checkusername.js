const log = require('logflake')('check-username');
const { fnUser, fnUtils, fnBadwords } = require('../../../functions/');

module.exports = (req, res) => {
	const username = req.body.username || req.query.username;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).json({
			allowed: false,
			message: res.i18n.t(error),
		});
	};

	const errorFound = [
		{
			statusCode: 400,
			message: 'error.noSpecifiedUsername',
			test: () => username || !username.trim().length,
		},
		{
			statusCode: 400,
			message: 'error.usernameWithInvalidChars',
			test: () => username === fnUtils.slugify(username),
		},
		{
			statusCode: 403,
			message: 'error.badwordsOnUsername',
			test: () => !fnBadwords.isProfane(username),
		},
	].find(item => !item.test());

	if (errorFound) {
		return sendError(errorFound.message, errorFound.statusCode);
	}

	fnUser.get({ username: username })
		.then(userExists => {
			const message = res.i18n.t(userExists ? 'error.usernameUnvailable' : 'success.usernameAvailable');

			return res.status(200).json({ allowed: !userExists, message });
		})
		.catch(error => sendError(error, 500));
};
