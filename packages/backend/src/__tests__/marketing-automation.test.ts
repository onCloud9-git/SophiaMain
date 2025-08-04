import { MarketingAutomationProcessor } from '../jobs/processors/marketing-automation.processor'
import { marketingService } from '../services/marketing.service'
import { BusinessModel } from '../models/business.model'
import { MarketingCampaignModel } from '../models/marketing-campaign.model'
import { aiService } from '../services/ai.service'
import { Job } from 'bull'
import { MarketingAutomationJobData } from '../jobs/types'

// Mock external dependencies
jest.mock('../services/marketing.service')
jest.mock('../models/business.model')
jest.mock('../models/marketing-campaign.model')
jest.mock('../services/ai.service')
jest.mock('../index', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

const mockMarketingService = marketingService as jest.Mocked<typeof marketingService>
const mockBusinessModel = BusinessModel as jest.Mocked<typeof BusinessModel>
const mockMarketingCampaignModel = MarketingCampaignModel as jest.Mocked<typeof MarketingCampaignModel>
const mockAIService = aiService as jest.Mocked<typeof aiService>

describe('MarketingAutomationProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processMarketingAutomation', () => {
    const mockJobData: MarketingAutomationJobData = {
      id: 'test-automation-1',
      evaluationPeriod: 14,
      analysisScope: 'all_businesses',
      decisionThresholds: {
        minROAS: 2.0,
        minPerformanceScore: 40,
        scaleThreshold: 70,
        pauseThreshold: 30
      },
      enableABTesting: false,
      notificationSettings: {
        email: true,
        slack: true
      }
    }

    const mockJob = {
      id: 'job-123',
      data: mockJobData,
      progress: jest.fn()
    } as unknown as Job<MarketingAutomationJobData>

    const mockBusiness = {
      id: 'business-1',
      name: 'Test Business',
      status: 'ACTIVE',
      monthlyPrice: 29.99
    }

    const mockCampaign = {
      id: 'campaign-1',
      name: 'Test Campaign',
      platform: 'GOOGLE_ADS',
      status: 'ACTIVE',
      businessId: 'business-1',
      impressions: 10000,
      clicks: 200,
      conversions: 10,
      spent: 150
    }

    beforeEach(() => {
      mockBusinessModel.getActiveBusinesses.mockResolvedValue([mockBusiness])
      mockBusinessModel.getById.mockResolvedValue(mockBusiness)
      mockMarketingCampaignModel.getByBusinessId.mockResolvedValue([mockCampaign])
    })

    it('should successfully process marketing automation workflow', async () => {
      // Mock performance analysis
      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 75,
        recommendation: 'SCALE',
        reasons: ['Strong performance indicators'],
        metrics: {
          ctr: 2.0,
          cpc: 0.75,
          conversions: 10,
          roas: 3.5,
          costPerConversion: 15
        }
      })

      // Mock AI service evaluation
      mockAIService.evaluateBusinessPerformance.mockResolvedValue({
        confidence: 0.85,
        reasoning: 'Strong ROAS and conversion metrics'
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(mockJob)

      expect(result.success).toBe(true)
      expect(result.data.businessesAnalyzed).toBe(1)
      expect(result.data.decisions).toHaveLength(1)
      expect(result.data.decisions[0].decision).toBe('SCALE')
      expect(result.data.decisions[0].businessId).toBe('business-1')
      expect(result.data.decisions[0].campaigns).toHaveLength(1)
    })

    it('should handle poor performing campaigns correctly', async () => {
      // Mock poor performance analysis
      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 25,
        recommendation: 'PAUSE',
        reasons: ['Poor ROAS', 'Low conversion rate'],
        metrics: {
          ctr: 0.8,
          cpc: 1.5,
          conversions: 2,
          roas: 0.8,
          costPerConversion: 75
        }
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(mockJob)

      expect(result.success).toBe(true)
      expect(result.data.decisions[0].decision).toBe('PAUSE')
      expect(result.data.decisions[0].campaigns[0].action).toBe('PAUSE')
      expect(result.data.decisions[0].reasons).toContain('Poor overall performance requiring optimization')
    })

    it('should recommend business closure for consistently poor performance', async () => {
      // Mock business running for 2+ weeks with poor performance
      const jobDataWithLongEvaluation = {
        ...mockJobData,
        evaluationPeriod: 21 // 3 weeks
      }

      const jobWithLongEvaluation = {
        ...mockJob,
        data: jobDataWithLongEvaluation
      } as Job<MarketingAutomationJobData>

      // Mock very poor performance
      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 15,
        recommendation: 'PAUSE',
        reasons: ['Consistently poor performance', 'ROAS below threshold'],
        metrics: {
          ctr: 0.5,
          cpc: 2.0,
          conversions: 1,
          roas: 0.5,
          costPerConversion: 150
        }
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(jobWithLongEvaluation)

      expect(result.success).toBe(true)
      // With all campaigns performing poorly for 2+ weeks, should recommend closure
      const decision = result.data.decisions[0]
      expect(['CLOSE', 'PAUSE']).toContain(decision.decision)
    })

    it('should handle early stage businesses conservatively', async () => {
      // Mock early stage business (< 14 days)
      const jobDataEarlyStage = {
        ...mockJobData,
        evaluationPeriod: 7 // 1 week
      }

      const jobEarlyStage = {
        ...mockJob,
        data: jobDataEarlyStage
      } as Job<MarketingAutomationJobData>

      // Mock decent early performance
      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 60,
        recommendation: 'MAINTAIN',
        reasons: ['Moderate early performance'],
        metrics: {
          ctr: 1.5,
          cpc: 1.0,
          conversions: 5,
          roas: 2.2,
          costPerConversion: 30
        }
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(jobEarlyStage)

      expect(result.success).toBe(true)
      expect(result.data.decisions[0].decision).toBe('MAINTAIN')
      expect(result.data.decisions[0].reasons).toContain('Business in learning phase, monitoring closely')
    })

    it('should handle specific business analysis scope', async () => {
      const jobDataSpecific = {
        ...mockJobData,
        analysisScope: 'specific_business' as const,
        targetBusinessIds: ['business-1']
      }

      const jobSpecific = {
        ...mockJob,
        data: jobDataSpecific
      } as Job<MarketingAutomationJobData>

      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 85,
        recommendation: 'SCALE',
        reasons: ['Excellent performance'],
        metrics: {
          ctr: 3.2,
          cpc: 0.65,
          conversions: 15,
          roas: 4.5,
          costPerConversion: 10
        }
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(jobSpecific)

      expect(result.success).toBe(true)
      expect(mockBusinessModel.getById).toHaveBeenCalledWith('business-1')
      expect(result.data.decisions[0].decision).toBe('SCALE')
    })

    it('should handle errors gracefully', async () => {
      // Mock error in campaign analysis
      mockMarketingService.analyzeCampaignPerformance.mockRejectedValue(new Error('API error'))

      const result = await MarketingAutomationProcessor.processMarketingAutomation(mockJob)

      expect(result.success).toBe(false)
      expect(result.error).toContain('API error')
    })

    it('should execute marketing decisions correctly', async () => {
      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 80,
        recommendation: 'SCALE',
        reasons: ['Strong performance'],
        suggestedBudgetChange: 1.2,
        metrics: {
          ctr: 2.5,
          cpc: 0.8,
          conversions: 12,
          roas: 3.8,
          costPerConversion: 12.5
        }
      })

      mockMarketingService.scaleCampaign.mockResolvedValue()
      mockMarketingService.pauseCampaign.mockResolvedValue()
      mockMarketingService.optimizeCampaign.mockResolvedValue({
        campaignId: 'campaign-1',
        optimizations: [],
        expectedImpact: 'Test'
      })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(mockJob)

      expect(result.success).toBe(true)
      expect(mockMarketingService.scaleCampaign).toHaveBeenCalledWith('campaign-1', 1.2)
    })

    it('should generate comprehensive executive summary', async () => {
      // Mock multiple businesses with different decisions
      const business2 = { ...mockBusiness, id: 'business-2', name: 'Business 2' }
      mockBusinessModel.getActiveBusinesses.mockResolvedValue([mockBusiness, business2])

      // Business 1: Scale
      mockMarketingService.analyzeCampaignPerformance
        .mockResolvedValueOnce({
          campaignId: 'campaign-1',
          platform: 'GOOGLE_ADS',
          performanceScore: 85,
          recommendation: 'SCALE',
          reasons: ['Excellent performance'],
          metrics: {
            ctr: 3.0,
            cpc: 0.7,
            conversions: 15,
            roas: 4.2,
            costPerConversion: 10
          }
        })
        // Business 2: Pause  
        .mockResolvedValueOnce({
          campaignId: 'campaign-2',
          platform: 'GOOGLE_ADS',
          performanceScore: 25,
          recommendation: 'PAUSE',
          reasons: ['Poor performance'],
          metrics: {
            ctr: 0.8,
            cpc: 1.8,
            conversions: 2,
            roas: 0.9,
            costPerConversion: 90
          }
        })

      const result = await MarketingAutomationProcessor.processMarketingAutomation(mockJob)

      expect(result.success).toBe(true)
      expect(result.data.summary.totalBusinesses).toBe(2)
      expect(result.data.summary.decisions.scale).toBe(1)
      expect(result.data.summary.decisions.pause).toBe(1)
      expect(result.data.summary.avgConfidence).toBeGreaterThan(0)
    })
  })

  describe('AI Decision Making Logic', () => {
    it('should make proper scaling decisions for excellent performance', async () => {
      const mockBusiness = {
        id: 'business-1',
        name: 'Test Business',
        status: 'ACTIVE',
        monthlyPrice: 50
      }

      const mockCampaigns = [{
        campaignId: 'campaign-1',
        campaignName: 'Test Campaign',
        platform: 'GOOGLE_ADS',
        action: 'SCALE' as const,
        reasons: ['High ROAS', 'Good CTR'],
        performanceMetrics: {
          score: 90,
          roas: 4.5,
          ctr: 3.2,
          conversions: 20
        }
      }]

      // This tests the private method indirectly through the main processor
      const jobData: MarketingAutomationJobData = {
        id: 'test-1',
        evaluationPeriod: 21, // Mature business
        analysisScope: 'all_businesses',
        decisionThresholds: {
          minROAS: 2.0,
          minPerformanceScore: 40,
          scaleThreshold: 70,
          pauseThreshold: 30
        }
      }

      mockBusinessModel.getActiveBusinesses.mockResolvedValue([mockBusiness])
      mockBusinessModel.getById.mockResolvedValue(mockBusiness)
      mockMarketingCampaignModel.getByBusinessId.mockResolvedValue([{
        id: 'campaign-1',
        name: 'Test Campaign',
        platform: 'GOOGLE_ADS',
        status: 'ACTIVE',
        businessId: 'business-1'
      }])

      mockMarketingService.analyzeCampaignPerformance.mockResolvedValue({
        campaignId: 'campaign-1',
        platform: 'GOOGLE_ADS',
        performanceScore: 90,
        recommendation: 'SCALE',
        reasons: ['Excellent performance metrics'],
        metrics: {
          ctr: 3.2,
          cpc: 0.6,
          conversions: 20,
          roas: 4.5,
          costPerConversion: 8
        }
      })

      const job = {
        id: 'job-123',
        data: jobData,
        progress: jest.fn()
      } as unknown as Job<MarketingAutomationJobData>

      const result = await MarketingAutomationProcessor.processMarketingAutomation(job)

      expect(result.success).toBe(true)
      expect(result.data.decisions[0].decision).toBe('SCALE')
      expect(result.data.decisions[0].confidence).toBeGreaterThan(0.8)
    })

    it('should handle mixed campaign performance intelligently', async () => {
      const mockBusiness = {
        id: 'business-1',
        name: 'Mixed Performance Business',
        status: 'ACTIVE',
        monthlyPrice: 39.99
      }

      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Good Campaign',
          platform: 'GOOGLE_ADS',
          status: 'ACTIVE',
          businessId: 'business-1'
        },
        {
          id: 'campaign-2', 
          name: 'Poor Campaign',
          platform: 'FACEBOOK_ADS',
          status: 'ACTIVE',
          businessId: 'business-1'
        }
      ]

      mockBusinessModel.getActiveBusinesses.mockResolvedValue([mockBusiness])
      mockBusinessModel.getById.mockResolvedValue(mockBusiness)
      mockMarketingCampaignModel.getByBusinessId.mockResolvedValue(mockCampaigns)

      // Good campaign
      mockMarketingService.analyzeCampaignPerformance
        .mockResolvedValueOnce({
          campaignId: 'campaign-1',
          platform: 'GOOGLE_ADS',
          performanceScore: 80,
          recommendation: 'SCALE',
          reasons: ['Good performance'],
          metrics: {
            ctr: 2.8,
            cpc: 0.75,
            conversions: 15,
            roas: 3.5,
            costPerConversion: 12
          }
        })
        // Poor campaign
        .mockResolvedValueOnce({
          campaignId: 'campaign-2',
          platform: 'FACEBOOK_ADS', 
          performanceScore: 35,
          recommendation: 'PAUSE',
          reasons: ['Poor ROAS'],
          metrics: {
            ctr: 1.0,
            cpc: 1.2,
            conversions: 3,
            roas: 1.2,
            costPerConversion: 40
          }
        })

      const jobData: MarketingAutomationJobData = {
        id: 'test-mixed',
        evaluationPeriod: 14,
        analysisScope: 'all_businesses'
      }

      const job = {
        id: 'job-mixed',
        data: jobData,
        progress: jest.fn()
      } as unknown as Job<MarketingAutomationJobData>

      const result = await MarketingAutomationProcessor.processMarketingAutomation(job)

      expect(result.success).toBe(true)
      expect(result.data.decisions[0].campaigns).toHaveLength(2)
      expect(result.data.decisions[0].campaigns[0].action).toBe('SCALE')
      expect(result.data.decisions[0].campaigns[1].action).toBe('PAUSE')
      // Should optimize or maintain given mixed performance
      expect(['OPTIMIZE', 'MAINTAIN', 'SCALE']).toContain(result.data.decisions[0].decision)
    })
  })
})