const config = require('../../../config/');
const { fnAuth } = require('../../../functions/');

module.exports = (req, res) => {
	return fnAuth.signOut(res).json({
		logged: req.signedCookies[config.jwtCookieName] ? true : false,
	});
};
