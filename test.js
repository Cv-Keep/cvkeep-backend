const p = (a) => new Promise(resolve => {
	setTimeout(() => resolve(a), 1000);
});

const validations = [
	{
		errorCode: 400,
		message: 'error.notEnoughDataToOperation',
		test: () => false,
	},
	{
		errorCode: 400,
		message: 'error.atLeastOneEmailIsInvalid',
		test: () => false,
	},
	{
		errorCode: 400,
		message: 'error.atLeastOneEmailIsInvalid',
		test: async () => !await p(false),
	},
	{
		errorCode: 400,
		message: 'error.atLeastOneEmailIsInvalid',
		test: async () => !await p(true),
	},
	{
		errorCode: 400,
		message: 'error.atLeastOneEmailIsInvalid',
		test: async () => !await p(true),
	},
];

for (const item of Object.values(validations)) {
	console.log(item.message, item.errorCode);
	if (item.test()) {
		console.log('found');
		break;
	}
}
