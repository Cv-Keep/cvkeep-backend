const config = require('../config');
const fnUser = require('./user.js');
const fnEncryption = require('./encryption.js');

module.exports = {
	/**
   * Use this function to schedule an action for a given user. You
   * Must specify the following parameters:
   *
   * {
   *    user: String, // user email to schedule the action
   *    run: String,  // a method on this file to run
   *    args: Array,  // array with arguments to pass on run
   * }
   *
   * This function will return an URL that executes you method with
   * your given arguments when requested. The URL runs only once.
	 * The passed method must exists in this file, see the end of file.
   *
   * @param {String} userEmail
   * @param {String} method
   * @param {Array|Object} args
   *
   * @return {String} hash
   */
	create(params) {
		const userEmail = params.user;
		const method = params.run;
		const args = params.args;

		return new Promise(async (resolve, reject) => {
			const user = await fnUser.get(userEmail).catch(reject);

			if (user) {
				const pendingUrlActions = user.pendingUrlActions || {};

				pendingUrlActions[method] = {
					method,
					userEmail: userEmail,
					arguments: typeof args !== 'object' ? [args] : args,
				};

				await fnUser.update(userEmail, { pendingUrlActions }, { upsert: true }).catch(reject);
				const actionUrl = this.encodeActionUrl(pendingUrlActions[method]);

				resolve(actionUrl);
			} else {
				reject('error.noUserFoundForGivenEmail');
			}
		});
	},

	perform(action) {
		const method = action.method;
		const userEmail = action.userEmail;

		return new Promise(async (resolve, reject) => {
			const user = await fnUser.get(userEmail).catch(reject);
			const pendingUrlActions = user && user.pendingUrlActions ? user.pendingUrlActions : false;
			const action = user && pendingUrlActions[method] ? pendingUrlActions[method] : false;

			if (user && action) {
				delete pendingUrlActions[method];
				await fnUser.update(userEmail, { pendingUrlActions });

				resolve(this[method](...action.arguments));
			} else {
				reject('error.noUserHashOrAction');
			}
		});
	},

	encodeActionUrl(params) {
		const baseUrl = config.serverURL;
		const paramsAsText = JSON.stringify(params);
		const hashUrl = fnEncryption.encText(paramsAsText);

		return `${baseUrl}/hash-action/${hashUrl}`;
	},

	decodeActionUrl(url) {
		const baseUrl = config.serverURL;
		const encoded = url.toLowerCase().replace(`${baseUrl}/hash-action/`);
		const decoded = fnEncryption.decText(encoded);

		return JSON.parse(decoded);
	},

	// actions -----------------------------------------------

	willChangeUsername(userEmail, newUsername) {
		return fnUser.changeUsername(userEmail, newUsername);
	},

	willChangePassword(userEmail, newPass) {
		return fnUser.changePassword(userEmail, newPass);
	},

	willChangeEmail(userEmail, newEmail) {
		return fnUser.changeEmail(userEmail, newEmail);
	},

	willDeactivateAccount(userEmail) {
		return fnUser.deactivateAccount(userEmail);
	},
};
