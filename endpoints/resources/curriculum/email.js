const log = require('logflake')('cv-mail');
const { fnUser, fnEmail } = require('../../../functions/');

module.exports = (req, res) => {
	const clientData = req.body;
	const to = clientData.to;

	/**
   * this is a honeypot check, the original input names
   * that are not friendly names, if any friendly name was
   * filled, a spammer has been caught because it was an
   * automatically filling. lets return a fake 200 response.
   */
	['name', 'email', 'subject', 'message'].forEach(item => {
		if (clientData[item]) {
			return res.status(200).send({});
		}
	});

	// ---------------------------------------------------

	new Promise(async (resolve, reject) => {
		if (!to) {
			reject('error.noEmailDestiny');
		}

		if (!clientData['n_001'] || !clientData['e_001'] || !clientData['s_001'] || !clientData['m_001']) {
			reject('error.notEnoughDataToOperation');
		}

		if (!await fnEmail.checkMX(clientData['e_001'])) {
			reject('error.atLeastOneEmailIsInvalid');
		}

		const user = await fnUser.get({ username: to }).catch(reject);
		user ? resolve(user) : reject(res.i18n.t('error.noEmailDestiny'));
	})
		.then(user => {
			if (user.privacy.allowPublicMessages) {
				fnEmail.send({
					...clientData,
					to: user.email,
					subject: `Novo Contato!`,
					template: 'cv-contact',
					locale: res.i18n.locale,
				})
					.catch(error => {
						log('error', error);

						res.status(500).send(res.i18n.t(error)).end();
					});
			} else {
				res.status(403).send(res.i18n.t('error.actionProtectedByPrivacyConfig')).end();
			}
		})
		.catch(error => {
			log('error', error);

			res.status(400).send(res.i18n.t(error)).end();
		});
};
