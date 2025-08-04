import { GoogleAdsService } from '../services/google-ads.service'
import { MarketingService } from '../services/marketing.service'
import { BusinessModel } from '../models/business.model'
import { MarketingCampaignModel } from '../models/marketing-campaign.model'
import { prisma } from '../lib/prisma'

// Mock Google Ads API
jest.mock('google-ads-api', () => ({
  GoogleAdsApi: jest.fn().mockImplementation(() => ({
    Customer: jest.fn().mockImplementation(() => ({
      campaignBudgets: {
        create: jest.fn().mockResolvedValue({
          resourceName: 'customers/123/campaignBudgets/456'
        })
      },
      campaigns: {
        create: jest.fn().mockResolvedValue({
          resourceName: 'customers/123/campaigns/789'
        }),
        update: jest.fn().mockResolvedValue({})
      },
      adGroups: {
        create: jest.fn().mockResolvedValue({
          resourceName: 'customers/123/adGroups/101'
        })
      },
      adGroupCriteria: {
        create: jest.fn().mockResolvedValue([])
      },
      adGroupAds: {
        create: jest.fn().mockResolvedValue({})
      },
      query: jest.fn().mockResolvedValue([{
        campaign: {
          campaign_budget: 'customers/123/campaignBudgets/456'
        },
        campaign_budget: {
          amount_micros: 100000000
        },
        metrics: {
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          cost_micros: 25000000,
          ctr: 5.0,
          average_cpc: 500000
        }
      }])
    }))
  }))
}))

// Mock dependencies
jest.mock('../models/business.model')
jest.mock('../models/marketing-campaign.model')
jest.mock('../index', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

describe('GoogleAdsService', () => {
  let googleAdsService: GoogleAdsService
  let mockBusiness: any
  let mockCampaign: any

  beforeEach(() => {
    googleAdsService = new GoogleAdsService()
    
    mockBusiness = {
      id: 'business-123',
      name: 'Test Business',
      description: 'Test business description',
      industry: 'SaaS',
      monthlyPrice: 29.99,
      websiteUrl: 'https://testbusiness.com',
      googleAdsCustomerId: '123456789',
      googleAdsRefreshToken: 'refresh_token_123',
      targetCPA: 50
    }

    mockCampaign = {
      id: 'campaign-123',
      name: 'Test Campaign',
      platform: 'GOOGLE_ADS',
      budget: 100,
      businessId: 'business-123',
      googleAdsId: '789',
      status: 'ACTIVE'
    }

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('createCampaign', () => {
    it('should create a Google Ads campaign successfully', async () => {
      // Mock the MarketingCampaignModel.create
      const mockMarketingCampaignCreate = MarketingCampaignModel.create as jest.MockedFunction<typeof MarketingCampaignModel.create>
      mockMarketingCampaignCreate.mockResolvedValue(mockCampaign)

      const campaignData = {
        name: 'Test Campaign',
        budget: 100,
        keywords: ['test', 'business'],
        businessId: 'business-123'
      }

      const result = await googleAdsService.createCampaign(mockBusiness, campaignData)

      expect(result).toEqual({
        campaignId: '789',
        platform: 'google_ads',
        status: 'active',
        budget: 100,
        keywords: ['test', 'business'],
        googleAdsId: '789'
      })

      expect(mockMarketingCampaignCreate).toHaveBeenCalledWith({
        name: 'Test Campaign',
        platform: 'GOOGLE_ADS',
        budget: 100,
        businessId: 'business-123',
        startDate: expect.any(Date),
        targetKeywords: ['test', 'business'],
        googleAdsId: '789',
        status: 'ACTIVE'
      })
    })

    it('should throw error if business missing Google Ads credentials', async () => {
      const businessWithoutCreds = {
        ...mockBusiness,
        googleAdsCustomerId: null,
        googleAdsRefreshToken: null
      }

      const campaignData = {
        name: 'Test Campaign',
        budget: 100,
        keywords: ['test'],
        businessId: 'business-123'
      }

      await expect(
        googleAdsService.createCampaign(businessWithoutCreds, campaignData)
      ).rejects.toThrow('Business missing Google Ads credentials')
    })
  })

  describe('updateBudget', () => {
    it('should update campaign budget successfully', async () => {
      const mockUpdate = MarketingCampaignModel.updateByGoogleAdsId as jest.MockedFunction<typeof MarketingCampaignModel.updateByGoogleAdsId>
      mockUpdate.mockResolvedValue(mockCampaign)

      await googleAdsService.updateBudget('789', '123456789', 'refresh_token', 150)

      expect(mockUpdate).toHaveBeenCalledWith('789', { budget: 150 })
    })
  })

  describe('pauseCampaign', () => {
    it('should pause campaign successfully', async () => {
      const mockUpdate = MarketingCampaignModel.updateByGoogleAdsId as jest.MockedFunction<typeof MarketingCampaignModel.updateByGoogleAdsId>
      mockUpdate.mockResolvedValue({ ...mockCampaign, status: 'PAUSED' })

      await googleAdsService.pauseCampaign('789', '123456789', 'refresh_token')

      expect(mockUpdate).toHaveBeenCalledWith('789', { status: 'PAUSED' })
    })
  })

  describe('getCampaignMetrics', () => {
    it('should return campaign metrics successfully', async () => {
      const metrics = await googleAdsService.getCampaignMetrics(
        '789',
        '123456789',
        'refresh_token',
        { startDate: '2024-01-01', endDate: '2024-01-14' }
      )

      expect(metrics).toEqual({
        campaignId: '789',
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        cost: 25,
        ctr: 5.0,
        averageCpc: 0.5,
        costPerConversion: 5
      })
    })
  })
})

describe('MarketingService', () => {
  let marketingService: MarketingService

  beforeEach(() => {
    marketingService = new MarketingService()
    jest.clearAllMocks()
  })

  describe('createAutomatedCampaigns', () => {
    it('should create automated campaigns for business with Google Ads credentials', async () => {
      const mockBusiness = {
        id: 'business-123',
        name: 'Test Business',
        googleAdsCustomerId: '123456789',
        googleAdsRefreshToken: 'refresh_token_123'
      }

      const mockGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockGetById.mockResolvedValue(mockBusiness)

      const mockFindByExternalId = MarketingCampaignModel.findByExternalId as jest.MockedFunction<typeof MarketingCampaignModel.findByExternalId>
      mockFindByExternalId.mockResolvedValue(mockCampaign)

      const campaigns = await marketingService.createAutomatedCampaigns('business-123')

      expect(campaigns).toHaveLength(1)
      expect(campaigns[0]).toEqual(mockCampaign)
    })

    it('should return empty array if business has no Google Ads credentials', async () => {
      const mockBusiness = {
        id: 'business-123',
        name: 'Test Business',
        googleAdsCustomerId: null,
        googleAdsRefreshToken: null
      }

      const mockGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockGetById.mockResolvedValue(mockBusiness)

      const campaigns = await marketingService.createAutomatedCampaigns('business-123')

      expect(campaigns).toHaveLength(0)
    })
  })

  describe('analyzeCampaignPerformance', () => {
    it('should analyze campaign performance and return recommendations', async () => {
      const mockGetById = MarketingCampaignModel.getById as jest.MockedFunction<typeof MarketingCampaignModel.getById>
      mockGetById.mockResolvedValue({
        ...mockCampaign,
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spent: 50
      })

      const mockBusinessGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockBusinessGetById.mockResolvedValue({
        ...mockBusiness,
        monthlyPrice: 29.99,
        targetCPA: 5
      })

      const analysis = await marketingService.analyzeCampaignPerformance('campaign-123', 14)

      expect(analysis).toMatchObject({
        campaignId: 'campaign-123',
        platform: 'GOOGLE_ADS',
        performanceScore: expect.any(Number),
        recommendation: expect.stringMatching(/SCALE|PAUSE|OPTIMIZE|MAINTAIN/),
        reasons: expect.arrayContaining([expect.any(String)]),
        metrics: {
          ctr: expect.any(Number),
          cpc: expect.any(Number),
          conversions: expect.any(Number),
          roas: expect.any(Number),
          costPerConversion: expect.any(Number)
        }
      })
    })
  })

  describe('optimizeCampaign', () => {
    it('should optimize campaign based on performance analysis', async () => {
      // Mock campaign data
      const mockGetById = MarketingCampaignModel.getById as jest.MockedFunction<typeof MarketingCampaignModel.getById>
      mockGetById.mockResolvedValue(mockCampaign)

      const mockBusinessGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockBusinessGetById.mockResolvedValue(mockBusiness)

      // Mock update methods
      const mockUpdate = MarketingCampaignModel.update as jest.MockedFunction<typeof MarketingCampaignModel.update>
      mockUpdate.mockResolvedValue(mockCampaign)

      const optimization = await marketingService.optimizeCampaign('campaign-123')

      expect(optimization).toMatchObject({
        campaignId: 'campaign-123',
        optimizations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/BUDGET_INCREASE|BUDGET_DECREASE|PAUSE|KEYWORD_OPTIMIZATION|BID_ADJUSTMENT/),
            description: expect.any(String)
          })
        ]),
        expectedImpact: expect.any(String)
      })
    })
  })

  describe('scaleCampaign', () => {
    it('should scale campaign budget by specified factor', async () => {
      const mockGetById = MarketingCampaignModel.getById as jest.MockedFunction<typeof MarketingCampaignModel.getById>
      mockGetById.mockResolvedValue(mockCampaign)

      const mockBusinessGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockBusinessGetById.mockResolvedValue(mockBusiness)

      const mockUpdate = MarketingCampaignModel.update as jest.MockedFunction<typeof MarketingCampaignModel.update>
      mockUpdate.mockResolvedValue(mockCampaign)

      await marketingService.scaleCampaign('campaign-123', 1.5)

      expect(mockUpdate).toHaveBeenCalledWith('campaign-123', { budget: 150 })
    })
  })

  describe('pauseCampaign', () => {
    it('should pause campaign successfully', async () => {
      const mockGetById = MarketingCampaignModel.getById as jest.MockedFunction<typeof MarketingCampaignModel.getById>
      mockGetById.mockResolvedValue(mockCampaign)

      const mockBusinessGetById = BusinessModel.getById as jest.MockedFunction<typeof BusinessModel.getById>
      mockBusinessGetById.mockResolvedValue(mockBusiness)

      const mockUpdate = MarketingCampaignModel.update as jest.MockedFunction<typeof MarketingCampaignModel.update>
      mockUpdate.mockResolvedValue({ ...mockCampaign, status: 'PAUSED' })

      await marketingService.pauseCampaign('campaign-123')

      expect(mockUpdate).toHaveBeenCalledWith('campaign-123', { status: 'PAUSED' })
    })
  })
})