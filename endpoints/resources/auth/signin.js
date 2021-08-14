const {
	__user,
	__auth,
} = require('../../../functions/');

module.exports = (req, res) => {
	const credentials = req.body;

	new Promise((resolve, reject) => {
		if (!credentials.email || !credentials.password) {
			reject('error.requiredUserAndPassword');
		}

		__user.get(credentials.email)
			.then(user => {
				user ? resolve(user) : reject('error.invalidUserOrPassword');
			});
	})
		.then(user => {
			return new Promise((resolve, reject) => {
				const encodedPass = __user.encodePassword(credentials.password);
				const passwordOk = __user.passwordsMatch(encodedPass, user.password);

				passwordOk ? resolve(user) : reject('error.invalidUserOrPassword');
			});
		})
		.then(async user => {
			const logged = await __auth.signIn(user, res);

			res.status(200).json(logged);
		}).catch(error => {
			res.status(403).json({errors: [res.i18n.t(error)]} || res.i18n.t('internalUnexpectedError'));
		});
};
