import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entity/User';

// describe('home endpoint', () => {
//   it('should respond with 200 for / endpoint', async () => {
//     const response = await request(app).get('/');
//     expect(response.status).toEqual(200);
//   });
// });

describe('create endpoint', () => {
  beforeEach(async () => {
    await AppDataSource.initialize();
    await AppDataSource.getRepository(User).clear();
  });
  afterEach(async () => {
    await AppDataSource.destroy();
  });

  it('should respond with 200 for /users/create endpoint', async () => {
    const cResponse = await request(app)
      .post('/users/create')
      .send({
        "name": 'Sue Lister',
        "email": 'sue@gmail.com',
        "password": 'yourmom'
      });
    console.log(cResponse.text);
    const token = JSON.parse(cResponse.text).token;
    console.log(token);
    expect(cResponse.status).toEqual(200);
  });
});