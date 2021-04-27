const messages = require('./messages');
const config = require('../config');
const i18nCreate = require('express-rest-i18n');

const i18n = i18nCreate({
	messages,
	defaultLocale: config.defaultLang,
});

module.exports = i18n;
