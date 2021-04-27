const supertest = require('supertest');
const app = require('../index.js');

let REGISTER_HASH = '';
let REGISTER_USERNAME = 'testuser';
let REGISTER_PASSWORD = 'Password@test123';
let REGISTER_EMAIL = 'felipperegazio@gmail.com';

app.__db.dropDatabase();

describe('Test register with email and password', () => {
  it('POST /auth/register with wrong e-mail confirmation must return 403', done => {
		return supertest(app)
      .post('/auth/register')
      .send({ email: 'test@email.com', email_confirmation: 'test@email.not' })
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});
	});
	
	it('POST /auth/register with empty emails must return 403', done => {
		return supertest(app)
      .post('/auth/register')
      .send({ email: '', email_confirmation: '' })
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});
	});
	
	it('POST /auth/register with invalid emails must return 403', done => {
		return supertest(app)
      .post('/auth/register')
      .send({ email: 'email.com', email_confirmation: 'email.com' })
			.then(response => {
				expect(response.statusCode).toBe(403);

				done();
			});
	});
	
	it('POST /auth/register with valid emails must return 200 and create a registration hash', done => {
		return supertest(app)
      .post('/auth/register')
      .send({ email: REGISTER_EMAIL, email_confirmation: REGISTER_EMAIL })
			.then(response => {
				expect(response.statusCode).toBe(200);

				done();
			});
	});	
	
	it('CHECK db records after the right registration. Record on db.registration must exist', done => {
		return app.__db.registering.findOne({ email: REGISTER_EMAIL }, (error, data) => {
			expect(error).toBeFalsy();
			expect(data.email).toBe(REGISTER_EMAIL);
			expect(data.registering.hash).toBeDefined();
			expect(data.registering.email).toBe(REGISTER_EMAIL);

			REGISTER_HASH = data.registering.hash;

			done();
		});
	});

	it('POST /auth/confirm with only hash must return hash status', async done => {
		return supertest(app)
      .post('/auth/confirm')
      .send({ hash: REGISTER_HASH })
			.then(response => {
				const data = JSON.parse(response.text);

				expect(response.statusCode).toBe(200);
				expect(data.ok).toBe(true);
				expect(data.hashOk).toBe(true);

				done();
			});		
	});	

	it('POST /auth/confirm with wrong passwords must not confirm user registration with status code 400', done => {
		const credentials = {
			username: REGISTER_USERNAME,
			password: 'password@test',
			confirmPassword: 'passwordtest',
		};
	
		return supertest(app)
      .post('/auth/confirm')
      .send({ credentials, hash: REGISTER_HASH })
			.then(response => {
				expect(response.statusCode).toBe(400);

				done();
			});		
	});

	it('POST /auth/confirm with proper passwords must confirm user registration with status code 200', done => {
		const credentials = {
			username: REGISTER_USERNAME,
			password: REGISTER_PASSWORD,
			confirmPassword: REGISTER_PASSWORD,
		};
	
		return supertest(app)
      .post('/auth/confirm')
      .send({ credentials, hash: REGISTER_HASH })
			.then(response => {
				expect(response.statusCode).toBe(200);

				done();
			});		
	});

	it('CHECK after proper registration, the user credentials and user curriculum must exist and be active', async done => {
		const cv = await app.fn.__cv.get({ email: REGISTER_EMAIL });
		const user = await app.fn.__user.get({ email: REGISTER_EMAIL });

		expect(cv).toBeDefined();
		expect(user).toBeDefined();

		expect(user.active).toBe(true);
		expect(user.hasPassword).toBe(true);
		expect(user.email).toBe(REGISTER_EMAIL);
		expect(user.username).toBe(REGISTER_USERNAME);
		expect(user.confirmPassword).toBeUndefined();
		expect(user.password).not.toBe(REGISTER_PASSWORD);

		expect(cv.email).toBe(REGISTER_EMAIL);
		expect(cv.username).toBe(REGISTER_USERNAME);

		done();
	});

  it(`POST /account/checkusername to check already registered username "${REGISTER_USERNAME}" must return 200 with allowed false`, done => {
		return supertest(app)
			.post('/account/checkusername')
			.send({ username: REGISTER_USERNAME })
			.then(response => {
				const data = JSON.parse(response.text);
				
				expect(data.allowed).toBeFalsy();
				expect(response.statusCode).toBe(200);

				done();
			});
	});	
	
	it('CHECK if registered and confirmed user is loggable', done => {
		return supertest(app)
			.post('/auth/signin')
			.send({ email: REGISTER_EMAIL, password: REGISTER_PASSWORD })
			.then(response => {
				const data = JSON.parse(response.text);
				
				expect(data.logged).toBe(true);
				expect(data.user.active).toBe(true);
				expect(data.user.hasPassword).toBe(true);
				expect(data.user.email).toBe(REGISTER_EMAIL);
				expect(data.user.username).toBe(REGISTER_USERNAME);

				done();
			});		
	});
});