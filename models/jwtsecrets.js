const mongoose = require('mongoose');

const JwtSecrets = new mongoose.Schema({
	secretType: { type: String, default: 'rsa'},
	publicKey: { type: String, required: true },
	privateKey: { type: String, required: true },
});

module.exports = mongoose.model('jwtsecrets', JwtSecrets);
