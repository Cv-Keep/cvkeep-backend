const log = require('logflake')('changepass');
const { fnUser, fnEmail, fnActionUrl } = require('../../../functions/');

module.exports = async (req, res) => {
	const givenNewPass = req.body.new_pass;
	const givenCurrentPass = req.body.current_pass;
	const userEmail = req.$user.email;

	const sendError = (error, status = 403) => {
		log('error', status, error);

		return res.status(status).json({
			updated: false,
			status: 'failed',
			errors: res.i18n.t(error),
		});
	};

	if (!givenNewPass || !givenCurrentPass || !userEmail) {
		return sendError('error.notEnoughDataOrMalformedRequest');
	}

	const user = await fnUser.get(userEmail)
		.catch(error => sendError(error, 500));

	const errorFound = [
		{
			statusCode: 404,
			message: 'error.userNotFound',
			test: () => !!user,
		},
		{
			statusCode: 403,
			message: 'error.incorrectCurrentPassword',
			test: () => user.hasPassword && fnUser.encodePassword(givenCurrentPass) === user.password,
		},
		{
			statusCode: 403,
			message: 'error.passwordMinLength',
			test: () => givenNewPass.length >= 8,
		},
		{
			statusCode: 400,
			message: 'error.noDataChanged',
			test: () => req.$user.hasPassword && givenNewPass !== givenCurrentPass,
		},
	].find(item => !item.test());

	if (errorFound) {
		return sendError(errorFound.message, errorFound.statusCode);
	}

	const actionUrl = await fnActionUrl.create({
		user: userEmail,
		run: 'willChangePassword',
		args: [userEmail, givenNewPass],
	}).catch(error => sendError(error, 500));

	fnEmail.send({
		actionUrl,
		to: userEmail,
		locale: res.i18n.locale,
		template: user.hasPassword ? 'change-password' : 'create-password',
		subject: res.i18n.t(user.hasPassword ? 'changePassword' : 'createPassword'),
	}).catch(error => sendError(error, 500));

	res.status(200).json({
		updated: true,
		errors: false,
		status: 'done',
	});
};
