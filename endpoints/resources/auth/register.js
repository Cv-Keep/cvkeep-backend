const log = require('logflake')('register');
const { fnUser, fnEmail } = require('../../../functions/');

module.exports = async (req, res) => {
	const newUser = req.body;
	const email = newUser.email;
	const emailConfirmation = newUser.email_confirmation;

	const sendError = (error, status = 403) => {
		log('error', status, error);

		return res.status(status).json({ errors: res.i18n.t(error) });
	};

	const validations = [
		{
			statusCode: 403,
			message: 'error.invalidEmailOrConfirmationEmail',
			test: () => fnEmail.confirmationEmailsMatch(email, emailConfirmation),
		},
		{
			statusCode: 403,
			message: 'error.invalidEmailOrConfirmationEmail',
			test: () => fnEmail.areValidEmails([email, emailConfirmation]),
		},
		{
			statusCode: 403,
			message: 'error.atLeastOneEmailIsInvalid',
			test: async () => await fnEmail.checkMX(email),
		},
		{
			statusCode: 403,
			message: 'error.emailNotAvailableToUse',
			test: async () => !await fnUser.get(email),
		},
	];

	for (let i = 0; i < validations.length; i++) {
		const validation = validations[i];

		if (!await validation.test()) {
			return sendError(validation.message, validation.statusCode);
		}
	}

	fnUser.isRegistering(email)
		.then(async ongoing => {
			const allDone = (data) => {
				const message = ongoing ?
					'success.registrationEmailSent' : 'error.alreadyRegistering';

				fnEmail.send({
					template: 'register',
					locale: res.i18n.locale,
					to: data.registering.email,
					hash: data.registering.hash,
					subject: res.i18n.t('success.registeringEmailSubject'),
				})
					.catch(error => sendError(error, 500));

				return res.status(200).json({
					error: false,
					status: true,
					message: res.i18n.t(message),
				});
			};

			if (ongoing) {
				fnUser.updateRegistering(ongoing)
					.then(() => allDone(ongoing))
					.catch(error => sendError(error, 500));
			} else {
				Object.assign(newUser, {
					registering: {
						renewed: 0,
						email: email,
						created: new Date(),
						hash: fnUser.createRegisteringHash(email),
					},
				});

				fnUser.register(newUser)
					.then(() => allDone(newUser))
					.catch(error => sendError(error, 500));
			}
		})
		.catch(error => sendError(error, 500));
};
