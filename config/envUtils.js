const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const stage = process.env.NODE_ENV || '';

module.exports = {
	getEnv(debug = false) {
		const env = process.env;
		const envPath = this.getEnvPath();
		const envContent = this.getEnvContent(envPath);
		const dotEnv = this.parseEnv(envContent, debug);

		return Object.assign(env, dotEnv);
	},

	getEnvPath() {
		const useDotLocal = !stage && fs.existsSync(path.resolve(__dirname, '..', `.env.local`));
		const envFileName = useDotLocal ? '.env.local' : `.env${ stage ? '.' + stage : '' }`;

		return path.resolve(__dirname, '..', envFileName);
	},

	getEnvContent(envPath) {
		return fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
	},

	parseEnv(envContent, debug) {
		const envJsonNotations = envContent.match(/{([^}])*}\s}|\{([^}])*}.*/gm);

		envJsonNotations && envJsonNotations.forEach(objNotation => {
			// remove line breaks from all json notations on the env
			const objNotationMinified = objNotation
				.replace(/\r?\n|\r/g, '')
				.replace(/  +/g, '')
				.replace(/\t/g, '');

			envContent = envContent.replace(objNotation, objNotationMinified);
		});

		return dotenv.parse(envContent, { debug });
	},
};
