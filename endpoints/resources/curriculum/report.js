const log = require('logflake')('report');
const config = require('../../../config/');
const { fnEmail } = require('../../../functions/');

module.exports = (req, res) => {
	const data = req.body;

	const sendError = (error, status) => {
		log('error', status, error);

		return res.status(status).send(res.i18n.t(error));
	};

	/**
	 * THis is a honeypot strategy. Bots tends to fullfill
	 * simple fields named as email, name, pass, etc. our
	 * real email field has an strange name, if the email
	 * field has been filled it is a bot because this field
	 * is hiddden on the page
	 */
	if (!data || (data.email && data.email.length)) {
		sendError('error.invalidRequest', 400);
	}

	data.email = data['emailxvalsdjf392u3nHskd1'];
	// -----------------------------------------------------

	try {
		fnEmail.send({
			to: config.reportEmailAddress,
			subject: `CV Report From : ${data.email}`,
			template: 'cv-report',
			locale: res.i18n.locale,
			...data,
		})
			.catch(error => log('error', error));

		res.status(200).send(res.i18n.t('success.requestSent'));
	} catch (error) {
		sendError(error, 500);
	}
};
