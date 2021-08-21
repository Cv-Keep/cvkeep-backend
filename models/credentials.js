const mongoose = require('mongoose');

const CredentialsSchema = new mongoose.Schema({
	lang: { type: String, default: '' },
	photo: { type: String },
	email: { type: String, required: true },
	username: { type: String, required: true },
	password: { type: String },
	fullname: { type: String },
	logged: { type: Boolean },
	active: { type: Boolean },
	hasPassword: { type: Boolean },
	pendingUrlActions: { type: Object },
	privacy: {
		allowPublicMessages: { type: Boolean },
		cvPasswordProtected: {
			enabled: { type: Boolean, default: false },
			passwords: { type: Array },
		},
	},
});

module.exports = mongoose.model('credentials', CredentialsSchema);
