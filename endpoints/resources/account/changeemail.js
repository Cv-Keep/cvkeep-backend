const log = require('logflake')('change-email');
const { fnUser, fnEmail, fnActionUrl } = require('../../../functions/');

module.exports = async (req, res) => {
	const newEmail = req.body.email;
	const userEmail = req.$user.email;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).json({
			allowed: false,
			updated: false,
			errors: [res.i18n.t(error)],
		});
	};

	const validations = [
		{
			statusCode: 400,
			message: 'error.notEnoughDataToOperation',
			test: () => (newEmail && userEmail),
		},
		{
			statusCode: 400,
			message: 'error.atLeastOneEmailIsInvalid',
			test: () => fnEmail.areValidEmails([newEmail, userEmail]),
		},
		{
			statusCode: 400,
			message: 'error.atLeastOneEmailIsInvalid',
			test: () => fnEmail.checkMX(newEmail),
		},
		{
			statusCode: 403,
			message: 'error.emailNotAvailableToUse',
			test: async () => !await fnUser.get(newEmail).catch(error => sendError(error, 500)),
		},
		{
			statusCode: 403,
			message: 'error.emailNotAvailableToUse',
			test: async () => !await fnUser.isRegistering(newEmail).catch(error => sendError(error, 500)),
		},
	];

	for (let i = 0; i < validations.length; i++) {
		const validation = validations[i];

		if (!await validation.test()) {
			return sendError(validation.message, validation.statusCode);
		}
	}

	const user = await fnUser.get(userEmail)
		.catch(error => sendError(error, 500));

	if (!user) {
		return sendError('error.userNotFoundOnDatabase', 404);
	}

	if (!user.password) {
		return sendError('error.mustDefinePasswordToAlterEmail', 403);
	}

	/** ---------------- can change the email ---------------- **/

	const actionUrl = await fnActionUrl.create({
		user: userEmail,
		run: 'willChangeEmail',
		args: [userEmail, newEmail],
	}).catch(error => sendError(error, 500));

	fnEmail.send({
		to: userEmail,
		template: 'change-email',
		subject: `Trocar de E-Mail`,
		actionUrl,
		newEmail,
		userEmail,
		locale: res.i18n.locale,
	}).catch(error => sendError(error, 500));

	res.status(200).json({
		updated: true,
		errors: false,
	});
};
