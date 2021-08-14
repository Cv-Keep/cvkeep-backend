const log = require('logflake')('changepass');

const {
	__user,
	__email,
	__actionUrl,
} = require('../../../functions/');

module.exports = (req, res) => {
	let _user = {};

	const givenNewPass = req.body.new_pass;
	const givenCurrentPass = req.body.current_pass;
	const useremail = req.$user.email;

	new Promise((resolve, reject) => {
		if (givenNewPass.length < 8) {
			reject('error.passwordMinLength');
		}

		if (req.$user.hasPassword && givenNewPass === givenCurrentPass) {
			reject('error.noDataChanged');
		}

		__user.get(useremail)
			.then(resolve)
			.catch(reject);
	})
		.then(user => {
			_user = user;

			return new Promise((resolve, reject) => {
				if (!user) {
					reject('error.userNotFound');
				}

				if (user.hasPassword && (!givenNewPass || !givenCurrentPass)) {
					reject('error.notEnoughDataOrMalformedRequest');
				}

				if (user.hasPassword && __user.encodePassword(givenCurrentPass) != user.password) {
					reject('error.incorrectCurrentPassword');
				}

				resolve(givenNewPass);
			});
		})
		.then(newPass => {
			return new Promise(async (resolve, reject) => {
				const actionUrl = await __actionUrl.create({
					user: useremail,
					run: 'willChangePassword',
					args: [useremail, newPass],
				}).catch(reject);

				resolve(actionUrl);
			});
		})
		.then(actionUrl => {
			__email.send({
				actionUrl,
				to: useremail,
				locale: res.i18n.locale,
				template: _user.hasPassword ? 'change-password' : 'create-password',
				subject: _user.hasPassword ? 'Trocar a senha' : 'Criar uma senha',
			})
				.catch(console.error); ;

			return res.status(200).json({ updated: true, errors: false, status: 'done' });
		})
		.catch(error => {
			log('error', error);

			return res.status(400).json({ errors: res.i18n.t(error.message || error) });
		});
};
