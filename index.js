const config = require(`./config`);
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const gzip = require('compression');
const helmet = require('helmet');
const fileUploader = require('express-fileupload');
const bearerToken = require('express-bearer-token');
const i18n = require('./i18n');
const cors = require('./cors.js');

const __fn = require('./functions/');
const __db = require('./database/');

/** app && /status **/

const app = express();
const routes = require('./endpoints/routes.js');

cors.guard(app);

app.use(helmet());
app.use(bearerToken());
app.use(i18n.middleware);
app.use('/public', express.static(`${__dirname}/public`));
app.use(gzip());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(config.secret));
app.use(fileUploader({ createParentPath: true }));

app.use(config.base, routes);

/** init **/

if (config.stage === 'test') {
	app.fn = __fn;
	app.__db = __db;

	module.exports = app;
} else {
	app.listen(config.port, () => {
		console.log(`Server is running with stage "${ config.stage || 'development' }" on port ${config.port }`);
	});
}
