const log = require('logflake')('action-url');

const {
	__auth,
	__utils,
	__actionUrl,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	let action = undefined;
	const hash = req.params.hash;

	return new Promise((resolve, reject) => {
		try {
			action = __actionUrl.decodeActionUrl(hash);
		} catch (error) {
			reject(error);
		}

		__actionUrl.perform(action)
			.then(resolve)
			.catch(reject);
	}).then(() => {
		let successMessage = res.i18n.t('success.actionUrlExec');

		if (action.method === 'willDeactivateAccount') {
			successMessage = res.i18n.t('success.accountDeactivated');
		}

		__auth.signOut(res, 200);

		return __utils.successPage(res, successMessage, 'disconnectAllTabs');
	}).catch(error => {
		log('error',  error);

		return __utils.errorPage(res, res.i18n.t(error));
	});
};
