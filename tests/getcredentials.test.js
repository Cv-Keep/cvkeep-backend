const supertest = require('supertest');
const app = require('../index.js');

app.__db.dropDatabase();

describe('Test /getcredentials route', () => {
	it('GET /account/getcredentials with no logged user must return generic payload and status 200', done => {
		return supertest(app)
			.get('/account/getcredentials')
			.then(response => {
				const dataReturned = JSON.parse(response.text);
				const genericUser = app.fn.__utils.schema('credentials', { logged: false });

				expect(response.statusCode).toBe(200);
				expect(dataReturned).toEqual(genericUser);

				done();
			});
	});
});
