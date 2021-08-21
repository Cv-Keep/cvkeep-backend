const mongoose = require('mongoose');

const RegisteringSchema = new mongoose.Schema({
	email: { type: String, required: true },
	email_confirmation: { type: String, required: true },
	registering: {
		hash: { type: String },
		email: { type: String },
		created: { type: Date },
	},
});

module.exports = mongoose.model('registering', RegisteringSchema, 'registering');
