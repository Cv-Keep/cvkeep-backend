/**
 * This is a CLI script used to generate active cv-keep users on a given mongo database on the current local db.
 * Usage: npm run usergen {db_name} {user_amount}
 * 
 * Every user is loggable with the credentials:
 * 
 * user: 'user-{index}@test.com' // example: user1@test.com
 * pass: 'test@test'
 * 
 * If you desire to generate 100.000 users for example, you would run
 * npm run usergen cvkeep 100000
 * 
 * WARN: This command is destructive, you will lost the database data. 
 * REMENBER: NEVER EVER RUN THIS IN PRODUCTION, NEVER.
 */

const args = process.argv.slice(2, 4);
const dn = args[0];
const qt = args[1];
const pressAnyKey = require('press-any-key');

if (!dn || !qt) {
  console.log('\nUsage: npm run usergen {db_name} {user_amount}\nWarning: This command will drop the database\n');
  return false;
} else {
  console.log(`This is a test script intended to be used on local environments only. The database data will be destroyed. ${qt} active user(s) will be created on the database ${dn}. The loop index will be the user id for email and username. For example, for user 1 the email will be user-1@test.com and,the username will be user-1; For user user-2: user-2@test.com, username user-2. the password will be the same for all users: test@test.`);
  console.log('');
}

pressAnyKey()
  .then(async () => {
    const mongojs = require('mongojs');
    const config = require('../../config/');
    const db = mongojs(`${config.mongo.url}/${dn}`);

    db.dropDatabase();

    const accounts = Array(Number(qt)).fill({}).map((item, index) => ({
      cred: JSON.stringify(Object.assign(require('../../schemas/credentials.js'), {
        email: `user-${index + 1}@test.com`,
        username: `user-${index + 1}`,
        active: true,
        password: 'b0d2aec2708944544bbf6dd9c6a0bacb', // test@test
      })),

      cv: JSON.stringify(Object.assign(require('../../schemas/curriculum.js'), {
        username: `user-${index + 1}`,
        email: `user-${index + 1}@test.com`,
      })),    
    }));

    await Promise.all(accounts.map(item => new Promise(resolve => {
      const cred = JSON.parse(item.cred);
      const cv = JSON.parse(item.cv);

      cv.basics.fullname = cred.username;
      console.log(`Creating account "${cred.username}"`);

      db.credentials.save(cred, () => {
        db.curriculum.save(cv, () => {
          resolve();
        });
      });
    })));

    db.close();
  });