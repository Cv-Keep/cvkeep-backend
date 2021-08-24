const log = require('logflake')('gh-login');
const config = require('../../../../../config');
const ghHelpers = require('./helpers.js');
const userGetOrCreate = require('../userGetOrCreate.js');
const { fnAuth, fnUtils } = require('../../../../../functions');

module.exports = async (req, res) => {
	const ghCode = req.query.code;
	const ghClientId = config.social_login.github.client_id;
	const ghClientSecret = config.social_login.github.client_secret;

	const sendError = error => {
		error && log('error', error);

		return fnUtils.errorPage(res, res.i18n.t(error || 'error.internalUnexpectedError'));
	};

	if (!ghCode) {
		return sendError('error.noGithubAccessCode');
	}

	const ghAccessToken = await ghHelpers.getAccessToken(ghCode, ghClientId, ghClientSecret)
		.catch(error => {
			log('error', error);
		});

	const ghUser = ghAccessToken && await ghHelpers.getUser(ghAccessToken)
		.catch(error => {
			log('error', error);
		});

	const ghUserEmail = ghAccessToken && await ghHelpers.getUserEmail(ghAccessToken)
		.catch(error => {
			log('error', error);
		});

	if (!ghAccessToken || !ghUser || !ghUserEmail) {
		return sendError();
	}

	// ------------------------------------------------------------------------------

	const user = await userGetOrCreate(ghUserEmail)
		.catch(error => {
			log('error', error);
		});

	const signed = user && await fnAuth.signIn(user.toObject(), res)
		.catch(error => {
			log('error', error);
		});

	return signed ?
		res.redirect(`${config.clientURL}/cv/${user.username}`) :
		sendError('error.couldNotLogin');
};
