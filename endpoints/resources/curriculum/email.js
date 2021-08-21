const log = require('logflake')('cv-mail');
const { fnUser, fnEmail } = require('../../../functions/');

module.exports = async (req, res) => {
	const clientData = req.body;
	const to = clientData.to;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).send(res.i18n.t(error));
	};

	/**
   * this is a honeypot check, the original input names
   * that are not friendly names, if any friendly name was
   * filled, a spammer has been caught because it was an
   * automatically filling. lets return a fake 200 response.
   */
	['name', 'email', 'subject', 'message'].forEach(item => {
		if (clientData[item]) {
			return res.status(200).send(true);
		}
	});

	// ---------------------------------------------------
	const user = to && await fnUser.get({ username: to })
		.catch(error => sendError(error, 500));

	const validations = [
		{
			statusCode: 400,
			message: 'error.noEmailDestiny',
			test: () => !!user,
		},
		{
			statusCode: 400,
			message: 'error.notEnoughDataToOperation',
			test: () => clientData['n_001'] && clientData['e_001'] && clientData['s_001'] && clientData['m_001'],
		},
		{
			statusCode: 403,
			message: 'user.privacy.allowPublicMessages',
			test: () => user.privacy.allowPublicMessages,
		},
		{
			statusCode: 403,
			message: 'error.atLeastOneEmailIsInvalid',
			test: async () => await fnEmail.checkMX(clientData['e_001']),
		},
	];

	for (let i = 0; i < validations.length; i++) {
		const validation = validations[i];

		if (!await validation.test()) {
			return sendError(validation.message, validation.statusCode);
		}
	}

	fnEmail.send({
		...clientData,
		to: user.email,
		template: 'cv-contact',
		locale: res.i18n.locale,
		subject: res.i18n.t('newContact'),
	})
		.then(() => res.status(200).send(true))
		.catch(error => {
			log('error', error);

			res.status(500).send(res.i18n.t(error)).end();
		});
};
