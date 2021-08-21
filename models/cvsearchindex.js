const mongoose = require('mongoose');

const CvSearchIndexSchema = new mongoose.Schema({
	cvId: { type: mongoose.ObjectId },
	active: { type: Boolean },
	email: { type: String, required: true },
	ngrams: { type: String },
	passwordProtected: { type: Boolean },
	rawtext: { type: String },
	searchable: { type: Boolean },
	username: { type: String, required: true },
});

CvSearchIndexSchema.index(
	{
		ngrams: 'text',
		rawtext: 'text',
	},
	{
		weights: {
			ngrams: 10,
			rawtext: 5,
		},
		name: 'TextIndex',
	},
);

module.exports = mongoose.model('cvsearchindex', CvSearchIndexSchema, 'cvsearchindex');
