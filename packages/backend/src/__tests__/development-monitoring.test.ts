import { cursorAIService } from '../services/cursor-ai.service'
import { BusinessProcessor } from '../jobs/processors/business.processor'
import { Job } from 'bull'

// Mock dependencies
jest.mock('../lib/puppeteer-mcp-client', () => ({
  default: jest.fn().mockImplementation(() => ({
    navigate: jest.fn().mockResolvedValue({ success: true }),
    screenshot: jest.fn().mockResolvedValue({ success: true, filename: 'test.png' }),
    evaluate: jest.fn().mockResolvedValue({ success: true, result: 'Test Page' }),
    close: jest.fn().mockResolvedValue({ success: true })
  }))
}))

jest.mock('../services/business.service', () => ({
  BusinessService: {
    getBusinessById: jest.fn().mockResolvedValue({
      id: 'test-business-id',
      name: 'Test Business',
      ownerId: 'test-owner-id'
    }),
    updateBusiness: jest.fn().mockResolvedValue(true)
  }
}))

jest.mock('../services/websocket.service', () => ({
  webSocketService: {
    emitDevelopmentUpdate: jest.fn(),
    emitNotification: jest.fn(),
    emitAnalyticsUpdate: jest.fn()
  }
}))

jest.mock('../jobs/queue', () => ({
  queue: {
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' })
  }
}))

describe('Development Monitoring Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CursorAIService - Code Quality Analysis', () => {
    it('should run code quality analysis successfully', async () => {
      const businessId = 'test-business-id'
      
      // Mock project path exists
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined)
      
      const metrics = await cursorAIService.getCodeQualityMetrics(businessId)
      
      expect(metrics).toBeDefined()
      expect(metrics).toHaveProperty('linesOfCode')
      expect(metrics).toHaveProperty('testCoverage')
      expect(metrics).toHaveProperty('eslintErrors')
      expect(metrics).toHaveProperty('typescriptErrors')
      expect(metrics).toHaveProperty('securityIssues')
    })

    it('should handle code analysis errors gracefully', async () => {
      const businessId = 'invalid-business-id'
      
      // Mock project not found
      jest.spyOn(require('fs/promises'), 'access').mockRejectedValue(new Error('Project not found'))
      
      const metrics = await cursorAIService.getCodeQualityMetrics(businessId)
      
      expect(metrics.eslintErrors).toBe(999)
      expect(metrics.typescriptErrors).toBe(999)
      expect(metrics.securityIssues).toBe(999)
    })
  })

  describe('CursorAIService - Automated Testing', () => {
    it('should run automated tests successfully', async () => {
      const businessId = 'test-business-id'
      
      // Mock project directory exists
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined)
      
      const testResults = await cursorAIService.runAutomatedTests(businessId)
      
      expect(testResults).toBeDefined()
      expect(testResults).toHaveProperty('unitTests')
      expect(testResults).toHaveProperty('integrationTests')
      expect(testResults).toHaveProperty('e2eTests')
      expect(testResults).toHaveProperty('overall')
      
      expect(testResults.overall).toHaveProperty('passed')
      expect(testResults.overall).toHaveProperty('totalTests')
      expect(testResults.overall).toHaveProperty('passedTests')
      expect(testResults.overall).toHaveProperty('duration')
    })

    it('should handle E2E test failures gracefully', async () => {
      const businessId = 'test-business-id'
      
      // Mock PuppeteerMCPClient navigation failure
      const MockedPuppeteerClient = require('../lib/puppeteer-mcp-client').default
      MockedPuppeteerClient.mockImplementation(() => ({
        navigate: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        screenshot: jest.fn().mockResolvedValue({ success: true }),
        evaluate: jest.fn().mockResolvedValue({ success: true }),
        close: jest.fn().mockResolvedValue({ success: true })
      }))
      
      const testResults = await cursorAIService.runAutomatedTests(businessId)
      
      expect(testResults.e2eTests.passed).toBe(false)
      expect(testResults.e2eTests.failed_count).toBeGreaterThan(0)
    })
  })

  describe('BusinessProcessor - Development Monitoring', () => {
    it('should process development monitoring job successfully', async () => {
      const mockJob = {
        id: 'test-job-id',
        data: { businessId: 'test-business-id' },
        progress: jest.fn().mockResolvedValue(undefined)
      } as unknown as Job<{businessId: string}>
      
      // Mock successful progress and quality checks
      jest.spyOn(cursorAIService, 'getProjectProgress').mockResolvedValue({
        businessId: 'test-business-id',
        stage: 'testing',
        progress: 80,
        hasTestableComponents: true,
        isComplete: false,
        lastUpdate: new Date()
      })
      
      jest.spyOn(cursorAIService, 'getCodeQualityMetrics').mockResolvedValue({
        linesOfCode: 1500,
        testCoverage: 85,
        eslintErrors: 2,
        typescriptErrors: 0,
        securityIssues: 0,
        complexity: 'medium',
        duplicateCode: 5,
        performanceScore: 85
      })
      
      jest.spyOn(cursorAIService, 'runAutomatedTests').mockResolvedValue({
        unitTests: { passed: true, total: 10, passed_count: 10, failed_count: 0, duration: 5000 },
        integrationTests: { passed: true, total: 0, passed_count: 0, failed_count: 0, duration: 0 },
        e2eTests: { passed: true, total: 2, passed_count: 2, failed_count: 0, duration: 15000 },
        overall: { passed: true, totalTests: 12, passedTests: 12, duration: 20000 }
      })
      
      const result = await BusinessProcessor.processDevelopmentMonitoring(mockJob)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('progress')
      expect(result.data).toHaveProperty('codeQuality')
      expect(result.data).toHaveProperty('testResults')
      expect(mockJob.progress).toHaveBeenCalledWith(100)
    })

    it('should trigger deployment when code quality is good', async () => {
      const mockJob = {
        id: 'test-job-id',
        data: { businessId: 'test-business-id' },
        progress: jest.fn().mockResolvedValue(undefined)
      } as unknown as Job<{businessId: string}>
      
      // Mock project ready for deployment
      jest.spyOn(cursorAIService, 'getProjectProgress').mockResolvedValue({
        businessId: 'test-business-id',
        stage: 'complete',
        progress: 100,
        hasTestableComponents: true,
        isComplete: true,
        lastUpdate: new Date()
      })
      
      jest.spyOn(cursorAIService, 'getCodeQualityMetrics').mockResolvedValue({
        linesOfCode: 2000,
        testCoverage: 90,
        eslintErrors: 3,  // Less than 10
        typescriptErrors: 0,  // No TS errors
        securityIssues: 0,
        complexity: 'low',
        duplicateCode: 2,
        performanceScore: 95
      })
      
      jest.spyOn(cursorAIService, 'deployProject').mockResolvedValue('https://test-business.vercel.app')
      jest.spyOn(cursorAIService, 'setupDeploymentMonitoring').mockResolvedValue(undefined)
      
      const result = await BusinessProcessor.processDevelopmentMonitoring(mockJob)
      
      expect(cursorAIService.deployProject).toHaveBeenCalledWith('test-business-id')
      expect(cursorAIService.setupDeploymentMonitoring).toHaveBeenCalledWith(
        'test-business-id',
        'https://test-business.vercel.app'
      )
      expect(result.success).toBe(true)
    })

    it('should send warning notification for poor code quality', async () => {
      const mockJob = {
        id: 'test-job-id',
        data: { businessId: 'test-business-id' },
        progress: jest.fn().mockResolvedValue(undefined)
      } as unknown as Job<{businessId: string}>
      
      // Mock poor code quality
      jest.spyOn(cursorAIService, 'getProjectProgress').mockResolvedValue({
        businessId: 'test-business-id',
        stage: 'development',
        progress: 60,
        hasTestableComponents: false,
        isComplete: false,
        lastUpdate: new Date()
      })
      
      jest.spyOn(cursorAIService, 'getCodeQualityMetrics').mockResolvedValue({
        linesOfCode: 3000,
        testCoverage: 30,
        eslintErrors: 75,  // More than 50
        typescriptErrors: 15,  // More than 10
        securityIssues: 5,
        complexity: 'high',
        duplicateCode: 25,
        performanceScore: 30
      })
      
      const webSocketService = require('../services/websocket.service').webSocketService
      
      const result = await BusinessProcessor.processDevelopmentMonitoring(mockJob)
      
      expect(webSocketService.emitNotification).toHaveBeenCalledWith(
        'test-owner-id',
        expect.objectContaining({
          type: 'warning',
          title: 'Problemy z jakością kodu',
          message: expect.stringContaining('75 błędów ESLint i 15 błędów TypeScript')
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('BusinessProcessor - Deployment Health Check', () => {
    it('should perform health check successfully', async () => {
      const mockJob = {
        id: 'health-check-job-id',
        data: { 
          businessId: 'test-business-id', 
          deploymentUrl: 'https://test-business.vercel.app' 
        },
        progress: jest.fn().mockResolvedValue(undefined)
      } as unknown as Job<{businessId: string, deploymentUrl: string}>
      
      const result = await BusinessProcessor.processDeploymentHealthCheck(mockJob)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('healthChecks')
      expect(result.data.healthChecks).toHaveProperty('accessible')
      expect(result.data.healthChecks).toHaveProperty('responseTime')
      expect(result.data.healthChecks).toHaveProperty('hasContent')
      expect(mockJob.progress).toHaveBeenCalledWith(100)
    })
  })

  describe('BusinessProcessor - Performance Monitoring', () => {
    it('should monitor performance successfully', async () => {
      const mockJob = {
        id: 'performance-job-id',
        data: { 
          businessId: 'test-business-id', 
          deploymentUrl: 'https://test-business.vercel.app' 
        },
        progress: jest.fn().mockResolvedValue(undefined)
      } as unknown as Job<{businessId: string, deploymentUrl: string}>
      
      const result = await BusinessProcessor.processPerformanceMonitoring(mockJob)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('performanceMetrics')
      expect(result.data.performanceMetrics).toHaveProperty('performanceScore')
      expect(result.data.performanceMetrics).toHaveProperty('loadTime')
      expect(result.data.performanceMetrics).toHaveProperty('firstContentfulPaint')
      expect(mockJob.progress).toHaveBeenCalledWith(100)
    })
  })
})