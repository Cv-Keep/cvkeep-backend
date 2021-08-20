const log = require('logflake')('action-url');
const { fnAuth, fnUtils, fnActionUrl } = require('../../../functions/');

module.exports = async (req, res) => {
	const hash = req.params.hash;
	let action = undefined;

	const sendError = error => {
		log('error', error);

		return fnUtils.errorPage(res, res.i18n.t(error));
	};

	try {
		action = fnActionUrl.decodeActionUrl(hash);
	} catch (error) {
		sendError(error);
	}

	fnActionUrl.perform(action)
		.then(() => {
			const isDeactivating = action.method === 'willDeactivateAccount';
			const successMessage = res.i18n.t(isDeactivating ? 'success.accountDeactivated' : 'success.actionUrlExec');

			fnAuth.signOut(res, 200);
			return fnUtils.successPage(res, successMessage, 'disconnectAllTabs');
		})
		.catch(sendError);
};
