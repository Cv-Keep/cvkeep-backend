const config = require(`${__basedir}/config`);
const chalk = require('chalk');

module.exports = {
	isActive() {
		return config.debug &&
			(config.debug.includes('express:*') ||
			config.debug.toLowerCase().trim() === 'true');
	},

	error(refError) {
		const prefix = chalk.red.bold('DEBUG LOG (ERR):');

		if (typeof refError === 'string') {
			refError = new Error(refError).stack;
		}

		this.isActive() && console.error(`${prefix} ${refError}`);
	},
};
