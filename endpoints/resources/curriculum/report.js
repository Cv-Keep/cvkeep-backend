const { __email } = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const data = req.body;

	if (!data || data.email && data.email.length) {
		res.status(403).send(res.i18n.t('error.invalidRequest')).end();
	} else {
		data.email = data['emailxvalsdjf392u3nHskd1'];

		try {
			__email.send({
				to: config.reportEmailAddress,
				subject: `CV Report From : ${data.email}`,
				template: 'cv-report',
				locale: res.i18n.locale,
				...data,
			})
				.catch(console.error); ;

			res.status(200).send(res.i18n.t('success.requestSent')).end();
		} catch (error) {
			res.status(500).send(error).end();
		}
	}
};
