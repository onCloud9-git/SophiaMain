import { UserModel } from '../user.model'
import { prisma } from '../../lib/prisma'

// Mock Prisma for testing
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const expectedUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.user.create.mockResolvedValue(expectedUser)

      const result = await UserModel.create(userData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          name: userData.name,
          password: expect.any(String) // Should be hashed
        })
      })
      expect(result).toEqual(expectedUser)
    })

    it('should create a user without name and avatar', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const expectedUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.user.create.mockResolvedValue(expectedUser)

      const result = await UserModel.create(userData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          password: expect.any(String)
        })
      })
      expect(result).toEqual(expectedUser)
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com'
      const expectedUser = {
        id: 'user_123',
        email,
        name: 'Test User',
        password: 'hashed_password',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.user.findUnique.mockResolvedValue(expectedUser)

      const result = await UserModel.findByEmail(email)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      })
      expect(result).toEqual(expectedUser)
    })

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com'

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await UserModel.findByEmail(email)

      expect(result).toBeNull()
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'password123'
      const hashedPassword = '$2a$12$hashedPassword' // This would be a real bcrypt hash

      // Mock bcrypt.compare to return true
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const result = await UserModel.verifyPassword(plainPassword, hashedPassword)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const plainPassword = 'wrongpassword'
      const hashedPassword = '$2a$12$hashedPassword'

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const result = await UserModel.verifyPassword(plainPassword, hashedPassword)

      expect(result).toBe(false)
    })
  })

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const email = 'existing@example.com'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_123'
      } as any)

      const result = await UserModel.emailExists(email)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true }
      })
      expect(result).toBe(true)
    })

    it('should return false if email does not exist', async () => {
      const email = 'nonexistent@example.com'

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await UserModel.emailExists(email)

      expect(result).toBe(false)
    })
  })

  describe('update', () => {
    it('should update user data', async () => {
      const userId = 'user_123'
      const updateData = {
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg'
      }

      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.user.update.mockResolvedValue(expectedUser)

      const result = await UserModel.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      })
      expect(result).toEqual(expectedUser)
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      const userId = 'user_123'
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.user.delete.mockResolvedValue(expectedUser)

      const result = await UserModel.delete(userId)

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      })
      expect(result).toEqual(expectedUser)
    })
  })
})