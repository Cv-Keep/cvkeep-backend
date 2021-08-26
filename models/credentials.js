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
	deactivated_at: { type: Date },
	cvId: { type: mongoose.Types.ObjectId },
	created_at: { type: Date, default: new Date() },
	privacy: {
		allowPublicMessages: { type: Boolean, default: true },
		cvPasswordProtected: {
			enabled: { type: Boolean, default: false },
			passwords: { type: Array },
		},
	},
});

module.exports = mongoose.model('credentials', CredentialsSchema);
