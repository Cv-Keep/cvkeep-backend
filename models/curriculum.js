const mongoose = require('mongoose');

const CurriculumSchema = new mongoose.Schema({
	lang: { type: String, default: '' },
	views: { type: Number, default: 0 },
	email: { type: String, required: true },
	username: { type: String, required: true },
	searchable: { type: Boolean, default: true },
	canEdit: { type: Boolean, default: false },
	editing: { type: Boolean, default: false },
	color: { type: String, default: '#4ecdc4' },
	background: { type: String, default: '' },
	sections: { type: Array },
	hiddenSections: { type: Array },
	civilState: { type: String, default: 'doNotInform' },
	allowPublicMessages: { type: Boolean, default: true },
	passwordProtected: { type: Boolean, default: false },
	locked: { type: Boolean, default: false },
	created: { type: Date, default: new Date() },
	availability: {
		freelance: { type: Boolean, default: false },
		lookingForWork: { type: Boolean, default: false },
		disability: { type: Boolean, default: false },
		onlyRemote: { type: Boolean, default: false },
	},
	basics: {
		fullname: { type: String, default: '' },
		role: { type: String, default: '' },
	},
	location: {
		country: { type: String, default: 'Country'},
		region: { type: String, default: '' },
		city: { type: String, default: '' },
	},
	contact: {
		publicEmail: { type: String, default: '' },
		primaryNumber: { type: String, default: '' },
		primaryNumberKind: { type: String, default: 'cellphone' },
	},
	presentation: {
		max_length: { type: Number, default: 500 },
		description: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	education: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	languages: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	experience: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	skills: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	prizes: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	portfolio: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
	links: {
		items: { type: Array },
		introduction: { type: String, default: '' },
		customTitle: { type: String, default: '' },
	},
});

module.exports = mongoose.model('curriculum', CurriculumSchema, 'curriculum');
