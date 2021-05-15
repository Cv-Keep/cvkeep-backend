const cors = require('cors');
const config = require('./config');

module.exports = app => {
	app.use(cors({
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

		origin: (origin, callback) => {
			const reqOrigin = origin ? new URL(origin).origin : '';
			const defaultAllowedOrigins = [config.clientURL, config.serverURL];
			const extraAllowedOrigins = String(config.extraAllowedOrigins || '').split(' ');

			const allowedOrigins = [...defaultAllowedOrigins, ...extraAllowedOrigins]
				.filter(item => item.length)
				.map(item => new URL(item).origin);

			if (origin && !allowedOrigins.includes(reqOrigin)) {
				return callback(new Error('Origin blocked by CORS policy.'), false);
			}

			return callback(null, true);
		},
	}));

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		next();
	});
};
