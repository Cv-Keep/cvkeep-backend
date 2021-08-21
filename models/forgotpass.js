const mongoose = require('mongoose');

const ForgotPassSchema = new mongoose.Schema({
	hash: { type: String },
	email: { type: String },
	created: { type: Date },
});

module.exports = mongoose.model('forgotpass', ForgotPassSchema, 'forgotpass');
