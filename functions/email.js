const mailer = require(`./mailer`);
const validator = require('email-validator');

module.exports = {

	/**
   * data: {
   *  to: String // destination
   *  subject: String // email subject
   *  template: String // email template
   *  content: String // direct content in case of not has template
   *  ... // if you pass a template, add other data if needed here
   * }
   *
   * @param {Object} data
   */
	send(data) {
		return mailer.send(data);
	},

	isValidEmail(email) {
		return validator.validate(email);
	},

	areValidEmails(arrayOfEmails) {
		return arrayOfEmails.filter(validator.validate).length > 0;
	},

	confirmationEmailsMatch(email, confirmation) {
		if (!email || !confirmation) {
			return false;
		}

		if (email != confirmation) {
			return false;
		}

		if (!this.areValidEmails([email, confirmation])) {
			return false;
		}

		return true;
	},
};
