const { fnUser } = require('../../../functions/');

module.exports = (req, res) => {
	const userEmail = req.$user.email;
	const avatar = req.files ? req.files.avatar : req.body.avatar;

	if (!userEmail.trim() || !req.$user.username || !avatar) {
		return res.status(400).json({
			error: res.i18n.t('error.internalUnexpectedError'),
		});
	}

	fnUser.setAvatar(userEmail, avatar)
		.then(resource => res.status(200).json({ error: false, avatarUrl: resource }))
		.catch(error => res.status(400).json({ error: res.i18n.t(error), avatarUrl: null }));
};
