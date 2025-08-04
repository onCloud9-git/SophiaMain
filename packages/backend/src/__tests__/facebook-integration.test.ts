import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { prismaMock } from './setup'
import { FacebookAdsService } from '../services/facebook-ads.service'
import { MultiPlatformCampaignService } from '../services/multi-platform-campaign.service'
import { SocialMediaAutomationService } from '../services/social-media-automation.service'

// Mock external APIs
jest.mock('node-fetch')
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('Facebook Ads Integration', () => {
  let facebookAdsService: FacebookAdsService
  let multiPlatformService: MultiPlatformCampaignService
  let socialMediaService: SocialMediaAutomationService

  const mockBusiness = {
    id: 'test-business-id',
    name: 'Test Business',
    description: 'A test business for Facebook integration',
    industry: 'SaaS',
    websiteUrl: 'https://testbusiness.com',
    facebookAdAccountId: 'act_123456789',
    facebookAccessToken: 'test-access-token',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeAll(() => {
    // Setup environment variables for testing
    process.env.FACEBOOK_ACCESS_TOKEN = 'test-access-token'
    process.env.FACEBOOK_APP_ID = 'test-app-id'
    process.env.FACEBOOK_APP_SECRET = 'test-app-secret'
    process.env.FACEBOOK_PAGE_ID = 'test-page-id'
  })

  beforeEach(() => {
    facebookAdsService = new FacebookAdsService()
    multiPlatformService = new MultiPlatformCampaignService()
    socialMediaService = new SocialMediaAutomationService()
    
    // Reset fetch mock
    mockFetch.mockClear()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('FacebookAdsService', () => {
    test('should create Facebook campaign successfully', async () => {
      // Mock Facebook API responses
      mockFetch
        .mockResolvedValueOnce({ // Campaign creation
          json: () => Promise.resolve({ id: 'campaign_123', status: 'ACTIVE' })
        } as Response)
        .mockResolvedValueOnce({ // Ad set creation
          json: () => Promise.resolve({ 
            id: 'adset_123', 
            estimated_reach: 15000,
            status: 'ACTIVE'
          })
        } as Response)
        .mockResolvedValueOnce({ // Creative creation
          json: () => Promise.resolve({ id: 'creative_123' })
        } as Response)
        .mockResolvedValueOnce({ // Ad creation
          json: () => Promise.resolve({ id: 'ad_123', status: 'ACTIVE' })
        } as Response)

      // Mock Prisma calls
      prismaMock.marketingCampaign.create.mockResolvedValue({
        id: 'db-campaign-id',
        name: 'Test Facebook Campaign',
        platform: 'FACEBOOK_ADS',
        budget: 1000,
        businessId: mockBusiness.id,
        facebookId: 'campaign_123',
        status: 'ACTIVE',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const campaignData = {
        name: 'Test Facebook Campaign',
        budget: 1000,
        objective: 'CONVERSIONS' as const,
        businessId: mockBusiness.id,
        targetAudience: {
          minAge: 25,
          maxAge: 45,
          countries: ['US', 'CA'],
          interests: ['technology', 'business'],
          behaviors: ['online_shopping']
        },
        placement: ['facebook'] as ('facebook')[]
      }

      const result = await facebookAdsService.createCampaign(mockBusiness as any, campaignData)

      expect(result).toMatchObject({
        campaignId: 'campaign_123',
        platform: 'facebook_ads',
        status: 'active',
        budget: 1000,
        facebookId: 'campaign_123'
      })

      expect(mockFetch).toHaveBeenCalledTimes(4) // Campaign, AdSet, Creative, Ad
      expect(prismaMock.marketingCampaign.create).toHaveBeenCalledWith({
        name: 'Test Facebook Campaign',
        platform: 'FACEBOOK_ADS',
        budget: 1000,
        businessId: mockBusiness.id,
        startDate: expect.any(Date),
        facebookId: 'campaign_123',
        status: 'ACTIVE',
        audienceData: JSON.stringify(campaignData.targetAudience)
      })
    })

    test('should get campaign metrics successfully', async () => {
      const mockMetrics = {
        data: [{
          impressions: '10000',
          clicks: '500',
          spend: '250.50',
          ctr: '5.0',
          cpm: '25.05',
          cpc: '0.50',
          conversions: '25',
          reach: '8500',
          frequency: '1.18'
        }]
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockMetrics)
      } as Response)

      const result = await facebookAdsService.getCampaignMetrics('campaign_123', {
        start: '2024-01-01',
        end: '2024-01-31'
      })

      expect(result).toMatchObject({
        campaignId: 'campaign_123',
        impressions: 10000,
        clicks: 500,
        spend: 250.50,
        ctr: 5.0,
        conversions: 25,
        reach: 8500,
        costPerConversion: 10.02 // 250.50 / 25
      })
    })

    test('should create lookalike audience successfully', async () => {
      const mockAudience = {
        id: 'lookalike_123',
        name: 'Lookalike Audience',
        approximate_count: 2000000
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockAudience)
      } as Response)

      const result = await facebookAdsService.createLookalikeAudience(
        'act_123456789',
        'source_audience_123',
        'US',
        0.01
      )

      expect(result).toMatchObject({
        id: 'lookalike_123',
        name: 'Lookalike Audience'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/customaudiences'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Lookalike Audience')
        })
      )
    })

    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          error: {
            message: 'Invalid access token',
            code: 190
          }
        })
      } as Response)

      const campaignData = {
        name: 'Test Campaign',
        budget: 1000,
        objective: 'CONVERSIONS' as const,
        businessId: mockBusiness.id
      }

      await expect(
        facebookAdsService.createCampaign(mockBusiness as any, campaignData)
      ).rejects.toThrow('Invalid access token')
    })
  })

  describe('Multi-Platform Campaign Coordination', () => {
    test('should create coordinated multi-platform campaign', async () => {
      // Mock successful responses for all platforms
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ id: 'test_id', status: 'ACTIVE' })
      } as Response)

      prismaMock.business.findUnique.mockResolvedValue(mockBusiness as any)

      const config = {
        businessId: mockBusiness.id,
        campaignName: 'Multi-Platform Test Campaign',
        totalBudget: 3000,
        duration: 30,
        platforms: {
          googleAds: true,
          facebook: true,
          instagram: true
        },
        budgetAllocation: {
          googleAds: 40,
          facebook: 35,
          instagram: 25
        },
        targetAudience: {
          demographics: {
            ageRange: { min: 25, max: 45 },
            gender: 'all' as const,
            locations: ['US', 'CA', 'GB']
          },
          interests: ['technology', 'business'],
          behaviors: ['online_shopping'],
          keywords: ['saas', 'business software']
        },
        objectives: {
          primary: 'conversions' as const
        },
        adContent: {
          headlines: ['Transform Your Business'],
          descriptions: ['Revolutionary SaaS solution'],
          callToAction: 'Get Started'
        }
      }

      const result = await multiPlatformService.createMultiPlatformCampaign(config)

      expect(result).toMatchObject({
        multiCampaignId: expect.stringMatching(/^multi_\d+_test-business-id$/),
        totalBudget: 3000,
        coordination: {
          budgetSync: true,
          audienceSync: true,
          contentSync: true
        }
      })

      expect(result.campaigns).toHaveLength(3) // Google, Facebook, Instagram
      expect(result.campaigns[0].budget).toBe(1200) // 40% of 3000
      expect(result.campaigns[1].budget).toBe(1050) // 35% of 3000
      expect(result.campaigns[2].budget).toBe(750)  // 25% of 3000
    })

    test('should get unified campaign metrics', async () => {
      const mockCampaigns = [
        {
          id: 'campaign_1',
          platform: 'GOOGLE_ADS',
          googleAdsId: 'google_123',
          businessId: mockBusiness.id
        },
        {
          id: 'campaign_2',
          platform: 'FACEBOOK_ADS',
          facebookId: 'facebook_123',
          businessId: mockBusiness.id
        }
      ]

      // Mock campaign lookup
      jest.spyOn(multiPlatformService as any, 'getMultiCampaignCampaigns')
        .mockResolvedValue(mockCampaigns)

      // Mock Google Ads metrics
      jest.spyOn(require('../services/google-ads.service').googleAdsService, 'getCampaignMetrics')
        .mockResolvedValue({
          campaignId: 'google_123',
          impressions: 15000,
          clicks: 750,
          conversions: 30,
          cost: 600
        })

      // Mock Facebook metrics
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: [{
            impressions: '12000',
            clicks: '600',
            conversions: '20',
            spend: '400',
            reach: '10000'
          }]
        })
      } as Response)

      const result = await multiPlatformService.getUnifiedCampaignMetrics(
        'multi_test_campaign',
        { start: '2024-01-01', end: '2024-01-31' }
      )

      expect(result.totalMetrics).toMatchObject({
        impressions: 27000, // 15000 + 12000
        clicks: 1350,       // 750 + 600
        conversions: 50,    // 30 + 20
        spend: 1000         // 600 + 400
      })

      expect(result.platformBreakdown).toHaveLength(2)
      expect(result.recommendations).toBeInstanceOf(Array)
    })

    test('should handle budget validation errors', async () => {
      const invalidConfig = {
        businessId: mockBusiness.id,
        campaignName: 'Invalid Campaign',
        totalBudget: 3000,
        duration: 30,
        platforms: { googleAds: true, facebook: true, instagram: false },
        budgetAllocation: {
          googleAds: 60,
          facebook: 50, // Total = 110% (invalid)
          instagram: 0
        },
        targetAudience: {
          demographics: {
            ageRange: { min: 25, max: 45 },
            gender: 'all' as const,
            locations: ['US']
          },
          interests: [],
          behaviors: []
        },
        objectives: { primary: 'conversions' as const },
        adContent: {
          headlines: ['Test'],
          descriptions: ['Test'],
          callToAction: 'Test'
        }
      }

      await expect(
        multiPlatformService.createMultiPlatformCampaign(invalidConfig)
      ).rejects.toThrow('Budget allocation must sum to 100%')
    })
  })

  describe('Social Media Automation', () => {
    test('should generate social media content', async () => {
      prismaMock.business.findUnique.mockResolvedValue(mockBusiness as any)

      const config = {
        businessId: mockBusiness.id,
        platforms: ['facebook', 'instagram'] as ('facebook' | 'instagram')[],
        contentTypes: ['posts', 'stories'] as ('posts' | 'stories')[],
        schedule: {
          frequency: 'daily' as const,
          times: ['09:00', '15:00'],
          timezone: 'UTC'
        },
        tone: 'professional' as const,
        hashtags: {
          primary: ['#saas', '#business'],
          secondary: ['#technology', '#innovation'],
          trending: true
        },
        contentThemes: ['innovation', 'growth', 'transformation']
      }

      const result = await socialMediaService.generateSocialMediaContent(
        mockBusiness.id,
        config
      )

      expect(result.posts).toHaveLength(4) // 2 platforms × 2 content types
      expect(result.posts[0]).toMatchObject({
        platform: expect.any(String),
        type: expect.any(String),
        content: {
          text: expect.stringContaining(mockBusiness.name),
          hashtags: expect.arrayContaining(['#saas']),
          callToAction: expect.any(String)
        },
        status: 'draft'
      })

      expect(result.estimatedReach).toBeGreaterThan(0)
      expect(result.approvalRequired).toBe(true)
    })

    test('should schedule posts correctly', async () => {
      const config = {
        businessId: mockBusiness.id,
        platforms: ['facebook'] as ('facebook')[],
        contentTypes: ['posts'] as ('posts')[],
        schedule: {
          frequency: 'weekly' as const,
          times: ['10:00'],
          timezone: 'UTC'
        },
        tone: 'casual' as const,
        hashtags: { primary: ['#test'], secondary: [], trending: false },
        contentThemes: ['test']
      }

      prismaMock.business.findUnique.mockResolvedValue(mockBusiness as any)

      const result = await socialMediaService.generateSocialMediaContent(
        mockBusiness.id,
        config
      )

      const post = result.posts[0]
      expect(post.schedule.publishAt).toBeInstanceOf(Date)
      expect(post.schedule.timezone).toBe('UTC')
      
      // Check that the scheduled time matches the configuration
      const scheduledTime = post.schedule.publishAt
      expect(scheduledTime.getUTCHours()).toBe(10)
      expect(scheduledTime.getUTCMinutes()).toBe(0)
    })

    test('should analyze social media performance', async () => {
      // Mock published posts
      jest.spyOn(socialMediaService as any, 'getPublishedPosts')
        .mockResolvedValue([
          {
            id: 'post_1',
            platform: 'facebook',
            type: 'posts'
          },
          {
            id: 'post_2',
            platform: 'instagram',
            type: 'stories'
          }
        ])

      // Mock metrics for each post
      jest.spyOn(socialMediaService as any, 'getPostMetrics')
        .mockResolvedValueOnce({
          reach: 1500,
          engagement: 150,
          clicks: 75,
          shares: 25
        })
        .mockResolvedValueOnce({
          reach: 1200,
          engagement: 120,
          clicks: 60,
          shares: 15
        })

      const result = await socialMediaService.analyzeSocialMediaPerformance(
        mockBusiness.id,
        { start: '2024-01-01', end: '2024-01-31' }
      )

      expect(result.summary).toMatchObject({
        totalPosts: 2,
        totalReach: 2700,
        totalEngagement: 270,
        totalClicks: 135
      })

      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.bestPerformingContent).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    test('should coordinate Facebook campaign with social media content', async () => {
      // Mock business lookup
      prismaMock.business.findUnique.mockResolvedValue(mockBusiness as any)

      // Mock Facebook campaign creation
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ id: 'test_campaign', status: 'ACTIVE' })
      } as Response)

      prismaMock.marketingCampaign.create.mockResolvedValue({
        id: 'db-campaign-id',
        name: 'Integrated Campaign',
        platform: 'FACEBOOK_ADS',
        budget: 2000,
        businessId: mockBusiness.id
      } as any)

      // Step 1: Create Facebook advertising campaign
      const campaignData = {
        name: 'Integrated Test Campaign',
        budget: 2000,
        objective: 'CONVERSIONS' as const,
        businessId: mockBusiness.id
      }

      const adCampaign = await facebookAdsService.createCampaign(
        mockBusiness as any,
        campaignData
      )

      // Step 2: Create aligned social media campaign
      const socialCampaign = await socialMediaService.createAlignedSocialMediaCampaign(
        mockBusiness.id,
        adCampaign,
        30
      )

      expect(adCampaign.campaignId).toBe('test_campaign')
      expect(socialCampaign.alignedWith).toBe(adCampaign.campaignId)
      expect(socialCampaign.businessId).toBe(mockBusiness.id)
    })

    test('should handle cross-platform audience sync', async () => {
      const multiCampaignId = 'multi_test_sync'
      
      // Mock campaigns lookup
      jest.spyOn(multiPlatformService as any, 'getMultiCampaignCampaigns')
        .mockResolvedValue([
          {
            id: 'fb_campaign',
            platform: 'FACEBOOK_ADS',
            businessId: mockBusiness.id
          }
        ])

      prismaMock.business.findUnique.mockResolvedValue({
        ...mockBusiness,
        facebookAdAccountId: 'act_123456789'
      } as any)

      // Mock lookalike audience creation
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'lookalike_123' })
      } as Response)

      const result = await multiPlatformService.syncAudiencesAcrossPlatforms(
        multiCampaignId,
        { source: 'google_converters' }
      )

      expect(result.syncResults).toHaveLength(1)
      expect(result.syncResults[0]).toMatchObject({
        platform: 'FACEBOOK_ADS',
        action: 'lookalike_created',
        audienceId: 'lookalike_123'
      })
    })
  })
})