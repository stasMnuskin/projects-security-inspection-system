process.env.JWT_SECRET = 'test'

const bcrypt = require('bcrypt');
const request = require('supertest');
const { app } = require('../../src/server');
const { User } = require('../../src/models');
const { clearDatabase, createUser } = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');

describe('User Controller', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'inspector'
      })
      .set('csrf-token', 'test-csrf-token');

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(logger.info).toHaveBeenCalledWith('New user registered: test@example.com');
  });

  it('should login successfully with correct credentials', async () => {
    const password = 'password123';
    await createUser({ 
      email: 'test@example.com', 
      password: await bcrypt.hash(password, 10),
      role: 'inspector'
    });
  
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: password
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(logger.info).toHaveBeenCalledWith('User logged in: test@example.com');
  });

  it('should get current user details', async () => {
    const user = await createUser({ email: 'test@example.com', role: 'inspector' });
    const token = generateTestToken(user.id, user.role);
  
    const response = await request(app)
      .get('/api/users/me')
      .set('x-auth-token', token);
  
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('email', user.email);
    expect(response.body).toHaveProperty('role', 'inspector');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should update user details', async () => {
    const user = await createUser();
    const token = generateTestToken(user.id);

    const response = await request(app)
      .put('/api/users/update')
      .set('x-auth-token', token)
      .send({
        username: 'newusername',
        email: 'newemail@example.com'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'User updated successfully');
    
    const updatedUser = await User.findByPk(user.id);
    expect(updatedUser.username).toBe('newusername');
    expect(updatedUser.email).toBe('newemail@example.com');
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      await createUser({ 
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123',
        role: 'inspector'
      });
      await createUser({ 
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123',
        role: 'inspector'
      });
      const adminUser = await createUser({ 
        email: 'admin@example.com',
        username: 'admin',
        password: 'password123',
        role: 'admin'
      });
      const token = generateTestToken(adminUser.id, 'admin');
  
      const response = await request(app)
        .get('/api/users')
        .set('x-auth-token', token);
  
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).not.toHaveProperty('password');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userToDelete = await createUser({ 
        email: 'delete@example.com',
        username: 'deleteuser',
        password: 'password123',
        role: 'inspector'
      });
      const adminUser = await createUser({ 
        email: 'admin@example.com',
        username: 'admin',
        password: 'password123',
        role: 'admin'
      });
      const token = generateTestToken(adminUser.id, 'admin');
  
      const response = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('x-auth-token', token);
  
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
  
      const deletedUser = await User.findByPk(userToDelete.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('changeUserRole', () => {
    it('should change user role', async () => {
      const userToChange = await createUser({ 
        email: 'change@example.com',
        username: 'changeuser',
        password: 'password123',
        role: 'inspector'
      });
      const adminUser = await createUser({ 
        email: 'admin@example.com',
        username: 'admin',
        password: 'password123',
        role: 'admin'
      });
      const token = generateTestToken(adminUser.id, 'admin');
  
      const response = await request(app)
        .put(`/api/users/${userToChange.id}/role`)
        .set('x-auth-token', token)
        .send({ role: 'admin' });
  
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User role updated successfully');
  
      const changedUser = await User.findByPk(userToChange.id);
      expect(changedUser.role).toBe('admin');
    });
  });
});