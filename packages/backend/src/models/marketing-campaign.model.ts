import { MarketingCampaign, CampaignPlatform, CampaignStatus, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface CreateCampaignData {
  name: string
  platform: CampaignPlatform
  budget: number
  businessId: string
  startDate: Date
  endDate?: Date
  targetKeywords?: string[]
  audienceData?: any
  googleAdsId?: string
  facebookId?: string
  linkedinId?: string
}

export interface UpdateCampaignData {
  name?: string
  status?: CampaignStatus
  budget?: number
  spent?: number
  impressions?: number
  clicks?: number
  conversions?: number
  endDate?: Date
  targetKeywords?: string[]
  audienceData?: any
  googleAdsId?: string
  facebookId?: string
  linkedinId?: string
}

export interface CampaignWithBusiness extends MarketingCampaign {
  business?: {
    id: string
    name: string
    status: string
  }
}

export class MarketingCampaignModel {
  /**
   * Create a new marketing campaign
   */
  static async create(data: CreateCampaignData): Promise<MarketingCampaign> {
    return prisma.marketingCampaign.create({
      data: {
        ...data,
        budget: new Prisma.Decimal(data.budget),
        status: 'DRAFT'
      }
    })
  }

  /**
   * Find campaign by ID
   */
  static async findById(id: string): Promise<MarketingCampaign | null> {
    return prisma.marketingCampaign.findUnique({
      where: { id }
    })
  }

  /**
   * Find campaign by ID with business data
   */
  static async findByIdWithBusiness(id: string): Promise<CampaignWithBusiness | null> {
    return prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      }
    })
  }

  /**
   * Find all campaigns by business ID
   */
  static async findByBusinessId(businessId: string): Promise<MarketingCampaign[]> {
    return prisma.marketingCampaign.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Find campaigns by platform
   */
  static async findByPlatform(platform: CampaignPlatform): Promise<CampaignWithBusiness[]> {
    return prisma.marketingCampaign.findMany({
      where: { platform },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Find campaigns by status
   */
  static async findByStatus(status: CampaignStatus): Promise<CampaignWithBusiness[]> {
    return prisma.marketingCampaign.findMany({
      where: { status },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Find active campaigns for automation
   */
  static async findActiveCampaigns(): Promise<MarketingCampaign[]> {
    return prisma.marketingCampaign.findMany({
      where: { 
        status: 'ACTIVE',
        business: {
          status: 'ACTIVE'
        }
      },
      include: {
        business: true
      }
    })
  }

  /**
   * Update campaign data
   */
  static async update(id: string, data: UpdateCampaignData): Promise<MarketingCampaign> {
    const updateData: any = { ...data }
    
    // Convert numbers to Decimal for financial fields
    if (data.budget !== undefined) {
      updateData.budget = new Prisma.Decimal(data.budget)
    }
    if (data.spent !== undefined) {
      updateData.spent = new Prisma.Decimal(data.spent)
    }

    return prisma.marketingCampaign.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Update campaign status
   */
  static async updateStatus(id: string, status: CampaignStatus): Promise<MarketingCampaign> {
    return prisma.marketingCampaign.update({
      where: { id },
      data: { status }
    })
  }

  /**
   * Update campaign performance metrics
   */
  static async updateMetrics(id: string, metrics: {
    spent?: number
    impressions?: number
    clicks?: number
    conversions?: number
  }): Promise<MarketingCampaign> {
    const updateData: any = { ...metrics }
    
    if (metrics.spent !== undefined) {
      updateData.spent = new Prisma.Decimal(metrics.spent)
    }

    return prisma.marketingCampaign.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Increment campaign metrics (for real-time updates)
   */
  static async incrementMetrics(id: string, metrics: {
    spent?: number
    impressions?: number
    clicks?: number
    conversions?: number
  }): Promise<MarketingCampaign> {
    const current = await this.findById(id)
    if (!current) throw new Error('Campaign not found')

    const updateData: any = {}
    
    if (metrics.spent !== undefined) {
      updateData.spent = new Prisma.Decimal(current.spent.toNumber() + metrics.spent)
    }
    if (metrics.impressions !== undefined) {
      updateData.impressions = current.impressions + metrics.impressions
    }
    if (metrics.clicks !== undefined) {
      updateData.clicks = current.clicks + metrics.clicks
    }
    if (metrics.conversions !== undefined) {
      updateData.conversions = current.conversions + metrics.conversions
    }

    return prisma.marketingCampaign.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Delete campaign
   */
  static async delete(id: string): Promise<MarketingCampaign> {
    return prisma.marketingCampaign.delete({
      where: { id }
    })
  }

  /**
   * Get campaign performance summary
   */
  static async getPerformanceSummary(businessId: string): Promise<{
    totalCampaigns: number
    activeCampaigns: number
    totalSpent: number
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    avgCTR: number
    avgCPC: number
    avgConversionRate: number
  }> {
    const campaigns = await prisma.marketingCampaign.findMany({
      where: { businessId }
    })

    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent.toNumber(), 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0
    const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCTR,
      avgCPC,
      avgConversionRate
    }
  }

  /**
   * Pause all campaigns for a business
   */
  static async pauseAllCampaigns(businessId: string): Promise<number> {
    const result = await prisma.marketingCampaign.updateMany({
      where: { 
        businessId,
        status: 'ACTIVE'
      },
      data: { status: 'PAUSED' }
    })
    
    return result.count
  }

  /**
   * Find campaigns by external platform ID
   */
  static async findByExternalId(platform: CampaignPlatform, externalId: string): Promise<MarketingCampaign | null> {
    const where: any = { platform }
    
    switch (platform) {
      case 'GOOGLE_ADS':
        where.googleAdsId = externalId
        break
      case 'FACEBOOK_ADS':
      case 'INSTAGRAM_ADS':
        where.facebookId = externalId
        break
      case 'LINKEDIN_ADS':
        where.linkedinId = externalId
        break
    }

    return prisma.marketingCampaign.findFirst({ where })
  }
}