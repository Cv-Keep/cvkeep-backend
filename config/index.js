const path = require('path');
const stage = process.env.NODE_ENV || '';
const envUtils = require('./envUtils.js');

const env = envUtils.getEnv();
const envPath = envUtils.getEnvPath();
console.log(`Environment: "${stage}". Using .env file "${envPath}"`);

module.exports = {
	stage: stage,
	base: env.BASE,
	secret: env.APP_SECRET,
	mongoURI: env.MONGODB_URI,
	clientURL: env.CLIENT_URL,
	serverURL: env.SERVER_URL,
	brandName: env.BRAND_NAME,
	defaultLang: env.DEFAULT_LANG,
	jwtCookieName: env.JWT_COOKIE_NAME,
	mailer: JSON.parse(env.MAILER_CONFIG),
	appBaseDir: path.resolve(__dirname, '..'),
	port: process.env.PORT || Number(env.PORT),
	reportEmailAddress: env.REPORT_EMAIL_ADDRESS,
	extraAllowedOrigins: env.EXTRA_ALLOWED_ORIGINS,
	noReplyEmailAddress: env.NOREPLY_EMAIL_ADDRESS,
	uploadMaxFileSizeMB: Number(env.UPLOAD_MAX_FILE_SIZE_MB),

	rsa: {
		public: path.resolve(__dirname, '..', env.RSA_PUBLIC_KEY),
		private: path.resolve(__dirname, '..', env.RSA_PRIVATE_KEY),
	},

	social_login: {
		github: {
			client_id: env.SOCIAL_AUTH_GITHUB_CLIENT_ID,
			client_secret: env.SOCIAL_AUTH_GITHUB_CLIENT_SECRET,
		},

		linkedin: {
			client_id: env.SOCIAL_AUTH_LINKEDIN_CLIENT_ID,
			client_secret: env.SOCIAL_AUTH_LINKEDIN_CLIENT_SECRET,
		},
	},
};
