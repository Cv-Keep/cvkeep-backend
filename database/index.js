const mongojs = require('mongojs');
const config = require('../config');
const { __debug } = require('../functions/');

/** db instance **/

const db = mongojs(`${config.mongo.url}/${config.mongo.database}`);

/** collections **/

db.collection('application');
db.collection('registering');
db.collection('credentials');
db.collection('curriculum');
db.collection('forgotpass');
db.collection('visitors');
db.collection('cvSearchIndex');

/** events */

db.on('error', function(error) {
	__debug.error('FATAL: Database Error ', error);
});

/** -------------------------------- **/

module.exports = db;
