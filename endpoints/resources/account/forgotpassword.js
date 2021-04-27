const {
	__user,
	__debug,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const task = req.body.task;
	const email = req.body.email;
	const hash = req.body.hash;
	const pass = req.body.password;

	if (!email && !hash && !pass) {
		return res.status(400).json({ errors: res.i18n.t('error.noDataToProcess') });
	}

	new Promise((resolve, reject) => {
		__user.get(email)
			.then(resolve)
			.catch(reject);
	}).then(user => {
		return new Promise(async (resolve, reject) => {
			if (!user) {
				reject({ errors: ['error.userNotFound'] });
			}

			// IF CREATING A NEW FORGOTTEN PASS EMAIL REQUEST

			if (task === 'create' && email) {
				await __user.forgotPass(email, res).catch(reject);
				resolve({ ok: true });
			}

			// IF SENDING ONLY THE HASH TO VALIDATE

			if (task === 'validate' && hash) {
				const isValidHash = await __user.validateForgottenPassHash().catch(reject);

				if (isValidHash) {
					resolve({ ok: true });
				} else {
					reject('error.passwordRecoveryExpiredToken');
				}
			}

			// IF RESETING THE PASS BASED ON EXISTENT HASH

			if (task === 'reset' && hash && pass) {
				const isValidHash = await __user.validateForgottenPassHash(hash).catch(reject);

				if (isValidHash) {
					await __user.changePassword(user.email, pass).catch(reject);
					await __user.removeForgotPass(hash).catch(reject);

					resolve({ ok: true });
				} else {
					reject('error.invalidToken');
				}
			};
		});
	}).then(result => {
		return result.ok ?
			res.status(200).json(result) :
			res.status(404).json({ ok: false, errors: [res.i18n.t('error.internalUnexpectedError')] });
	}).catch(error => {
		__debug.error(error);

		res.status(500).json({ errors: res.i18n.t(error) });
	}); ;
};
