const cors = require('cors');
const config = require('./config');

module.exports = app => {
	app.use(cors({
		credentials: true,
		preflightContinue: true,
		methods: ['GET', 'POST', 'PUT', 'OPTIONS'],

		origin: (origin, callback) => {
			const reqOrigin = origin ? new URL(origin).origin : '';
			const defaultAllowedOrigins = [config.clientURL, config.serverURL];
			const extraAllowedOrigins = String(config.extraAllowedOrigins || '').split(' ');

			const allowedOrigins = [...defaultAllowedOrigins, ...extraAllowedOrigins]
				.map(item => new URL(item).origin)
				.filter(item => item.length);

			if (origin && !allowedOrigins.includes(reqOrigin)) {
				return callback(new Error('Origin blocked by CORS policy.'), false);
			}

			return callback(null, true);
		},
	}));
};
