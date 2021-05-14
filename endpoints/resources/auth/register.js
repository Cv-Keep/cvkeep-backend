const {
	__log,
	__user,
	__email,
} = require(`${__basedir}/functions/`);

module.exports = async (req, res) => {
	let newUser = req.body;

	const email = newUser.email;
	const emailConfirmation = newUser.email_confirmation;

	new Promise((resolve, reject) => {
		if (!__email.confirmationEmailsMatch(email, emailConfirmation)) {
			reject('error.invalidEmailOrConfirmationEmail');
		}

		if (!__email.areValidEmails([email, emailConfirmation])) {
			reject('error.invalidEmailOrConfirmationEmail');
		}

		resolve(true);
	}).then(() => {
		return new Promise(async (resolve, reject) => {
			const userExists = await __user.get(email).catch(reject);
			const thereIsARegistration = await __user.isRegistering(email).catch(reject);

			if (userExists) {
				reject('error.emailNotAvailableToUse');
			}

			if (thereIsARegistration) {
				newUser = thereIsARegistration;
			} else {
				newUser.registering = {
					renewed: 0,
					email: email,
					created: new Date(),
					hash: __user.createRegisteringHash(email),
				};
			}

			resolve({ isNew: !thereIsARegistration });
		});
	}).then(registration => {
		return new Promise(async (resolve, reject) => {
			let status = undefined;

			if (registration.isNew) {
				status = await __user.register(newUser)
					.catch(reject);
			} else {
				status = await __user.updateRegistering(newUser)
					.catch(reject);
			}

			resolve({
				error: false,
				status: status,
				message: res.i18n.t(registration.isNew ? 'success.registrationEmailSent' : 'error.alreadyRegistering'),
			});
		});
	})
		.then(result => {
			__email.send({
				template: 'register',
				locale: res.i18n.locale,
				to: newUser.registering.email,
				hash: newUser.registering.hash,
				subject: res.i18n.t('success.registeringEmailSubject'),
			});

			return res.status(200).json(result);
		}).catch(error => {
			__log.error(error);

			res.status(403).json({ errors: res.i18n.t(error) });
		});
};
