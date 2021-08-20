const log = require('logflake')('signin');
const { fnUser, fnAuth } = require('../../../functions/');

module.exports = async (req, res) => {
	const credentials = req.body;

	const sendError = (error, status = 403) => {
		log('error', status, error);

		return res.status(status).json({
			errors: [res.i18n.t(error)],
		});
	};

	if (!credentials.email || !credentials.password) {
		return sendError('error.requiredUserAndPassword');
	}

	const user = await fnUser.get(credentials.email)
		.catch(error => sendError(error, 500));

	if (!user) {
		return sendError('error.invalidUserOrPassword');
	}

	const encodedPass = fnUser.encodePassword(credentials.password);
	const passwordOk = fnUser.passwordsMatch(encodedPass, user.password);

	if (!passwordOk) {
		return sendError('error.invalidUserOrPassword');
	}

	const logged = await fnAuth.signIn(user.toObject(), res);
	res.status(200).json(logged);
};
