const request = require('supertest');
const app = require('../app');

describe('App', function() {
  it('has the default page', function(done) {
    request(app)
      .get('/')
      .expect(/Welcome to Kiwi/, done);
  });
  it('has the licenses page', function(done) {
    request(app)
      .get('/licenses')
      .expect(/express/, done);
  });
  it('generates a schedule', function(done) {
    request(app)
      .get('/https://planzajec.uek.krakow.pl/index.php?typ=G&id=237991&okres=1')
      .expect('Content-Type', /text\/calendar/)
      .expect(/BEGIN:VCALENDAR/, done);
  });
});
