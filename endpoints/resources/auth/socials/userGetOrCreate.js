const md5 = require('md5');
const { fnCv, fnUser } = require(`../../../../functions`);

module.exports = (email) => {
	return new Promise(async (resolve, reject) => {
		if (!email) {
			reject();
		}

		let user = await fnUser.get(email).catch(reject);

		if (user && user.email && !user.active) {
			await fnUser.reactivate(email).catch(reject);

			if (!user) {
				return reject();
			}
		}

		if (!user || !user.email) {
			const userName = md5(`${Date.now()}.${email}.${Math.random().toString(32)}`);

			user = await fnUser.create({
				email,
				active: true,
				username: userName,
				fullname: ghUser.name,
			}).catch(reject);

			const createdCv = await fnCv.create({
				email,
				username: userName,
				basics: { fullname: ghUser.name },
			}).catch(reject);

			if (!createdCv.basics.photo) {
				createdCv.basics.photo = ghUser.body.avatar_url;
			}

			if (!user && !createdCv) {
				return reject('error.internalUnexpectedError');
			}

			delete user.password;
			delete user.confirmPassword;
		}

		resolve(user);
	});
};
