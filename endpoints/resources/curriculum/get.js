const log = require('logflake')('save-cv');

const {
	__cv,
	__auth,
	__user,
	__utils,
} = require('../../../functions/');

module.exports = async (req, res) => {
	const loggedUser = await __auth.getLoggedUser(req);
	const cvQueryUserName = req.body.username || req.query.username;

	if (!cvQueryUserName) {
		return res.status(400).json( req.i18n.t('error.notEnoughDataToOperation') );
	}

	new Promise((resolve, reject) => {
		__user.getActiveUser({ username: cvQueryUserName }, { sanitize: true })
			.then(user => {
				return user ? resolve(user) : res.status(404).send('404');
			})
			.catch(reject);
	}).then(user => {
		return new Promise((resolve, reject) => {
			__cv.get({ username: cvQueryUserName })
				.then(cv => {
					return cv ? resolve({ user, cv }) : res.status(404)
						.send(`${res.i18n.t('error.thereIsAUserButNoCv')} : "${cvQueryUserName}"`);
				})
				.catch(reject);
		});
	}).then(data => {
		let cv = data.cv;
		const user = data.user;

		if (loggedUser && loggedUser.email === cv.email) {
			cv.canEdit = true;
			cv.editing = true;
		} else {
			__cv.incViewCounter(user.email);

			cv.canEdit = false;
			cv.editing = false;

			if (cv.passwordProtected) {
				const cvOwnerPasswords = user.privacy.cvPasswordProtected.passwords;
				const cvUnlocked = cvOwnerPasswords.includes(req.body.password || req.query.password);

				if (cvUnlocked) {
					cv.locked = false;
				} else {
					cv = __cv.lock(cv);
				}
			}
		}

		delete cv._id;
		delete cv.email;
		cv.lang = user.lang;

		return res.status(200).json(cv);
	}).catch(error => {
		log('error', error);

		return __utils.errorPage(res, res.i18n.t(error || 'error.internalUnexpectedError'));
	});
};
