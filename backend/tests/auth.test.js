const request = require('supertest');
const app = require('../index'); // necesitas exportar app
const db = require('../db');

describe('Auth tests', () => {

  test('register a user', async () => {
    const res = await request(app).post('/auth/register').send({
      username: "testuser",
      password: "1234"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.username).toBe("testuser");
  });

  test('login user', async () => {
    const res = await request(app).post('/auth/login').send({
      username: "testuser",
      password: "1234"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  afterAll(async () => {
    await db.pool.end(); // cerrar pool
  });

});
