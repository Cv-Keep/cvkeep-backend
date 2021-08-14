const fs = require('fs');
const nodemailer = require('nodemailer');
const config = require('./../../config');

module.exports = {
	validateSendOptions(options) {
		return options.to && options.subject;
	},

	getMailer() {
		return nodemailer.createTransport(config.mailer);
	},

	getLayout(locale) {
		return fs.readFileSync(`${__dirname}/templates/layout-${locale}.hbs`, 'utf8');
	},

	getTemplate(folder, filename, locale) {
		return fs.readFileSync(`${__dirname}/templates/${folder}/${filename}-${locale}.hbs`, 'utf8');
	},

	getDefaults() {
		return {
			date: new Date(),
			remote: config.clientURL,
			locale: config.defaultLang,
			brandName: config.brandName,
			from: `"${config.brandName}" <${config.noReplyEmailAddress}>`,
		};
	},
};
