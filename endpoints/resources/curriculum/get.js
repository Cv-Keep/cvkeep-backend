const log = require('logflake')('save-cv');
const { fnCv, fnAuth, fnUser, fnUtils, fnBadwords } = require('../../../functions/');

module.exports = async (req, res) => {
	const loggedUser = await fnAuth.getLoggedUser(req);
	const queryUserName = req.body.username || req.query.username;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return status === 404 ?
			res.status(404).send('404') :
			fnUtils.errorPage(res, res.i18n.t(error));
	};

	if (!queryUserName) {
		return sendError('error.notEnoughDataToOperation');
	}

	const user = await fnUser.getActiveUser({ username: queryUserName }, { sanitize: true })
		.catch(error => sendError(error, 500));

	let cv = await fnCv.get({ username: queryUserName })
		.catch(error => sendError(error, 500));

	if (!user || !cv) {
		return sendError('error.userOrCvNotFound', 404);
	}

	if (loggedUser && loggedUser.email === cv.email) {
		cv.canEdit = true;
		cv.editing = true;
	} else {
		fnCv.incViewCounter(user.email);

		cv.canEdit = false;
		cv.editing = false;

		if (cv.passwordProtected) {
			const cvUnlocked = user.privacy.cvPasswordProtected.passwords
				.includes(req.body.password || req.query.password);

			cvUnlocked ? (cv.locked = false) : (cv = fnCv.lock(cv));
		}
	}

	cv.email = undefined;
	cv.lang = user.lang;

	return res.status(200).json(fnBadwords.cleanObject(cv));
};
