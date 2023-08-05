import request from 'supertest';
var app = require('../src/app');

describe('home endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});

describe('list endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});

describe('create endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});

describe('update endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});

describe('delete endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});

describe('login endpoint', () => {
  it('should respond with 200 for / endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more test cases for other endpoints
});