import { BusinessModel } from '../business.model'
import { prisma } from '../../lib/prisma'
import { BusinessStatus, Prisma } from '@prisma/client'

// Mock Prisma for testing
jest.mock('../../lib/prisma', () => ({
  prisma: {
    business: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('BusinessModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a business with correct data', async () => {
      const businessData = {
        name: 'Test Business',
        description: 'A test business',
        industry: 'SaaS',
        monthlyPrice: 29.99,
        currency: 'USD',
        ownerId: 'user_123'
      }

      const expectedBusiness = {
        id: 'business_123',
        ...businessData,
        monthlyPrice: new Prisma.Decimal(29.99),
        status: 'PLANNING' as BusinessStatus,
        websiteUrl: null,
        repositoryUrl: null,
        landingPageUrl: null,
        analyticsId: null,
        stripeProductId: null,
        stripePriceId: null,
        googleAdsCustomerId: null,
        googleAdsRefreshToken: null,
        initialBudget: null,
        targetCPA: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.business.create.mockResolvedValue(expectedBusiness)

      const result = await BusinessModel.create(businessData)

      expect(mockPrisma.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...businessData,
          monthlyPrice: new Prisma.Decimal(29.99),
          status: 'PLANNING'
        })
      })
      expect(result).toEqual(expectedBusiness)
    })

    it('should create business with optional fields', async () => {
      const businessData = {
        name: 'Test Business',
        description: 'A test business',
        industry: 'SaaS',
        monthlyPrice: 29.99,
        ownerId: 'user_123',
        websiteUrl: 'https://example.com',
        initialBudget: 500,
        targetCPA: 50
      }

      const expectedBusiness = {
        id: 'business_123',
        ...businessData,
        monthlyPrice: new Prisma.Decimal(29.99),
        initialBudget: new Prisma.Decimal(500),
        targetCPA: new Prisma.Decimal(50),
        status: 'PLANNING' as BusinessStatus,
        currency: 'USD',
        repositoryUrl: null,
        landingPageUrl: null,
        analyticsId: null,
        stripeProductId: null,
        stripePriceId: null,
        googleAdsCustomerId: null,
        googleAdsRefreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.business.create.mockResolvedValue(expectedBusiness)

      const result = await BusinessModel.create(businessData)

      expect(mockPrisma.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          monthlyPrice: new Prisma.Decimal(29.99),
          initialBudget: new Prisma.Decimal(500),
          targetCPA: new Prisma.Decimal(50)
        })
      })
      expect(result).toEqual(expectedBusiness)
    })
  })

  describe('findById', () => {
    it('should find business by ID', async () => {
      const businessId = 'business_123'
      const expectedBusiness = {
        id: businessId,
        name: 'Test Business',
        description: 'A test business',
        industry: 'SaaS',
        status: 'ACTIVE' as BusinessStatus,
        monthlyPrice: new Prisma.Decimal(29.99),
        currency: 'USD',
        ownerId: 'user_123',
        websiteUrl: null,
        repositoryUrl: null,
        landingPageUrl: null,
        analyticsId: null,
        stripeProductId: null,
        stripePriceId: null,
        googleAdsCustomerId: null,
        googleAdsRefreshToken: null,
        initialBudget: null,
        targetCPA: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.business.findUnique.mockResolvedValue(expectedBusiness)

      const result = await BusinessModel.findById(businessId)

      expect(mockPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: businessId }
      })
      expect(result).toEqual(expectedBusiness)
    })

    it('should return null if business not found', async () => {
      const businessId = 'nonexistent_business'

      mockPrisma.business.findUnique.mockResolvedValue(null)

      const result = await BusinessModel.findById(businessId)

      expect(result).toBeNull()
    })
  })

  describe('findByOwnerId', () => {
    it('should find businesses by owner ID', async () => {
      const ownerId = 'user_123'
      const expectedBusinesses = [
        {
          id: 'business_1',
          name: 'Business 1',
          ownerId,
          createdAt: new Date('2024-01-20'),
        },
        {
          id: 'business_2',
          name: 'Business 2',
          ownerId,
          createdAt: new Date('2024-01-15'),
        }
      ]

      mockPrisma.business.findMany.mockResolvedValue(expectedBusinesses as any)

      const result = await BusinessModel.findByOwnerId(ownerId)

      expect(mockPrisma.business.findMany).toHaveBeenCalledWith({
        where: { ownerId },
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toEqual(expectedBusinesses)
    })
  })

  describe('findByStatus', () => {
    it('should find businesses by status', async () => {
      const status = 'ACTIVE' as BusinessStatus
      const expectedBusinesses = [
        {
          id: 'business_1',
          name: 'Business 1',
          status,
          owner: { id: 'user_1', email: 'user1@example.com', name: 'User 1' }
        },
        {
          id: 'business_2',
          name: 'Business 2',
          status,
          owner: { id: 'user_2', email: 'user2@example.com', name: 'User 2' }
        }
      ]

      mockPrisma.business.findMany.mockResolvedValue(expectedBusinesses as any)

      const result = await BusinessModel.findByStatus(status)

      expect(mockPrisma.business.findMany).toHaveBeenCalledWith({
        where: { status },
        include: {
          owner: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
      expect(result).toEqual(expectedBusinesses)
    })
  })

  describe('updateStatus', () => {
    it('should update business status', async () => {
      const businessId = 'business_123'
      const newStatus = 'ACTIVE' as BusinessStatus
      const expectedBusiness = {
        id: businessId,
        status: newStatus,
        updatedAt: new Date()
      }

      mockPrisma.business.update.mockResolvedValue(expectedBusiness as any)

      const result = await BusinessModel.updateStatus(businessId, newStatus)

      expect(mockPrisma.business.update).toHaveBeenCalledWith({
        where: { id: businessId },
        data: { status: newStatus }
      })
      expect(result).toEqual(expectedBusiness)
    })
  })

  describe('getStatistics', () => {
    it('should return business statistics', async () => {
      // Mock count calls
      mockPrisma.business.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // active
        .mockResolvedValueOnce(2)  // developing
        .mockResolvedValueOnce(1)  // paused
        .mockResolvedValueOnce(2)  // closed

      const result = await BusinessModel.getStatistics()

      expect(result).toEqual({
        total: 10,
        active: 5,
        developing: 2,
        paused: 1,
        closed: 2
      })
    })

    it('should return business statistics for specific owner', async () => {
      const ownerId = 'user_123'

      mockPrisma.business.count
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(3)  // active
        .mockResolvedValueOnce(1)  // developing
        .mockResolvedValueOnce(0)  // paused
        .mockResolvedValueOnce(1)  // closed

      const result = await BusinessModel.getStatistics(ownerId)

      expect(mockPrisma.business.count).toHaveBeenCalledWith({ where: { ownerId } })
      expect(result).toEqual({
        total: 5,
        active: 3,
        developing: 1,
        paused: 0,
        closed: 1
      })
    })
  })

  describe('search', () => {
    it('should search businesses by name, description, or industry', async () => {
      const query = 'SaaS'
      const expectedBusinesses = [
        {
          id: 'business_1',
          name: 'SaaS Business',
          industry: 'SaaS'
        },
        {
          id: 'business_2',
          name: 'Another Business',
          description: 'A SaaS platform'
        }
      ]

      mockPrisma.business.findMany.mockResolvedValue(expectedBusinesses as any)

      const result = await BusinessModel.search(query)

      expect(mockPrisma.business.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {},
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })
      expect(result).toEqual(expectedBusinesses)
    })

    it('should search businesses for specific owner', async () => {
      const query = 'test'
      const ownerId = 'user_123'

      mockPrisma.business.findMany.mockResolvedValue([])

      await BusinessModel.search(query, ownerId)

      expect(mockPrisma.business.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { ownerId },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } }
              ]
            }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })
    })
  })
})