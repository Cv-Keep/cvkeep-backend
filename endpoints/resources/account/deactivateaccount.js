const {
	__user,
	__email,
	__debug,
	__actionUrl,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	if (!req.$user.email) {
		return res.status(400).json({ errors: res.i18n.t('error.invalidActionOrMalformedAction') });
	}

	const givenPassword = req.body.pass;

	new Promise(async (resolve, reject) => {
		const user = await __user.get(req.$user.email).catch(reject);

		if (!user) {
			return res.status(404).json({ errors: 'error.userNotFound' });
		}

		if (!user.password) {
			return res.status(400).json({ errors: 'error.mustCreatePasswordToDoIt' });
		}

		if (user && user.password) {
			const encodedPass = __user.encodePassword(givenPassword);
			const canDelete = __user.passwordsMatch(encodedPass, user.password);

			resolve(canDelete);
		}
	})
		.then(canDelete => {
			return new Promise(async (resolve, reject) => {
				if (canDelete) {
					const actionUrl = await __actionUrl.create({
						user: req.$user.email,
						run: 'willDeactivateAccount',
						args: [req.$user.email],
					}).catch(reject);

					resolve(actionUrl);
				} else {
					return res.status(403).send(res.i18n.t('error.invalidPassword'));
				}
			});
		})
		.then(actionUrl => {
			__email.send({
				to: req.$user.email,
				actionUrl,
				locale: res.i18n.locale,
				subject: 'Desativar a conta',
				template: 'deactivate-account',
			});

			res.status(200).json({ errors: false, status: 'done' });
		})
		.catch(error => {
			__debug.error(error);

			return res.status(500).json({ errors: res.i18n.t(error) });
		});
};
