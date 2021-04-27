const config = require(`${__basedir}/config`);
const __user = require('./user.js');
const __encryption = require('./encryption.js');

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
   * This function will return am URL that executes you method with
   * you given arguments when requested. The URL runs only once.
   *
   * @param {String} userEmail
   * @param {String} method
   * @param {Array} args
   *
   * @return {String} hash
   */
	create(params) {
		const userEmail = params.user;
		const method = params.run;
		const args = params.args;

		return new Promise(async (resolve, reject) => {
			const user = await __user.get(userEmail).catch(reject);

			if (user) {
				const pendingUrlActions = user.pendingUrlActions;

				pendingUrlActions[method] = {
					method,
					userEmail: userEmail,
					arguments: typeof args != 'object' ? [args] : args,
				};

				await __user.update(userEmail, { pendingUrlActions }, { upsert: true }).catch(reject);
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
			const user = await __user.get(userEmail).catch(reject);
			const pendingUrlActions = user && user.pendingUrlActions ? user.pendingUrlActions : false;
			const action = user && pendingUrlActions[method] ? pendingUrlActions[method] : false;

			if (user && action) {
				delete pendingUrlActions[method];
				await __user.update(userEmail, { pendingUrlActions });

				resolve(this[method](...action.arguments));
			} else {
				reject('error.noUserHashOrAction');
			}
		});
	},

	encodeActionUrl(params) {
		const baseUrl = config.serverURL;
		const paramsAsText = JSON.stringify(params);
		const hashUrl = __encryption.encText(paramsAsText);

		return `${baseUrl}/hash-action/${hashUrl}`;
	},

	decodeActionUrl(url) {
		const baseUrl = config.serverURL;
		const encoded = url.toLowerCase().replace(`${baseUrl}/hash-action/`);
		const decoded = __encryption.decText(encoded);

		return JSON.parse(decoded);
	},

	// actions -----------------------------------------------

	willChangeUsername(userEmail, newUsername) {
		return __user.changeUsername(userEmail, newUsername);
	},

	willChangePassword(userEmail, newPass) {
		return __user.changePassword(userEmail, newPass);
	},

	willChangeEmail(userEmail, newEmail) {
		return __user.changeEmail(userEmail, newEmail);
	},

	willDeactivateAccount(userEmail) {
		return __user.deactivateAccount(userEmail);
	},
};
