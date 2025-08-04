import { SophiaAIAgent, sophiaAI } from '../services/ai.service'
import { BusinessIdea, BusinessStatus } from '@sophia/shared/types/business'
import { MarketAnalysis, BusinessDecision } from '@sophia/shared/types/ai'

// Mock console to avoid spam during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-api-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('SophiaAIAgent (Standalone)', () => {
  let aiAgent: SophiaAIAgent

  beforeEach(() => {
    aiAgent = new SophiaAIAgent()
  })

  describe('analyzeMarketOpportunity', () => {
    it('should analyze market opportunity for a given industry', async () => {
      const industry = 'Healthcare Technology'
      
      const result = await aiAgent.analyzeMarketOpportunity(industry)
      
      expect(result).toBeDefined()
      expect(result.industry).toBe(industry)
      expect(result.marketSize).toBeGreaterThan(0)
      expect(result.competitorCount).toBeGreaterThanOrEqual(0)
      expect(result.growthRate).toBeGreaterThanOrEqual(0)
      expect(result.barriers).toBeInstanceOf(Array)
      expect(result.opportunities).toBeInstanceOf(Array)
      expect(result.threats).toBeInstanceOf(Array)
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.recommendation)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle AI API failures gracefully', async () => {
      // Test without API key to trigger fallback
      process.env.OPENAI_API_KEY = ''
      const agentWithoutKey = new SophiaAIAgent()
      
      const result = await agentWithoutKey.analyzeMarketOpportunity('Technology')
      
      expect(result).toBeDefined()
      expect(result.industry).toBe('Technology')
      expect(result.confidence).toBe(0.6) // Fallback confidence
    })
  })

  describe('generateBusinessIdea', () => {
    it('should generate a business idea without industry specified', async () => {
      const result = await aiAgent.generateBusinessIdea()
      
      expect(result).toBeDefined()
      expect(result.title).toBeDefined()
      expect(result.description).toBeDefined()
      expect(result.industry).toBeDefined()
      expect(result.targetMarket).toBeDefined()
      expect(result.businessModel).toBeDefined()
      expect(result.estimatedRevenue).toBeGreaterThan(0)
      expect(result.competitionAnalysis).toBeInstanceOf(Array)
      expect(result.marketOpportunity).toBeDefined()
    })

    it('should generate a business idea for specific industry', async () => {
      const industry = 'FinTech'
      
      const result = await aiAgent.generateBusinessIdea(industry)
      
      expect(result).toBeDefined()
      expect(result.industry).toBe(industry)
    })
  })

  describe('generateBusinessPlan', () => {
    it('should generate comprehensive business plan from idea', async () => {
      const mockIdea: BusinessIdea = {
        title: 'AI-Powered CRM',
        description: 'CRM with AI insights for sales optimization',
        industry: 'Sales Technology',
        targetMarket: 'SMB sales teams',
        businessModel: 'Monthly subscription',
        estimatedRevenue: 10000,
        competitionAnalysis: ['Salesforce', 'HubSpot'],
        marketOpportunity: 'Growing need for AI in sales'
      }

      const result = await aiAgent.generateBusinessPlan(mockIdea)
      
      expect(result).toBeDefined()
      expect(result.idea).toEqual(mockIdea)
      expect(result.technicalSpecs).toBeDefined()
      expect(result.technicalSpecs.technologies).toBeInstanceOf(Array)
      expect(result.technicalSpecs.features).toBeInstanceOf(Array)
      expect(result.technicalSpecs.architecture).toBeDefined()
      expect(result.marketingStrategy).toBeDefined()
      expect(result.marketingStrategy.targetAudience).toBeDefined()
      expect(result.marketingStrategy.channels).toBeInstanceOf(Array)
      expect(result.marketingStrategy.budget).toBeGreaterThan(0)
      expect(result.financialProjections).toBeDefined()
      expect(result.financialProjections.monthlyRevenue).toBe(mockIdea.estimatedRevenue)
      expect(result.financialProjections.costs).toBeGreaterThan(0)
      expect(result.financialProjections.profitMargin).toBeGreaterThan(0)
    })
  })

  describe('evaluateBusinessPerformance', () => {
    it('should evaluate business performance and make decisions', async () => {
      const businessId = 'business_123'
      const mockMetrics = {
        revenue: 5000,
        growth: 0.15,
        users: 100,
        churn: 0.05
      }
      
      const result = await aiAgent.evaluateBusinessPerformance(businessId, mockMetrics)
      
      expect(result).toBeDefined()
      expect(['SCALE', 'PAUSE', 'OPTIMIZE', 'CLOSE', 'MAINTAIN']).toContain(result.action)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.reasoning).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.recommendations).toBeInstanceOf(Array)
    })
  })

  describe('error handling', () => {
    it('should handle missing API key gracefully', async () => {
      process.env.OPENAI_API_KEY = ''
      const agentWithoutKey = new SophiaAIAgent()
      
      // Should not throw and use fallback responses
      const marketAnalysis = await agentWithoutKey.analyzeMarketOpportunity('Technology')
      expect(marketAnalysis).toBeDefined()
      
      const businessIdea = await agentWithoutKey.generateBusinessIdea()
      expect(businessIdea).toBeDefined()
    })

    it('should provide meaningful fallback responses', async () => {
      // Force AI call to fail by using invalid API key
      process.env.OPENAI_API_KEY = ''
      const agentWithBadKey = new SophiaAIAgent()
      
      const decision = await agentWithBadKey.evaluateBusinessPerformance('test_id')
      
      expect(decision.action).toBe('MAINTAIN')
      expect(decision.confidence).toBe(0.5)
      expect(decision.reasoning).toContain('Unable to analyze')
    })
  })

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(sophiaAI).toBeInstanceOf(SophiaAIAgent)
    })

    it('should be the same instance across imports', () => {
      const { sophiaAI: secondImport } = require('../services/ai.service')
      expect(sophiaAI).toBe(secondImport)
    })
  })
})

describe('Integration with Business Models (Standalone)', () => {
  it('should work with existing business status types', () => {
    const validStatuses: BusinessStatus[] = [
      BusinessStatus.PLANNING,
      BusinessStatus.DEVELOPING,
      BusinessStatus.DEPLOYING,
      BusinessStatus.ACTIVE,
      BusinessStatus.PAUSED,
      BusinessStatus.CLOSED
    ]
    
    expect(validStatuses).toHaveLength(6)
    expect(validStatuses).toContain(BusinessStatus.ACTIVE)
  })
})