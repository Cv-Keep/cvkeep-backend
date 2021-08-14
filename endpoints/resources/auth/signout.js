const config = require('../../../config/');
const { __auth } = require('../../../functions/');

module.exports = (req, res) => {
	return __auth.signOut(res).json({ logged: req.signedCookies[config.jwtCookieName] ? true : false });
};
