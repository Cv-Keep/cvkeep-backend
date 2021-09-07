const { generateKeyPair } = require('crypto');
const JwtSecrets = require('../../models/jwtsecrets.js');

module.exports = {
	getJwtRSAKeys() {
		return new Promise(async (resolve, reject) => {
			try {
				const rsa = await JwtSecrets.findOne() || await this.createJwtSecrets();

				rsa ? resolve(rsa) : reject(null);
			} catch (error) {
				reject(error);
			}
		});
	},

	createJwtSecrets() {
		return new Promise(async (resolve, reject) => {
			const newRsaKeys = await this.generateRSAKeyPair()
				.catch(reject);

			if (newRsaKeys) {
				const created = new JwtSecrets(newRsaKeys);
				await created.save();

				resolve(created);
			}
		});
	},

	generateRSAKeyPair() {
		return new Promise((resolve, reject) => {
			generateKeyPair('rsa', {
				modulusLength: 4096,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
				},
			}, (error, publicKey, privateKey) => {
				error ? reject(error) : resolve({ publicKey, privateKey });
			});
		});
	},
};
