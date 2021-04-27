const helpers = require('./helpers.js');
const mailer = helpers.getMailer();
const Handlebars = require('handlebars');
const config = require(`${__basedir}/config`);

module.exports = {

	/**
	 * options: {
	 * 	 to: String,
	 *   subject: String,
	 *	 template: String,
	 *   ...
	 * }
	 */
	send(options) {
		const locale = options.locale || config.defaultLang;

		if (!helpers.validateSendOptions(options)) return false;
		if (options.content) return this.sendRaw(options);

		['html', 'text'].forEach(item => {
			const template = options.template || 'default';
			const content = helpers.getTemplate(template, item, locale);
			Handlebars.registerPartial('content', content);

			const source = helpers.getLayout(locale);
			const emailBuilder = Handlebars.compile(source);

			options[item] = emailBuilder({
				isHtml: item === 'html',
				...helpers.getDefaults(),
				...options,
			});
		});

		return this.dispatch(options);
	},

	/**
	 * options: {
	 * 	 to: String,
	 *   subject: String,
	 *	 content: String,
	 * }
	 */
	sendRaw(options) {
		if (options.content) {
			options.html = options.content;
			options.text = options.content;
		}

		this.dispatch(options);
	},

	/**
	 * call the current mailer to send email with
	 * the given options overriden by defaults
	 *
	 * @param {mailer options} options
	 */
	dispatch(options) {
		return mailer.sendMail({
			...helpers.getDefaults(),
			...options,
		}).catch(console.error);
	},
};
