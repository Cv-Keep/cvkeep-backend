const supertest = require('supertest');
const app = require('../index.js');
const mocks = require('./mocks');

app.__db.dropDatabase();

describe('Test /checkusername route', () => {
	it('GET /account/checkusername with no param must return status 400', done => {
		return supertest(app)
			.get('/account/checkusername')
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(400);
				expect(resp).toBeDefined();

				done();
			});
  });
  
	it('POST /account/checkusername with no data must return status 400', done => {
		return supertest(app)
			.post('/account/checkusername')
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(400);
				expect(resp).toBeDefined();

				done();
			});
	});	  

	it('GET /account/checkusername with valid username query must return { allowed:true } with status 200', done => {
		return supertest(app)
			.post('/account/checkusername?username=user-test')
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(200);
				expect(resp).toBeDefined();
				expect(resp.allowed).toBe(true);
				expect(resp.message).toBeDefined();

				done();
			});
	});

	it('POST /account/checkusername with valid username data must return { allowed:true } with status 200', done => {
		return supertest(app)
			.post('/account/checkusername')
			.send({ username: 'user-test' })
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(200);
				expect(resp).toBeDefined();
				expect(resp.allowed).toBe(true);
				expect(resp.message).toBeDefined();

				done();
			});
  });
  
  it('GET /account/checkusername to check existent username must return { allowed:false } with status 200', async done => {
		await app.fn.__user.create(mocks.minUser);

		return supertest(app)
			.get('/account/checkusername?username=john')
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(200);
				expect(resp).toBeDefined();
				expect(resp.allowed).toBe(false);
				expect(resp.message).toBeDefined();

				done();
			});
	});
	
	it('POST /account/checkusername to check existent username must return { allowed:false } with status 200', async done => {
		return supertest(app)
			.post('/account/checkusername')
			.send({ username: 'john' })
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(200);
				expect(resp).toBeDefined();
				expect(resp.allowed).toBe(false);
				expect(resp.message).toBeDefined();

				done();
			});
  });
  
  it('POST /account/checkusername to check username with invalid chars must return status 400', done => {
		return supertest(app)
			.post('/account/checkusername')
			.send({ username: 'john!@#' })
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(400);
				expect(resp).toBeDefined();

				done();
			});
  });

  it('POST /account/checkusername to check username with badword listed on badwords.js must return status 400', done => {
		return supertest(app)
			.post('/account/checkusername')
			.send({ username: 'john-bosta' })
			.then(response => {
				const resp = JSON.parse(response.text)
				
				expect(response.statusCode).toBe(400);
				expect(resp).toBeDefined();

				done();
			});
  });  
});
