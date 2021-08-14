const fs = require('fs');
const jwt = require('jsonwebtoken');
const config = require('./../../config');

const PUBLIC_KEY = fs.readFileSync(config.rsa.public, 'utf8');
const PRIVATE_KEY = fs.readFileSync(config.rsa.private, 'utf8');

const JWT_OPTIONS = {
	issuer: `${config.brandName} Auth Sys`,
	expiresIn: '365d',
	algorithm: 'RS256',
};

module.exports = {

	sign: payload => {
		return jwt.sign(payload, PRIVATE_KEY, JWT_OPTIONS);
	},

	verify: (token) => {
		return new Promise((resolve, reject) => {
			jwt.verify(token, PUBLIC_KEY, (error, decoded) => {
				error ? reject(error) : resolve(decoded);
			});
		});
	},

	decode: token => {
		return jwt.decode(token, { complete: true });
	},
};
