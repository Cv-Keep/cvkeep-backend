const {
	__cv,
	__log,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const useremail = req.$user.email;
	const searchable = Boolean(req.body.searchable);

	if (!useremail) {
		return res.status(400).json({ updated: false, errors: ['error.notEnoughDataOrMalformedRequest'] });
	}

	new Promise(async (resolve, reject) => {
		const cvUpdateStatus = await __cv.update(useremail, { searchable: searchable }).catch(reject);

		resolve({ cvUpdateStatus });
	})
		.then(status => {
			res.status(200).json({ updated: true, errors: false, status: status });
		})
		.catch(error => {
			__log.error(error);

			res.status(500).json({ updated: false, errors: [res.i18n.t(error)] });
		});
};
