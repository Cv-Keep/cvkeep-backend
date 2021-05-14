const {
	__user,
	__email,
	__log,
	__actionUrl,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const newEmail = req.body.email;
	const currentEmail = req.$user.email;

	new Promise((resolve, reject) => {
		if (!newEmail || !currentEmail) {
			reject('error.notEnoughDataToOperation');
		}

		if (!__email.areValidEmails([newEmail, currentEmail])) {
			reject('error.atLeastOneEmailIsInvalid');
		}

		__user.get(currentEmail)
			.then(resolve)
			.catch(reject);
	})
		.then(user => {
			return new Promise(async (resolve, reject) => {
				if (!user) {
					reject('error.userNotFoundOnDatabase');
				}

				if (!user.password) {
					reject('error.mustDefinePasswordToAlterEmail');
				}

				hasUser = await __user.get(newEmail).catch(reject);
				hasRegistering = await __user.isRegistering(newEmail).catch(reject);
				newEmailIsAvailable = !hasUser && !hasRegistering;

				newEmailIsAvailable ? resolve(true) : reject('error.emailNotAvailableToUse');
			});
		})
		.then(() => {
			return new Promise(async (resolve, reject) => {
				const actionUrl = await __actionUrl.create({
					user: currentEmail,
					run: 'willChangeEmail',
					args: [currentEmail, newEmail],
				}).catch(reject);

				resolve(actionUrl);
			});
		})
		.then(actionUrl => {
			__email.send({
				to: currentEmail,
				template: 'change-email',
				subject: `Trocar de E-Mail`,
				actionUrl,
				newEmail,
				currentEmail,
				locale: res.i18n.locale,
			});

			return res.status(200).json({ updated: true, errors: false });
		})
		.catch(error => {
			__log.error(error);

			res.status(400).json({ allowed: false, errors: [res.i18n.t(error)] });
		});
};
