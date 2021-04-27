const fs = require('fs');
const jwt = require('jsonwebtoken');
const config = require(`${__basedir}/config`);

const PRIVATE_KEY = fs.readFileSync(__dirname+'/rsa/private.key', 'utf8');
const PUBLIC_KEY = fs.readFileSync(__dirname+'/rsa/public.key', 'utf8');

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
