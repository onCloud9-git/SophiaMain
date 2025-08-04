import { Business, BusinessStatus, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface CreateBusinessData {
  name: string
  description: string
  industry: string
  monthlyPrice: number
  currency?: string
  ownerId: string
  websiteUrl?: string
  repositoryUrl?: string
  landingPageUrl?: string
  analyticsId?: string
  stripeProductId?: string
  stripePriceId?: string
  googleAdsCustomerId?: string
  googleAdsRefreshToken?: string
  initialBudget?: number
  targetCPA?: number
}

export interface UpdateBusinessData {
  name?: string
  description?: string
  industry?: string
  monthlyPrice?: number
  currency?: string
  status?: BusinessStatus
  websiteUrl?: string
  repositoryUrl?: string
  landingPageUrl?: string
  analyticsId?: string
  stripeProductId?: string
  stripePriceId?: string
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  subscriptionStatus?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  googleAdsCustomerId?: string
  googleAdsRefreshToken?: string
  initialBudget?: number
  targetCPA?: number
}

export interface SubscriptionStatusData {
  subscriptionId: string
  customerId?: string
  status: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
}

export interface BusinessWithDetails extends Business {
  campaigns?: any[]
  metrics?: any[]
  deployments?: any[]
  owner?: { id: string; email: string; name: string | null }
}

export class BusinessModel {
  /**
   * Create a new business
   */
  static async create(data: CreateBusinessData): Promise<Business> {
    return prisma.business.create({
      data: {
        ...data,
        monthlyPrice: new Prisma.Decimal(data.monthlyPrice),
        initialBudget: data.initialBudget ? new Prisma.Decimal(data.initialBudget) : undefined,
        targetCPA: data.targetCPA ? new Prisma.Decimal(data.targetCPA) : undefined,
        status: 'PLANNING'
      }
    })
  }

  /**
   * Find business by ID
   */
  static async findById(id: string): Promise<Business | null> {
    return prisma.business.findUnique({
      where: { id }
    })
  }

  /**
   * Find business by ID with all related data
   */
  static async findByIdWithDetails(id: string): Promise<BusinessWithDetails | null> {
    return prisma.business.findUnique({
      where: { id },
      include: {
        campaigns: {
          orderBy: { createdAt: 'desc' }
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        },
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 deployments
        },
        owner: {
          select: { id: true, email: true, name: true }
        }
      }
    })
  }

  /**
   * Find all businesses by owner
   */
  static async findByOwnerId(ownerId: string, skip?: number, take?: number): Promise<Business[]> {
    return prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    })
  }

  /**
   * Count businesses by owner
   */
  static async countByOwnerId(ownerId: string): Promise<number> {
    return prisma.business.count({
      where: { ownerId }
    })
  }

  /**
   * Find businesses by status
   */
  static async findByStatus(status: BusinessStatus): Promise<Business[]> {
    return prisma.business.findMany({
      where: { status },
      include: {
        owner: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Find active businesses for monitoring/automation
   */
  static async findActiveBusinesses(): Promise<Business[]> {
    return prisma.business.findMany({
      where: { 
        status: 'ACTIVE'
      },
      include: {
        campaigns: true,
        metrics: {
          orderBy: { date: 'desc' },
          take: 14 // Last 2 weeks for decision making
        }
      }
    })
  }

  /**
   * Update business data
   */
  static async update(id: string, data: UpdateBusinessData): Promise<Business> {
    const updateData: any = { ...data }
    
    // Convert numbers to Decimal for financial fields
    if (data.monthlyPrice !== undefined) {
      updateData.monthlyPrice = new Prisma.Decimal(data.monthlyPrice)
    }
    if (data.initialBudget !== undefined) {
      updateData.initialBudget = new Prisma.Decimal(data.initialBudget)
    }
    if (data.targetCPA !== undefined) {
      updateData.targetCPA = new Prisma.Decimal(data.targetCPA)
    }

    return prisma.business.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Update business status
   */
  static async updateStatus(id: string, status: BusinessStatus): Promise<Business> {
    return prisma.business.update({
      where: { id },
      data: { status }
    })
  }

  /**
   * Update Stripe integration data
   */
  static async updateStripeData(id: string, data: { productId: string; priceId: string }): Promise<Business> {
    return prisma.business.update({
      where: { id },
      data: {
        stripeProductId: data.productId,
        stripePriceId: data.priceId
      }
    })
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(id: string, data: SubscriptionStatusData): Promise<Business> {
    return prisma.business.update({
      where: { id },
      data: {
        stripeSubscriptionId: data.subscriptionId,
        stripeCustomerId: data.customerId,
        subscriptionStatus: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd
      }
    })
  }

  /**
   * Delete business and all related data (cascade)
   */
  static async delete(id: string): Promise<Business> {
    return prisma.business.delete({
      where: { id }
    })
  }

  /**
   * Get business statistics
   */
  static async getStatistics(ownerId?: string): Promise<{
    total: number
    active: number
    developing: number
    paused: number
    closed: number
  }> {
    const where = ownerId ? { ownerId } : {}
    
    const [total, active, developing, paused, closed] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.business.count({ where: { ...where, status: 'DEVELOPING' } }),
      prisma.business.count({ where: { ...where, status: 'PAUSED' } }),
      prisma.business.count({ where: { ...where, status: 'CLOSED' } })
    ])

    return { total, active, developing, paused, closed }
  }

  /**
   * Search businesses by name or industry
   */
  static async search(query: string, ownerId?: string): Promise<Business[]> {
    const where: Prisma.BusinessWhereInput = {
      AND: [
        ownerId ? { ownerId } : {},
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { industry: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    }

    return prisma.business.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })
  }
}