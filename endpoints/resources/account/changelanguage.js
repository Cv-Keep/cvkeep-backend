const {
	__cv,
	__user,
} = require(`${__basedir}/functions/`);

module.exports = async (req, res) => {
	if (!req.$user) {
		res.status(403).send(res.i18n.t('error.userMustBeLogged'));
	}

	if (!req.body.lang) {
		res.status(400).send(res.i18n.t('error.languageNotDefined'));
	} else {
		res.i18n.locale = req.body.lang;
	}

	try {
		await __cv.update(req.$user.email, { lang: req.body.lang });
		await __user.update(req.$user.email, { lang: req.body.lang });
	} catch (err) {
		return res.status(500).send(res.i18n.t('error.failToChangeLanguage')).end();
	}

	return res.status(200).send(res.i18n.t('success.languageSuccessfullyChanged'));
};
