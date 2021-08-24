const cron = require('node-cron');
const log = require('logflake')('cron');
const Credentials = require('./models/credentials.js');

/**
 * Delete deactivated accounts that hasnt been logged for more than 30 days.
 * If the user login again in 30 days, the account is reactivated. Everytime
 * the user delete an account, its username is imediately released. This cron
 * will run everyday at 3AM.
 */
cron.schedule('* 3 * * *', () => {
	const fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
	log('info', 'Started cron: removing old deactivated accounts');

	Credentials.deleteMany({
		active: false,
		deactivated_at: {
			$gte: fromDate,
		},
	})
		.then(result => {
			log('info', 'Deactivated accounts deletion done with status: ', result);
		})
		.catch(error => {
			log('error', 'Error while deleting deactivated accounts: ', error);
		});
});
