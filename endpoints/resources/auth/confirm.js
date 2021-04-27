const {
	__cv,
	__auth,
	__user,
	__utils,
	__debug,
	__badwords,
} = require(`${__basedir}/functions/`);

module.exports = (req, res) => {
	const hash = req.body.hash;
	const credentials = req.body.credentials;

	new Promise((resolve, reject) => {
		if (!hash) {
			reject('error.looksLikeYouAreLost');
		}

		if (req.$user) {
			reject('error.youMustSignOut');
		}

		__user.getRegisteringByHash(hash)
			.then(resolve)
			.catch(reject);
	}).then(newUser => {
		return new Promise(async (resolve, reject) => {
			let userAlreadyExists = false;

			if (__badwords.isProfane(newUser)) {
				reject('error.badwordsOnUsername');
			}

			if (!newUser) {
				reject('error.invalidHashOrNoAssociatedUser');
			} else {
				userAlreadyExists = await __user.get(newUser.registering.email).catch(reject);
			}

			if (userAlreadyExists) {
				await __user.removeRegistering(hash).catch(reject);

				reject('error.userAlreadyOnDatabase');
			} else {
				resolve(newUser);
			}
		});
	}).then(newUser => {
		return new Promise(async (resolve, reject) => {
			if (!credentials) {
				return res.status(200).json({ ok: true, hashOk: true });
			}

			const registrationValid = __utils.secsToDays(newUser.registering.created) <= 2;

			if (registrationValid) {
				resolve(newUser);
			} else {
				++newUser.registering.renewed;
				newUser.registering.created = new Date();
				newUser.registering.temp_pass = __user.generateRandomPassword();
				newUser.registering.hash = __user.createRegisteringHash(newUser.registering.email);

				__user.updateRegistering(newUser).catch(reject);

				reject('error.expiredRegistrationConfirmationLink');
			}
		});
	}).then(newUser => {
		return new Promise(async (resolve, reject) => {
			const passwordsMatch = credentials.password === credentials.confirmPassword;

			if (!passwordsMatch) {
				return reject('error.invalidPassword');
			}

			const newUserCV = __utils.schema('curriculum');

			newUserCV.email = newUser.registering.email;
			newUserCV.username = credentials.username;

			credentials.active = true;
			credentials.email = newUser.registering.email;
			credentials.fullname = newUserCV.basics.fullname;
			credentials.password = __user.encodePassword(credentials.password);

			delete credentials.confirmPassword;

			await __cv.create(newUserCV).catch(reject);
			await __user.create(credentials).catch(reject);

			resolve(true);
		});
	}).then(async () => {
		delete credentials.password;

		await __auth.signIn(credentials, res);

		return res.status(200).json({ ok: true, user: credentials });
	}).catch(error => {
		__debug.error(error);

		res.status(400).json({ errors: res.i18n.t(error) }).end();
	});
};
