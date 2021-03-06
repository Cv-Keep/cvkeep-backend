const log = require('logflake')('forgot-pass');
const { fnUser } = require('../../../functions/');

module.exports = async (req, res) => {
	const task = req.body.task;
	const hash = req.body.hash;
	const pass = req.body.password;
	const email = req.body.email;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).json({
			ok: false,
			errors: res.i18n.t(error),
		});
	};

	const sendResOk = () => res.status(200).json({
		ok: true,
		errors: false,
	});

	// IF CREATING A NEW FORGOTTEN PASS EMAIL REQUEST

	if (task === 'create' && email) {
		await fnUser.forgotPass(email, res)
			.catch(error => sendError(error, 500));

		return sendResOk();
	}

	// IF RECEIVED ONLY THE HASH TO VALIDATE

	if (task === 'validate') {
		const forgotPassData = await fnUser.getForgotPassCompleteData(hash);
		const isValidHash = forgotPassData.isValidHash;

		return isValidHash ?
			sendResOk() :
			sendError('error.passwordRecoveryExpiredToken', 403);
	}

	// IF RESETING THE PASS BASED ON EXISTENT HASH

	if (task === 'reset' && hash && pass) {
		const forgotPassData = await fnUser.getForgotPassCompleteData(hash);
		const isValidHash = forgotPassData.isValidHash;
		const user = forgotPassData.user;

		if (!forgotPassData.forgotPassObj && !hash && !pass) {
			return sendError('error.noDataToProcess');
		}

		if (!isValidHash) {
			return sendError('error.invalidToken', 403);
		}

		if (user.email && !user) {
			return sendError('error.userNotFound');
		}

		await fnUser.changePassword(user.email, pass)
			.catch(error => sendError(error, 500));

		await fnUser.removeForgotPass(hash)
			.catch(error => sendError(error, 500));

		sendResOk();
	}
};
