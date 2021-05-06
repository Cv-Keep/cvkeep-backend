module.exports = {
	views: 0,
	lang: '',
	email: '',
	username: '',
	canEdit: false,
	editing: false,
	color: '#4ecdc4',
	background: '',
	sections: [],
	hiddenSections: [],
	civilState: 'single',
	allowPublicMessages: true,
	passwordProtected: false,
	locked: false,
	created: new Date(),
	availability: {
		freelance: true,
		lookingForWork: true,
		disability: false,
		onlyRemote: false,
	},
	basics: {
		fullname: '',
		role: '',
		photo: '',
	},
	location: {
		country: 'Brasil',
		region: 'SP',
		city: 'São Paulo',
	},
	contact: {
		primaryNumber: '+55 (11) 988880000',
		primaryNumberKind: 'cellphone',
	},
	presentation: {
		max_length: 500,
		description: '',
	},
	education: {
		items: [],
	},
	languages: {
		items: [],
	},
	experience: {
		introduction: '',
		items: [],
	},
	skills: {
		introduction: '',
		items: [],
	},
	prizes: {
		items: [],
	},
	portfolio: {
		introduction: '',
		items: [],
	},
	links: {
		items: [],
	},
};
