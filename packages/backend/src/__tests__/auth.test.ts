import request from 'supertest'
import { app } from '../index'
import { testPrisma, createTestUser, cleanupTestData } from './setup'
import { hashPassword } from '../utils/auth.util'

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = await createTestUser()

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            email: userData.email,
            name: userData.name
          },
          token: expect.any(String)
        }
      })

      expect(response.body.data.user.id).toBeDefined()
      expect(response.body.data.user.createdAt).toBeDefined()

      // Verify user was created in database
      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email }
      })
      expect(dbUser).toBeTruthy()
      expect(dbUser?.email).toBe(userData.email.toLowerCase())
    })

    it('should return 409 if user already exists', async () => {
      const userData = await createTestUser()

      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)

      // Try to create same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        message: 'User with this email already exists'
      })
    })

    it('should validate email format', async () => {
      const userData = await createTestUser({ email: 'invalid-email' })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should validate password strength', async () => {
      const userData = await createTestUser({ password: 'weak' })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const userData = await createTestUser()
      const hashedPassword = await hashPassword(userData.password)

      // Create user directly in database
      const user = await testPrisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          name: userData.name
        }
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: userData.email.toLowerCase(),
            name: userData.name
          },
          token: expect.any(String)
        }
      })
    })

    it('should return 401 for invalid credentials', async () => {
      const userData = await createTestUser()

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid credentials'
      })
    })

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid credentials'
      })
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: userData.email.toLowerCase(),
            name: userData.name
          }
        }
      })
    })

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token is required'
      })
    })

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid token'
      })
    })
  })

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token

      const updateData = {
        name: 'Updated Name'
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            name: 'Updated Name'
          }
        }
      })

      // Verify in database
      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      })
      expect(dbUser?.name).toBe('Updated Name')
    })
  })

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: userData.password,
          newPassword: 'NewStrongPass123!'
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully'
      })
    })

    it('should reject incorrect current password', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewStrongPass123!'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('incorrect')
    })
  })

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: expect.any(String),
          user: expect.any(Object)
        }
      })

      // New token should be different from old one
      expect(response.body.data.token).not.toBe(token)
    })
  })

  describe('DELETE /api/auth/account', () => {
    it('should delete user account successfully', async () => {
      const userData = await createTestUser()

      // Register user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const token = registerResponse.body.data.token
      const userId = registerResponse.body.data.user.id

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Account deleted successfully'
      })

      // Verify user was deleted from database
      const dbUser = await testPrisma.user.findUnique({
        where: { id: userId }
      })
      expect(dbUser).toBeNull()
    })
  })
})