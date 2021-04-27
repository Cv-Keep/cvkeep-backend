const chalk = require('chalk');

module.exports = {
	isActive() {
		const flag = process.env.DEBUG;

		return flag && (flag.includes('express:*') || flag.includes('__app'));
	},

	error(refError) {
		const prefix = chalk.red.bold('DEBUG LOG (ERR):');

		if (typeof refError === 'string') {
			refError = new Error(refError).stack;
		}

		this.isActive() && console.error(`${prefix} ${refError}`);
	},
};
