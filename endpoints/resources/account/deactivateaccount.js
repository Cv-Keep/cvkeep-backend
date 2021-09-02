const log = require('logflake')('deactivate');
const { fnUser, fnEmail, fnActionUrl } = require('../../../functions/');

module.exports = async (req, res) => {
	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).json({
			status: 'failed',
			errors: res.i18n.t(error),
		});
	};

	const userEmail = req.$user.email;
	const givenPassword = req.body.pass;
	const encodedPass = givenPassword && fnUser.encodePassword(givenPassword);
	const user = userEmail ? await fnUser.get(userEmail).catch(error => sendError(error, 500)) : null;

	const errorFound = [
		{
			statusCode: 400,
			message: 'error.invalidActionOrMalformedAction',
			test: () => !!user,
		},
		{
			statusCode: 403,
			message: 'error.mustCreatePasswordToDoIt',
			test: () => !!user.password,
		},
		{
			statusCode: 400,
			message: 'error.invalidPassword',
			test: () => givenPassword || !encodedPass,
		},
		{
			statusCode: 400,
			message: 'error.invalidPassword',
			test: () => fnUser.passwordsMatch(encodedPass, user.password),
		},
	].find(item => !item.test());

	if (errorFound) {
		return sendError(errorFound.message, errorFound.status);
	}

	const actionUrl = await fnActionUrl.create({
		user: userEmail,
		args: [userEmail],
		run: 'willDeactivateAccount',
	}).catch(error => sendError(error, 500));

	fnEmail.send({
		to: userEmail,
		actionUrl,
		locale: res.i18n.locale,
		template: 'deactivate-account',
		subject: rest.i18n.t('deactivateAccount'),
	}).catch(error => sendError(error, 500));

	res.status(200).json({
		errors: false,
		status: 'done',
	});
};
