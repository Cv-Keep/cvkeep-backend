const log = require('logflake')('db');
const mongoose = require('mongoose');
const config = require('./../config');

mongoose.connect(config.mongoURI, {
	poolSize: 100,
	useCreateIndex: true,
	useNewUrlParser: true,
	useFindAndModify: false,
	useUnifiedTopology: true,
	socketTimeoutMS: 1800000,
});

const db = mongoose.connection;
db.on('error', error => log('error', error));

module.exports = db;
