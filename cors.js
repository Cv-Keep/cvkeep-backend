const cors = require('cors');
const config = require('./config');

module.exports = {
	getAllowedOrigins() {
		const defaultAllowedOrigins = [config.clientURL, config.serverURL];
		const extraAllowedOrigins = String(config.extraAllowedOrigins || '').split(' ');

		return [...defaultAllowedOrigins, ...extraAllowedOrigins]
			.filter(item => item.length)
			.map(item => new URL(item).origin);
	},


	corsMiddle() {
		return cors({
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

			origin: (origin, callback) => {
				const allowedOrigins = this.getAllowedOrigins();
				const reqOrigin = origin ? new URL(origin).origin : '';

				if (origin && !allowedOrigins.includes(reqOrigin)) {
					return callback(new Error('Origin blocked by CORS policy.'), false);
				}
				console.log('CORS ACCPETED', origin);
				return callback(null, true);
			},
		});
	},

	guard(app) {
		app.use(this.corsMiddle());

		app.use((req, res, next) => {
			const origin = req.get('origin');
			console.log('CORS ACCPETED', origin);
			const allowedOrigins = this.getAllowedOrigins();
			const allowThisOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

			res.header('Access-Control-Allow-Origin', allowThisOrigin);
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

			next();
		});
	},
};
