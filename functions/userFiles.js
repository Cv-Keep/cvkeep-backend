const config = require('../config');
const usersPublicFolder = `../public/files/users`;
const __utils = require('./utils.js');

module.exports = {
	saveOnUsersPublicFolder(userId, file, subfolder) {
		return new Promise((resolve, reject) => {
			const dest = `${usersPublicFolder}/${userId}/${subfolder}/${file.name}`
				.split('//').join('/');

			file.mv(dest)
				.then(resolve(dest))
				.catch(reject);
		});
	},

	uploadAvatar(userMongoId, file) {
		return new Promise(async (resolve, reject) => {
			if (__utils.bytesToMB(file.size) > config.uploadMaxFileSizeMB) {
				return reject('error.maxUploadFileSizeExceeded');
			}

			file.name = `avatar.${file.name.split('.')[1] || ''}`;

			__utils.rmdir(`${usersPublicFolder}/${userMongoId}/avatar/`);

			this.saveOnUsersPublicFolder(userMongoId, file, '/avatar/')
				.then(result => {
					const resultURL = __utils.urlTo(result);

					resolve(resultURL);
				})
				.catch(reject);
		});
	},
};
