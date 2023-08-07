import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/app-data-source';
import { User } from '../src/entity/User';
import jwt from 'jsonwebtoken';

const testUser = {
  'name': 'Sue Lister',
  'email': 'sue@gmail.com',
  'password': 'yourmom'
}

const testUser2 = {
  'name': 'Sue Lister 2',
  'email': 'sue2@gmail.com',
  'password': 'yourmom2'
}

const testUser3 = {
  'name': 'Sue Lister 3',
  'email': 'sue3@gmail.com',
  'password': 'yourmom3'
}

describe('test app endpoints', () => {
  let jwtToken: string;

  beforeAll(async ()=>{
    await AppDataSource.initialize();
    await AppDataSource.getRepository(User).clear();
    jwtToken = '';
  });
  afterAll(async ()=>{
    await AppDataSource.destroy();
  });

  it('home - should be able to access without a token', async () => {
    const response = await request(app).get('/');
    expect(response.status).toEqual(200);
  });

  it('create - should get an error when body is empty', async () => {
    const response = await request(app)
      .post('/users/create');
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Name is required`);
  });

  it('create - should get an error when name is empty', async () => {
    const response = await request(app)
      .post('/users/create')
      .send({
        'name': '',
        'email': testUser.email,
        'password': testUser.password    
      })
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Name is required`);
  });

  it('create - should get an error when email is empty', async () => {
    const response = await request(app)
      .post('/users/create')
      .send({
        'name': testUser.name,
        'email': '',
        'password': testUser.password    
      })
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email is required`);
  });

  it('create - should get an error when email is invalid', async () => {
    const response = await request(app)
      .post('/users/create')
      .send({
        'name': testUser.name,
        'email': 'blahblahblah',
        'password': testUser.password    
      })
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Valid email format is required`);
  });

  it('create - should get an error when password is empty', async () => {
    const response = await request(app)
      .post('/users/create')
      .send({
        'name': testUser.name,
        'email': testUser.email,
        'password': ''
      })
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Password is required`);
  });

  it('create - should get an error when password is invalid', async () => {
    const response = await request(app)
      .post('/users/create')
      .send({
        'name': testUser.name,
        'email': testUser.email,
        'password': 'blah blah blah'
      })
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Valid password can only contain letters, numbers, and special characters`);
  });

  it('create - should be able to create a user and generate a token', async () => {
    const response = await request(app)
      .post('/users/create')
      .send(testUser);
    expect(response.status).toEqual(200);
    const message = JSON.parse(response.text);
    expect(message).toEqual({ message: `User ${testUser.email} successfully created`});

    jwtToken = response.headers['authorization'].split(' ')[1];
    jwt.verify(jwtToken, process.env.TOKEN_SECRET);
    expect(true).toBeTruthy();
  });

  it('create - should get an error when email is not unique', async () => {
    const response = await request(app)
      .post('/users/create')
      .send(testUser)
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email already in use`);
  });

  it('login - should get an error when emal is incorrect - unauthorized', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        'email': 'incorrect.email@gmail.com',
        'password': 'blahblahblah'
      });
    expect(response.status).toEqual(401);
    const error = JSON.parse(response.text);
    expect(error).toEqual({ error: 'Email incorrect, please try again.'});
  });

  it('login - should get an error when password is incorrect - unauthorized', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        'email': testUser.email,
        'password': 'blahblahblah'
      });
    expect(response.status).toEqual(401);
    const error = JSON.parse(response.text);
    expect(error).toEqual({ error: 'Password incorrect, please try again.'});
  });

  it('login - should be able to login', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        'email': testUser.email,
        'password': testUser.password
      });
    expect(response.status).toEqual(200);
    const message = JSON.parse(response.text);
    expect(message).toEqual({ message: `Welcome back, ${testUser.name}!`});

    const token = response.headers['authorization'].split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET);
    expect(true).toBeTruthy();
  });

  it('list - should get an error when missing token - unauthorized', async () => {
    const response = await request(app)
      .get('/users');
    expect(response.status).toEqual(401);
    const error = JSON.parse(response.text);
    expect(error).toEqual({ error: 'Unauthorized' });
  });

  it('list - should get an error when incorrect token - forbidden', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer blahblahblah`);
    expect(response.status).toEqual(403);
    const error = JSON.parse(response.text);
    expect(error).toEqual({ error: 'Forbidden' });
  });

  it('list - should be able to get a list of users', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(200);
    const users = JSON.parse(response.text) as User[];
    expect(users.length).toBe(1);
    expect(users[0]).toEqual({name: testUser.name, email: testUser.email});
  });

  it('update - should get an error when body is empty', async () => {
    const response = await request(app)
      .patch('/users/update')      
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Name is required`);
  });

  it('update - should get an error when name is empty', async () => {
    const response = await request(app)
      .patch('/users/update')      
      .send({
        'name': '',
        'email': testUser2.email,
        'password': testUser2.password
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Name is required`);
  });

  it('update - should get an error when email is empty', async () => {
    const response = await request(app)
      .patch('/users/update')      
      .send({
        'name': testUser2.name,
        'email': '',
        'password': testUser2.password
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email is required`);
  });

  it('update - should get an error when email not found', async () => {
    const emailDoesNotExist = 'email.does.not.exist@gmail.com';
    const response = await request(app)
      .patch('/users/update')      
      .send({
        'name': testUser2.name,
        'email': emailDoesNotExist,
        'password': testUser2.password
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email does not exist`);
  });

  it('update - should be able to update a user', async () => {
    // create a user
    let response = await request(app)
      .post('/users/create')
      .send(testUser2);

    // change the user's name and password
    response = await request(app)
      .patch('/users/update')
      .send({
        'name': 'Sue Lister 3',
        'email': testUser2.email,
        'password': 'yourmom3'
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(200);
    let message = JSON.parse(response.text);
    expect(message).toEqual({ message: `User ${testUser2.email} successfully updated`});
    
    // then change it back
    response = await request(app)
      .patch('/users/update')
      .send({
        'name': testUser2.name,
        'email': testUser2.email,
        'password': testUser2.password
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(200);
    message = JSON.parse(response.text);
    expect(message).toEqual({ message: `User ${testUser2.email} successfully updated`});
  });

  it('update - should get an error when password is empty', async () => {
    const response = await request(app)
      .patch('/users/update')      
      .send({
        'name': testUser2.name,
        'email': testUser2.email,
        'password': ''
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Password is required`);
  });

  it('update - should get an error when password is invalid', async () => {
    const response = await request(app)
      .patch('/users/update')      
      .send({
        'name': testUser2.name,
        'email': testUser2.email,
        'password': 'blah blah blah'
      })
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Valid password can only contain letters, numbers, and special characters`);
  });

  it('delete - should get an error when email is empty', async () => {
    const response = await request(app)
      .delete('/users/delete?')      
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email does not exist`);
  });

  it('delete - should get an error when email not found', async () => {
    const emailDoesNotExist = 'email.does.not.exist@gmail.com';
    const response = await request(app)
      .delete(`/users/delete?email=${encodeURIComponent(emailDoesNotExist)}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(`Email does not exist`);
  });

  it('delete - should be able to delete a user', async () => {
    let response = await request(app)
      .post('/users/create')
      .send(testUser3);

    response = await request(app)
      .delete(`/users/delete?email=${encodeURIComponent(testUser3.email)}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    console.log(response.text);
    expect(response.status).toEqual(200);
    const message = JSON.parse(response.text);
    expect(message).toEqual({ message: `User ${testUser3.email} successfully deleted`});
  });

});