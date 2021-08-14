const config = require(`${__basedir}/config`);

module.exports = {
	isActive() {
		return config.debug &&
			(config.debug.includes('express:*') ||
			config.debug.toLowerCase().trim() === 'true');
	},

	error(refError, namespace = 'APP') {
		const log = require('logflake')(namespace);
		this.isActive() && log('error', refError);
	},

	info(info, namespace = 'APP') {
		const log = require('logflake')(namespace);
		this.isActive() && log('info', info);
	},
};
