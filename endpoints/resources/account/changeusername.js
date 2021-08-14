const log = require('logflake')('change-username');

const {
	__user,
	__email,
	__utils,
	__badwords,
	__actionUrl,
} = require('../../../functions/');

module.exports = (req, res) => {
	const newUsername = req.body.username;
	const currentUsername = req.$user.username;
	const currentUserEmail = req.$user.email;

	new Promise(async (resolve, reject) => {
		if (!currentUsername || !currentUsername.length) {
			reject('error.doLoginToExecuteAction');
		}

		if (!newUsername || !newUsername.length) {
			reject('error.mustSpecifyUsername');
		}

		if (newUsername == currentUsername) {
			reject('error.notDataToModify');
		}

		if (newUsername != __utils.slugify(newUsername)) {
			reject('error.usernameWithInvalidChars');
		}

		if (newUsername.length > 32) {
			reject('error.usernameMaxLengthExceeded');
		}

		if (__badwords.isProfane(newUsername)) {
			reject('error.badwordsOnUsername');
		}

		const usernameAlreadyExists = await __user.get({ username: newUsername });
		!usernameAlreadyExists ? resolve(true) : reject('error.usernameAlreadyTaken');
	})
		.then(async () => {
			return new Promise(async (resolve, reject) => {
				const actionUrl = await __actionUrl.create({
					user: currentUserEmail,
					run: 'willChangeUsername',
					args: [currentUserEmail, newUsername],
				}).catch(reject);

				resolve(actionUrl);
			});
		})
		.then(actionUrl => {
			__email.send({
				to: currentUserEmail,
				locale: res.i18n.locale,
				template: 'change-username',
				subject: `Trocar nome de usuário`,
				actionUrl,
				newUsername,
				currentUsername,
			})
				.catch(console.error); ;

			res.status(200).json({ updated: true, errors: false, status: 'done' });
		})
		.catch(error => {
			log('error', error);

			res.status(403).json({ allowed: false, errors: res.i18n.t(error || 'error.internalUnexpectedError') });
		});
};
