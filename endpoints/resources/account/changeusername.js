const log = require('logflake')('change-username');
const { fnUser, fnEmail, fnUtils, fnBadwords, fnActionUrl } = require('../../../functions/');

module.exports = async (req, res) => {
	const newUsername = req.body.username;
	const currentUsername = req.$user.username;
	const currentUserEmail = req.$user.email;

	const sendError = (error, status = 403) => {
		log('error', status, error);

		return res.status(status).json({
			allowed: false,
			errors: res.i18n.t(error),
		});
	};

	const validations = [
		{
			statusCode: 403,
			message: 'error.doLoginToExecuteAction',
			test: () => currentUsername && currentUsername.trim().length,
		},
		{
			statusCode: 403,
			message: 'error.mustSpecifyUsername',
			test: () => newUsername && newUsername.trim().length,
		},
		{
			statusCode: 403,
			message: 'error.notDataToModify',
			test: () => newUsername !== currentUsername,
		},
		{
			statusCode: 403,
			message: 'error.usernameWithInvalidChars',
			test: () => newUsername === fnUtils.slugify(newUsername),
		},
		{
			statusCode: 403,
			message: 'error.usernameMaxLengthExceeded',
			test: () => newUsername.length <= 32,
		},
		{
			statusCode: 403,
			message: 'error.badwordsOnUsername',
			test: () => !fnBadwords.isProfane(newUsername),
		},
		{
			statusCode: 403,
			message: 'error.usernameAlreadyTaken',
			test: async () => !await fnUser.get({ username: newUsername }),
		},
	];

	for (let i = 0; i < validations.length; i++) {
		const validation = validations[i];

		if (!await validation.test()) {
			return sendError(validation.message, validation.statusCode);
		}
	}

	const actionUrl = await fnActionUrl.create({
		user: currentUserEmail,
		run: 'willChangeUsername',
		args: [currentUserEmail, newUsername],
	}).catch(error => sendError(error, 500));

	fnEmail.send({
		to: currentUserEmail,
		locale: res.i18n.locale,
		template: 'change-username',
		subject: res.i18n.t('changeUsername'),
		actionUrl,
		newUsername,
		currentUsername,
	}).catch(error => sendError(error, 500));

	res.status(200).json({
		updated: true,
		errors: false,
		status: 'done',
	});
};
