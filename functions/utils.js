const fs = require('fs');
const rimraf = require('rimraf');
const slugifier = require('slugify');
const config = require('./../config');

module.exports = {
	errorPage(res, message) {
		message = encodeURI(message);

		return res.redirect(`${config.clientURL}/error?m=${message}`);
	},

	successPage(res, message, callback) {
		message = encodeURI(message);
		callback = callback ? `&c=${callback}` : '';

		return res.redirect(`${config.clientURL}/success?m=${message}${callback}`);
	},

	slugify(str) {
		str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

		str = slugifier(str, {
			replacement: '-',
			remove: /[*#{}?\\//[\];/,^$%+~.()'"!:@]/g,
			lower: true,
			strict: true,
		});

		str.replace(/[^\w-]+/g, '')
			.replace(/--+/g, '-')
			.replace(/^-+/, '')
			.trim();

		return str;
	},

	mkdirp(path) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
	},

	rmdir(path) {
		if (fs.existsSync(path)) {
			return rimraf.sync(path);
		}
	},

	urlTo(publicPath) {
		publicPath = publicPath.split('public/').slice(1).join('public/');

		return `${config.serverURL}/public/${publicPath}`;
	},

	bytesToMB(b) {
		return (b > 0) ? (b / 1024 / 1024).toFixed(2) : 0;
	},

	arrayUnique(array) {
		return array.filter((x, i) => i === array.indexOf(x));
	},

	daysSince(date) {
		if (!date instanceof Date) {
			date = new Date(date);
		}

		return (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
	},
};
