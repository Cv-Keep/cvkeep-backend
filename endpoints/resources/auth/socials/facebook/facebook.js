const log = require('logflake')('fb-login');
const fbHelpers = require('./helpers.js');
const userGetOrCreate = require('../userGetOrCreate.js');
const { fnAuth } = require(`../../../../../functions`);

module.exports = async (req, res) => {
	const fbCredentials = req.body.fb.authResponse;

	const sendError = (error, status = 403) => {
		error && log('error', status, error);

		return res.status(status).send(res.i18n.t(error || 'error.internalUnexpectedError'));
	};

	if (!fbCredentials || req.body.fb.status !== 'connected') {
		return sendError('error.facebookStatusErrorReturned');
	}

	const fbUserData = await fbHelpers.getUserData(fbCredentials.userID, fbCredentials.accessToken)
		.catch(error => {
			log('error', error);
		});

	if (!fbUserData) {
		return sendError('error.facebookStatusErrorReturned');
	}

	// ------------------------------------------------------------------------------

	const user = await userGetOrCreate(fbUserData.email)
		.catch(error => {
			log('error', error);
		});

	const signed = user && await fnAuth.signIn(user.toObject(), res)
		.catch(error => {
			log('error', error);
		});

	return signed ?
		res.status(200).json(signed) :
		sendError('error.couldNotLogin');
};
