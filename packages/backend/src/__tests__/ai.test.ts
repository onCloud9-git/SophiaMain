import { SophiaAIAgent, sophiaAI } from '../services/ai.service'
import { BusinessIdea, BusinessStatus } from '@sophia/shared/types/business'
import { MarketAnalysis, BusinessDecision } from '@sophia/shared/types/ai'

// Mock logger to avoid console spam during tests
jest.mock('../index', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

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

describe('SophiaAIAgent', () => {
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

  describe('orchestrateDevelopment', () => {
    it('should create development plan from business plan', async () => {
      const mockBusinessPlan = {
        idea: {
          title: 'Test App',
          description: 'Test description',
          industry: 'Technology',
          targetMarket: 'Developers',
          businessModel: 'Subscription',
          estimatedRevenue: 5000,
          competitionAnalysis: ['Competitor1'],
          marketOpportunity: 'High demand'
        },
        technicalSpecs: {
          technologies: ['React', 'Node.js'],
          features: ['Authentication', 'Dashboard'],
          architecture: 'Microservices'
        },
        marketingStrategy: {
          targetAudience: 'Developers',
          channels: ['Google Ads'],
          budget: 2000
        },
        financialProjections: {
          monthlyRevenue: 5000,
          costs: 2000,
          profitMargin: 0.6
        }
      }

      const result = await aiAgent.orchestrateDevelopment(mockBusinessPlan)
      
      expect(result).toBeDefined()
      expect(result.projectId).toBeDefined()
      expect(result.phases).toBeInstanceOf(Array)
      expect(result.phases.length).toBeGreaterThan(0)
      expect(result.technologies).toBeInstanceOf(Array)
      expect(result.estimatedCompletion).toBeInstanceOf(Date)
      
      // Check phase structure
      result.phases.forEach(phase => {
        expect(phase.name).toBeDefined()
        expect(phase.duration).toBeGreaterThan(0)
        expect(phase.tasks).toBeInstanceOf(Array)
        expect(phase.dependencies).toBeInstanceOf(Array)
      })
    })
  })

  describe('monitorDevelopmentProgress', () => {
    it('should monitor development progress for a project', async () => {
      const projectId = 'test_project_123'
      
      const result = await aiAgent.monitorDevelopmentProgress(projectId)
      
      expect(result).toBeDefined()
      expect(result.phase).toBeDefined()
      expect(result.progress).toBeGreaterThanOrEqual(0)
      expect(result.progress).toBeLessThanOrEqual(100)
      expect(result.tasksCompleted).toBeGreaterThanOrEqual(0)
      expect(result.totalTasks).toBeGreaterThan(0)
      expect(result.currentTask).toBeDefined()
      expect(typeof result.isComplete).toBe('boolean')
      expect(typeof result.hasIssues).toBe('boolean')
      expect(result.estimatedCompletion).toBeInstanceOf(Date)
      
      if (result.hasIssues) {
        expect(result.issues).toBeInstanceOf(Array)
        expect(result.issues!.length).toBeGreaterThan(0)
      }
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

    it('should handle evaluation without metrics', async () => {
      const businessId = 'business_456'
      
      const result = await aiAgent.evaluateBusinessPerformance(businessId)
      
      expect(result).toBeDefined()
      expect(result.action).toBeDefined()
    })
  })

  describe('recommendActions', () => {
    it('should recommend optimization actions based on metrics', async () => {
      const mockMetrics = {
        revenue: 3000,
        growth: 0.05,
        conversionRate: 0.02,
        customerAcquisitionCost: 150
      }
      
      const result = await aiAgent.recommendActions(mockMetrics)
      
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      
      result.forEach(action => {
        expect(['MARKETING', 'DEVELOPMENT', 'BUSINESS', 'FINANCIAL']).toContain(action.type)
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(action.priority)
        expect(action.action).toBeDefined()
        expect(action.expectedImpact).toBeDefined()
        expect(action.timeframe).toBeDefined()
        expect(action.resources).toBeInstanceOf(Array)
      })
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

describe('Integration with Business Models', () => {
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