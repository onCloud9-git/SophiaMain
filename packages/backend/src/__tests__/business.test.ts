import { BusinessService } from '../services/business.service'
import { BusinessModel } from '../models/business.model'
import { BusinessStatus } from '@prisma/client'
import { testPrisma, createTestUser, cleanupTestData } from './setup'
import { BusinessCreateInput, BusinessUpdateInput } from '../utils/schemas'

// Mock logger to avoid console spam during tests
jest.mock('../index', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

describe('BusinessService', () => {
  let testUser: any
  let testBusiness: any

  beforeEach(async () => {
    // Create a test user for ownership tests
    const userData = await createTestUser()
    testUser = await testPrisma.user.create({
      data: {
        email: userData.email,
        password: 'hashedpassword', // This would be hashed in real scenario
        name: userData.name
      }
    })
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('createBusiness', () => {
    it('should create a business successfully', async () => {
      const businessData: BusinessCreateInput = {
        name: 'Test Business',
        description: 'A test business for unit testing',
        industry: 'Technology',
        monthlyPrice: 29.99,
        currency: 'USD'
      }

      const result = await BusinessService.createBusiness(businessData, testUser.id)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.name).toBe(businessData.name)
      expect(result.description).toBe(businessData.description)
      expect(result.industry).toBe(businessData.industry)
      expect(Number(result.monthlyPrice)).toBe(businessData.monthlyPrice)
      expect(result.status).toBe('PLANNING')
      expect(result.ownerId).toBe(testUser.id)
    })

    it('should handle business creation with all optional fields', async () => {
      const businessData: BusinessCreateInput = {
        name: 'Full Test Business',
        description: 'A complete test business with all fields',
        industry: 'E-commerce',
        monthlyPrice: 49.99,
        currency: 'EUR'
      }

      const result = await BusinessService.createBusiness(businessData, testUser.id)

      expect(result).toBeDefined()
      expect(result.currency).toBe('EUR')
      expect(Number(result.monthlyPrice)).toBe(49.99)
    })

    it('should throw error for invalid business data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Test',
        industry: 'Tech',
        monthlyPrice: -10 // Invalid: negative price
      }

      await expect(
        BusinessService.createBusiness(invalidData as any, testUser.id)
      ).rejects.toThrow()
    })
  })

  describe('getBusinessById', () => {
    beforeEach(async () => {
      testBusiness = await testPrisma.business.create({
        data: {
          name: 'Test Business',
          description: 'Test Description',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'PLANNING',
          ownerId: testUser.id
        }
      })
    })

    it('should get business by ID successfully', async () => {
      const result = await BusinessService.getBusinessById(testBusiness.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(testBusiness.id)
      expect(result?.name).toBe(testBusiness.name)
    })

    it('should enforce ownership when ownerId is provided', async () => {
      const anotherUser = await testPrisma.user.create({
        data: {
          email: 'another@test.com',
          password: 'hashedpassword',
          name: 'Another User'
        }
      })

      await expect(
        BusinessService.getBusinessById(testBusiness.id, anotherUser.id)
      ).rejects.toThrow('Unauthorized access to business')
    })

    it('should return null for non-existent business', async () => {
      const result = await BusinessService.getBusinessById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('getBusinessesByOwner', () => {
    beforeEach(async () => {
      // Create multiple test businesses
      const businesses = [
        {
          name: 'Business 1',
          description: 'Test Description 1',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'PLANNING' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Business 2',
          description: 'Test Description 2',
          industry: 'E-commerce',
          monthlyPrice: 39.99,
          status: 'ACTIVE' as BusinessStatus,
          ownerId: testUser.id
        }
      ]

      await testPrisma.business.createMany({ data: businesses })
    })

    it('should get paginated businesses for owner', async () => {
      const pagination = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' as const }
      const result = await BusinessService.getBusinessesByOwner(testUser.id, pagination)

      expect(result.businesses).toBeDefined()
      expect(result.businesses.length).toBe(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should handle pagination correctly', async () => {
      const pagination = { page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' as const }
      const result = await BusinessService.getBusinessesByOwner(testUser.id, pagination)

      expect(result.businesses.length).toBe(1)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.totalPages).toBe(2)
    })
  })

  describe('updateBusiness', () => {
    beforeEach(async () => {
      testBusiness = await testPrisma.business.create({
        data: {
          name: 'Original Business',
          description: 'Original Description',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'PLANNING',
          ownerId: testUser.id
        }
      })
    })

    it('should update business successfully', async () => {
      const updateData: BusinessUpdateInput = {
        name: 'Updated Business',
        description: 'Updated Description',
        monthlyPrice: 39.99
      }

      const result = await BusinessService.updateBusiness(
        testBusiness.id,
        updateData,
        testUser.id
      )

      expect(result.name).toBe(updateData.name)
      expect(result.description).toBe(updateData.description)
      expect(Number(result.monthlyPrice)).toBe(updateData.monthlyPrice)
    })

    it('should enforce ownership on update', async () => {
      const anotherUser = await testPrisma.user.create({
        data: {
          email: 'another@test.com',
          password: 'hashedpassword',
          name: 'Another User'
        }
      })

      const updateData: BusinessUpdateInput = {
        name: 'Unauthorized Update'
      }

      await expect(
        BusinessService.updateBusiness(testBusiness.id, updateData, anotherUser.id)
      ).rejects.toThrow('Unauthorized access to business')
    })

    it('should throw error for non-existent business', async () => {
      const updateData: BusinessUpdateInput = {
        name: 'Updated Business'
      }

      await expect(
        BusinessService.updateBusiness('non-existent-id', updateData, testUser.id)
      ).rejects.toThrow('Business not found')
    })
  })

  describe('updateBusinessStatus', () => {
    beforeEach(async () => {
      testBusiness = await testPrisma.business.create({
        data: {
          name: 'Status Test Business',
          description: 'Status Test Description',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'PLANNING',
          ownerId: testUser.id
        }
      })
    })

    it('should update business status successfully', async () => {
      const result = await BusinessService.updateBusinessStatus(
        testBusiness.id,
        'DEVELOPING',
        testUser.id
      )

      expect(result.status).toBe('DEVELOPING')
    })

    it('should enforce ownership on status update', async () => {
      const anotherUser = await testPrisma.user.create({
        data: {
          email: 'another@test.com',
          password: 'hashedpassword',
          name: 'Another User'
        }
      })

      await expect(
        BusinessService.updateBusinessStatus(testBusiness.id, 'ACTIVE', anotherUser.id)
      ).rejects.toThrow('Unauthorized access to business')
    })
  })

  describe('deleteBusiness', () => {
    beforeEach(async () => {
      testBusiness = await testPrisma.business.create({
        data: {
          name: 'Delete Test Business',
          description: 'Delete Test Description',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'PLANNING',
          ownerId: testUser.id
        }
      })
    })

    it('should delete business successfully', async () => {
      const result = await BusinessService.deleteBusiness(testBusiness.id, testUser.id)

      expect(result.id).toBe(testBusiness.id)

      // Verify business is deleted
      const deletedBusiness = await testPrisma.business.findUnique({
        where: { id: testBusiness.id }
      })
      expect(deletedBusiness).toBeNull()
    })

    it('should enforce ownership on delete', async () => {
      const anotherUser = await testPrisma.user.create({
        data: {
          email: 'another@test.com',
          password: 'hashedpassword',
          name: 'Another User'
        }
      })

      await expect(
        BusinessService.deleteBusiness(testBusiness.id, anotherUser.id)
      ).rejects.toThrow('Unauthorized access to business')
    })
  })

  describe('searchBusinesses', () => {
    beforeEach(async () => {
      const businesses = [
        {
          name: 'Tech Startup',
          description: 'A technology startup company',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'ACTIVE' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Food Delivery',
          description: 'Online food ordering platform',
          industry: 'Food & Beverage',
          monthlyPrice: 19.99,
          status: 'PLANNING' as BusinessStatus,
          ownerId: testUser.id
        }
      ]

      await testPrisma.business.createMany({ data: businesses })
    })

    it('should search businesses by name', async () => {
      const result = await BusinessService.searchBusinesses('Tech', testUser.id)

      expect(result.length).toBe(1)
      expect(result[0].name).toBe('Tech Startup')
    })

    it('should search businesses by description', async () => {
      const result = await BusinessService.searchBusinesses('food', testUser.id)

      expect(result.length).toBe(1)
      expect(result[0].name).toBe('Food Delivery')
    })

    it('should search businesses by industry', async () => {
      const result = await BusinessService.searchBusinesses('Technology', testUser.id)

      expect(result.length).toBe(1)
      expect(result[0].industry).toBe('Technology')
    })
  })

  describe('getBusinessStatistics', () => {
    beforeEach(async () => {
      const businesses = [
        {
          name: 'Active Business',
          description: 'Active business',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'ACTIVE' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Developing Business',
          description: 'Developing business',
          industry: 'Technology',
          monthlyPrice: 39.99,
          status: 'DEVELOPING' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Paused Business',
          description: 'Paused business',
          industry: 'Technology',
          monthlyPrice: 19.99,
          status: 'PAUSED' as BusinessStatus,
          ownerId: testUser.id
        }
      ]

      await testPrisma.business.createMany({ data: businesses })
    })

    it('should get business statistics', async () => {
      const result = await BusinessService.getBusinessStatistics(testUser.id)

      expect(result.total).toBe(3)
      expect(result.active).toBe(1)
      expect(result.developing).toBe(1)
      expect(result.paused).toBe(1)
      expect(result.closed).toBe(0)
    })
  })

  describe('getActiveBusinesses', () => {
    beforeEach(async () => {
      const businesses = [
        {
          name: 'Active Business 1',
          description: 'First active business',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'ACTIVE' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Inactive Business',
          description: 'Inactive business',
          industry: 'Technology',
          monthlyPrice: 39.99,
          status: 'PAUSED' as BusinessStatus,
          ownerId: testUser.id
        },
        {
          name: 'Active Business 2',
          description: 'Second active business',
          industry: 'E-commerce',
          monthlyPrice: 19.99,
          status: 'ACTIVE' as BusinessStatus,
          ownerId: testUser.id
        }
      ]

      await testPrisma.business.createMany({ data: businesses })
    })

    it('should get only active businesses', async () => {
      const result = await BusinessService.getActiveBusinesses()

      expect(result.length).toBe(2)
      expect(result.every(business => business.status === 'ACTIVE')).toBe(true)
    })
  })
})