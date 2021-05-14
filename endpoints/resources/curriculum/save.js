const {
	__cv,
	__log,
	__badwords,
} = require(`${__basedir}/functions/`);

module.exports = async (req, res) => {
	const loggedUser = req.$user;
	let curriculum = req.body.curriculum;

	const isValidLoggedUser = loggedUser && loggedUser.email && loggedUser.username;
	const isValidCurriculum = curriculum && curriculum.username && (loggedUser.username === curriculum.username);

	if (!isValidLoggedUser || !isValidCurriculum) {
		return res.status(403).json({
			errors: [res.i18n.t('error.youHaveNoPermission')],
			details: { isValidUser: isValidLoggedUser, isValidCv: isValidCurriculum },
		});
	} else {
		curriculum = __badwords.cleanObject(curriculum);

		__cv.update(loggedUser.email, curriculum)
			.then(() => {
				return res.status(200).json({ errors: false, saved: true });
			})
			.catch(error => {
				__log.error(error);

				return res.status(500).json({ errors: [res.i18n.t('error.internalUnexpectedError')] });
			});
	}
};
