const log = require('logflake')('get-avatar');
const { fnUser } = require('../../../functions');

module.exports = async (req, res) => {
	const username = req.params.username;
	const photo = username && await fnUser.getAvatar(username)
		.catch(error => log('error', error));

	if (!username) {
		return res.status(404).send('Not found');
	}

	if (!photo) {
		return res.status(200).send(null);
	}

	res.header('Content-Type', photo.contentType);
	res.contentType(photo.contentType);
	res.send(photo.data.buffer);
};
