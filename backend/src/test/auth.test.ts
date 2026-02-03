import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './setup';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data).toHaveProperty('token');
  });

  it('should not register a user with an existing email', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(testUser);

    // Second registration with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already registered');
  });

  it('should login an existing user', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should not login with wrong password', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should get current user info with token', async () => {
    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    const token = regRes.body.data.token;

    // Get /me
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });
});
