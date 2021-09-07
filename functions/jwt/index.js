const jwt = require('jsonwebtoken');
const config = require('../../config');
const log = require('logflake')('jwt');
const jwtRsa = require('./jwtRsa.js');

/**
 * This file exports a singleton. It is initialized on app root (/index.js).
 * THis is the JWT Handler. It reads the db jwtsecrets collection for an RSA
 * key pair. If does not exists, will created and store a new one. After that,
 * the key pair is stored on the singleton and use to enc|dec new JWT tokens.
 */
class JwtHandler {
	constructor() {
		this.JWTRSA = undefined;
	}

	async registerRSA() {
		this.JWTRSA = await jwtRsa.getJwtRSAKeys()
			.catch(error => log(`Could not retrieve a valid JWT RSA key pair`, error));
	}

	decode(token) {
		return jwt.decode(token, { complete: true });
	}

	sign(payload) {
		return jwt.sign(payload, this.JWTRSA.privateKey, {
			issuer: `${config.brandName} Auth Sys`,
			expiresIn: '365d',
			algorithm: 'RS256',
		});
	}

	verify(token) {
		return new Promise((resolve, reject) => {
			jwt.verify(token, this.JWTRSA.publicKey, (error, decoded) => {
				error ? reject(error) : resolve(decoded);
			});
		});
	}
}

module.exports = new JwtHandler();
