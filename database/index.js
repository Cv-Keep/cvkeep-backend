const mongojs = require('mongojs');
const config = require('./../config');

/** db instance **/

const db = mongojs(config.mongoURI);

/** collections **/

db.collection('application');
db.collection('registering');
db.collection('credentials');
db.collection('curriculum');
db.collection('forgotpass');
db.collection('visitors');
db.collection('cvSearchIndex');

/** events */

db.on('error', error => {
	console.error('FATAL: Database Error ', error);
});

/** -------------------------------- **/

module.exports = db;
