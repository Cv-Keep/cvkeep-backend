const {
	__user,
	__debug,
	__utils,
	__badwords,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const username = req.body.username || req.query.username;

	new Promise((resolve, reject) => {
		if (!username || !username.length) {
			reject('error.noSpecifiedUsername');
		}

		if (username != __utils.slugify(username)) {
			reject('error.usernameWithInvalidChars');
		}

		if (__badwords.isProfane(username)) {
			reject('error.badwordsOnUsername');
		}

		__user.get({ username: username })
			.then(user => {
				resolve(user);
			})
			.catch(reject);
	})
		.then(user => {
			const message = res.i18n.t(user ? 'success.usernameUnvailable' : 'success.usernameAvailable');

			return res.status(200).json({ allowed: !user, message });
		})
		.catch(error => {
			__debug.error(error);

			return res.status(400).json({ message: res.i18n.t(error), allowed: false });
		});
};
