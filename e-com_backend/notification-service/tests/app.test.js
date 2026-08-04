const request = require('supertest');
const app = require('../src/app');
describe('app base routes', () => {
  test('returns api info', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
