const supertest = require('supertest');
const app = require('../index.js');

app.__db.dropDatabase();

describe('Protected routes must do not allow access to non signed users', () => {
  it('GET /account/changeusername must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/changeusername')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});
  });

  it('GET /account/changeemail must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/changeemail')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  });

  it('GET /account/changepassword must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/changepassword')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  }); 
  
  it('GET /account/changeprivacy must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/changeprivacy')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  });  

  it('GET /account/deactivate must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/deactivate')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  });

  it('GET /account/changelanguage must deny access to non signed users', done => {
		return supertest(app)
			.get('/account/changelanguage')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  }); 
  
  it('GET /account/setuseravatar must deny access to non signed users', done => {
		return supertest(app)
			.get('/upload/setuseravatar')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});
  });  

  it('GET /curriculum/save must deny access to non signed users', done => {
		return supertest(app)
			.get('/curriculum/save')
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});    
  });  
});