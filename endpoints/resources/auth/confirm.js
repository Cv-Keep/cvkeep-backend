const log = require('logflake')('confirm-registration');
const { fnCv, fnAuth, fnUser, fnBadwords } = require('../../../functions/');

module.exports = async (req, res) => {
	const hash = req.body.hash;
	const credentials = req.body.credentials;

	const sendError = (error, status = 400) => {
		log('error', status, error);

		return res.status(status).json({ errors: res.i18n.t(error) });
	};

	if (!hash) {
		return sendError('error.looksLikeYouAreLost');
	}

	if (req.$user) {
		return sendError('error.youMustSignOut');
	}

	fnUser.getRegisteringByHash(hash)
		.then(async newUser => {
			const validations = [
				{
					statusCode: 400,
					message: 'error.invalidHashOrNoAssociatedUser',
					test: async () => !!newUser,
				},
				{
					statusCode: 403,
					message: 'error.userAlreadyOnDatabase',
					test: async () => !await fnUser.get(newUser.registering.email),
				},
				{
					statusCode: 403,
					message: 'error.badwordsOnUsername',
					test: async () => !fnBadwords.isProfane(newUser),
				},
			];

			for (let i = 0; i < validations.length; i++) {
				const validation = validations[i];

				if (!await validation.test()) {
					return sendError(validation.message, validation.statusCode);
				}
			}

			/**
			 * When client sends only a hash and no credentials,
			 * we only validate the hash and sent the result back
			 */
			if (hash && !credentials) {
				return res.status(200).json({
					ok: true,
					hashOk: true,
					email: newUser.registering.email,
				});
			}

			if (!credentials.password === credentials.confirmPassword) {
				return reject('error.invalidPassword');
			}

			const createdCv = await fnCv.create({
				username: credentials.username,
				email: newUser.registering.email,
			})
				.catch(sendError);

			const createdUser = await fnUser.create({
				active: true,
				cvId: createdCv._id,
				username: credentials.username,
				email: newUser.registering.email,
				password: fnUser.encodePassword(credentials.password),
			})
				.catch(sendError);

			if (createdCv && createdUser) {
				const newUser = createdUser.toObject();

				delete newUser.password;
				delete newUser.confirmPassword;

				fnAuth.signIn(newUser, res)
					.then(logged => {
						fnUser.removeRegistering(hash);

						return res.status(200).json({
							logged,
							ok: true,
							user: newUser,
						});
					})
					.catch(sendError);
			} else {
				sendError('error.internalUnexpectedError', 500);
			}
		})
		.catch(sendError);
};
