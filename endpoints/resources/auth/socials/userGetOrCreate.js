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

			const createdCv = await fnCv.create({
				email,
				username: userName,
			}).catch(reject);

			user = await fnUser.create({
				email,
				active: true,
				username: userName,
				cvId: createdCv._id,
				contact: { publicEmail: email },
			}).catch(reject);

			if (!user && !createdCv) {
				return reject('error.internalUnexpectedError');
			}

			delete user.password;
			delete user.confirmPassword;
		}

		resolve(user);
	});
};
