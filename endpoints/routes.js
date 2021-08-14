/**
* To create a route, use the factory function route(type, url, resource).
*	When the config.stage is 'dev' all routes accepts all kind of requests
* Use the 'logged' type on a route to add the guard module, the guard
* requires a valid JWT token via get/post/x-access-token to call resource.
* When a resource with guard is called, an object req.$user will be available.
*/

const config = require('./../config/');
const guard = require('./resources/auth/guard');

/* eslint-disable-next-line*/
const routes = require('express').Router();

const route = (type, url, resource) => {
	const _guard = (type === 'logged' ? guard : (req, res, next) => next());

	if (type === 'logged' || config.stage === 'development') {
		type = 'all';
	}

	routes[type](url, _guard, require(`${__dirname}/resources/${resource || url}`));
};

// authentication

route('post', '/auth/signin', 'auth/signin.js');
route('all', '/auth/signout', 'auth/signout.js');
route('post', '/auth/register', 'auth/register.js');
route('post', '/auth/confirm', 'auth/confirm.js');
route('all', '/auth/facebook', 'auth/socials/facebook.js');
route('all', '/auth/linkedin', 'auth/socials/linkedin.js');
route('all', '/auth/github', 'auth/socials/github.js');

// account

route('all', '/account/getcredentials', 'account/getcredentials.js');
route('all', '/account/checkusername', 'account/checkusername.js');
route('post', '/account/forgotpassword', 'account/forgotpassword.js');

// protected

route('logged', '/account/changeusername', 'account/changeusername.js');
route('logged', '/account/changeemail', 'account/changeemail.js');
route('logged', '/account/changepassword', 'account/changepassword.js');
route('logged', '/account/changeprivacy', 'account/changeprivacy.js');
route('logged', '/account/deactivate', 'account/deactivateaccount.js');
route('logged', '/account/changelanguage', 'account/changelanguage.js');
route('logged', '/upload/setuseravatar', 'upload/setuseravatar.js');

// curriculum

route('logged', '/curriculum/save', 'curriculum/save.js');
route('post', '/curriculum/sendemail', 'curriculum/email.js');
route('post', '/curriculum/report', 'curriculum/report.js');
route('all', '/curriculum/get', 'curriculum/get.js');

// search

route('get', '/search/simple', 'search/simple.js');
route('logged', '/search/searchable', 'search/searchable.js');

// general purpose

route('all', '/hash-action/:hash', 'action-url/action-url-exec.js');

/** **/

module.exports = routes;
