import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'
import { PuppeteerMonitoringService } from '../services/puppeteer-monitoring.service'
import { BusinessService } from '../services/business.service'
import { PuppeteerMCPClient } from '../lib/puppeteer-mcp-client'

// Mock dependencies
jest.mock('../services/business.service')
jest.mock('../lib/puppeteer-mcp-client')

const mockBusiness = {
  id: 'test-business-1',
  name: 'Test Business',
  websiteUrl: 'https://example.com',
  description: 'Test business for monitoring',
  status: 'ACTIVE'
}

const mockBusinessService = {
  getById: jest.fn()
}

const mockPuppeteerClient = {
  navigate: jest.fn(),
  screenshot: jest.fn(),
  evaluate: jest.fn(),
  click: jest.fn(),
  fill: jest.fn(),
  close: jest.fn()
}

describe('PuppeteerMonitoringService', () => {
  let service: PuppeteerMonitoringService
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    (BusinessService as jest.MockedClass<typeof BusinessService>).mockImplementation(() => mockBusinessService as any)
    ;(PuppeteerMCPClient as jest.MockedClass<typeof PuppeteerMCPClient>).mockImplementation(() => mockPuppeteerClient as any)
    
    service = new PuppeteerMonitoringService()
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('checkWebsiteHealth', () => {
    it('should successfully check website health', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.evaluate.mockResolvedValueOnce({
        title: 'Test Business',
        hasJsErrors: false,
        consoleErrors: [],
        httpStatus: 200
      }).mockResolvedValueOnce(0) // brokenElements

      // Act
      const result = await service.checkWebsiteHealth('test-business-1')

      // Assert
      expect(result).toMatchObject({
        isOnline: true,
        httpStatus: 200,
        title: 'Test Business',
        hasErrors: false,
        errorMessages: []
      })
      expect(result.responseTime).toBeGreaterThan(0)
      expect(result.timestamp).toBeInstanceOf(Date)
      
      expect(mockPuppeteerClient.navigate).toHaveBeenCalledWith('https://example.com')
      expect(mockPuppeteerClient.evaluate).toHaveBeenCalledTimes(2)
    })

    it('should handle navigation failure', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockRejectedValue(new Error('Navigation failed'))

      // Act
      const result = await service.checkWebsiteHealth('test-business-1')

      // Assert
      expect(result.isOnline).toBe(false)
      expect(result.httpStatus).toBe(500)
      expect(result.hasErrors).toBe(true)
      expect(result.errorMessages).toContain('Navigation failed: Navigation failed')
    })

    it('should throw error for business without website URL', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue({ ...mockBusiness, websiteUrl: null })

      // Act & Assert
      await expect(service.checkWebsiteHealth('test-business-1')).rejects.toThrow(
        'Business test-business-1 has no website URL configured'
      )
    })
  })

  describe('runLighthouseAudit', () => {
    it('should successfully run lighthouse audit', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.evaluate.mockResolvedValueOnce({
        loadTime: 1500,
        domContentLoaded: 800,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0
      }).mockResolvedValueOnce({
        hasAltTexts: true,
        hasProperHeadings: true,
        hasFormLabels: true
      })

      // Act
      const result = await service.runLighthouseAudit('test-business-1')

      // Assert
      expect(result).toMatchObject({
        performance: expect.any(Number),
        accessibility: 100, // All checks passed
        bestPractices: 85,
        seo: 90,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0
      })
      expect(result.performance).toBeGreaterThan(0)
      expect(result.performance).toBeLessThanOrEqual(100)
    })

    it('should handle poor accessibility score', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.evaluate.mockResolvedValueOnce({
        loadTime: 3000,
        domContentLoaded: 2000,
        firstContentfulPaint: 2500,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0
      }).mockResolvedValueOnce({
        hasAltTexts: false,
        hasProperHeadings: true,
        hasFormLabels: false
      })

      // Act
      const result = await service.runLighthouseAudit('test-business-1')

      // Assert
      expect(result.accessibility).toBe(33) // Only 1 out of 3 checks passed
    })
  })

  describe('testPaymentFlow', () => {
    it('should successfully test payment flow', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.screenshot.mockResolvedValue('screenshot.png')
      mockPuppeteerClient.evaluate.mockResolvedValueOnce(true) // subscribe button found
        .mockResolvedValueOnce(true) // stripe form found
      mockPuppeteerClient.click.mockResolvedValue(undefined)

      // Act
      const result = await service.testPaymentFlow('test-business-1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.flowName).toBe('Payment Flow Test')
      expect(result.steps).toHaveLength(3)
      expect(result.steps[0].step).toBe('Navigate to homepage')
      expect(result.steps[1].step).toBe('Click subscribe/pricing button')
      expect(result.steps[2].step).toBe('Verify Stripe payment form present')
      expect(result.totalDuration).toBeGreaterThan(0)
    })

    it('should handle missing subscribe button', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.screenshot.mockResolvedValue('screenshot.png')
      mockPuppeteerClient.evaluate.mockResolvedValueOnce(null) // no subscribe button
        .mockResolvedValueOnce(false) // no stripe form

      // Act
      const result = await service.testPaymentFlow('test-business-1')

      // Assert
      expect(result.success).toBe(false)
      expect(result.steps[1].success).toBe(false)
      expect(result.steps[1].error).toBe('No subscribe button found')
    })
  })

  describe('captureScreenshot', () => {
    it('should successfully capture screenshot', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.evaluate.mockResolvedValue(undefined) // wait for page
      mockPuppeteerClient.screenshot.mockResolvedValue('test-business-1-homepage-123456789.png')

      // Act
      const result = await service.captureScreenshot('test-business-1', 'homepage')

      // Assert
      expect(result).toMatch(/test-business-1-homepage-\d+\.png/)
      expect(mockPuppeteerClient.navigate).toHaveBeenCalledWith('https://example.com')
      expect(mockPuppeteerClient.screenshot).toHaveBeenCalledWith(
        expect.stringMatching(/test-business-1-homepage-\d+/),
        {
          width: 1280,
          height: 720,
          saveToFile: true,
          outputDir: 'screenshots/visual-regression'
        }
      )
    })

    it('should use default page name when not provided', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.evaluate.mockResolvedValue(undefined)
      mockPuppeteerClient.screenshot.mockResolvedValue('test-business-1-homepage-123456789.png')

      // Act
      const result = await service.captureScreenshot('test-business-1')

      // Assert
      expect(result).toMatch(/test-business-1-homepage-\d+\.png/)
    })
  })

  describe('error handling', () => {
    it('should handle business not found', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.checkWebsiteHealth('non-existent-business')).rejects.toThrow(
        'Business non-existent-business has no website URL configured'
      )
    })

    it('should handle puppeteer client errors', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockRejectedValue(new Error('Puppeteer error'))

      // Act
      const result = await service.checkWebsiteHealth('test-business-1')

      // Assert
      expect(result.hasErrors).toBe(true)
      expect(result.errorMessages).toContain('Navigation failed: Puppeteer error')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete monitoring workflow', async () => {
      // Arrange
      mockBusinessService.getById.mockResolvedValue(mockBusiness)
      mockPuppeteerClient.navigate.mockResolvedValue(undefined)
      mockPuppeteerClient.screenshot.mockResolvedValue('screenshot.png')
      
      // Mock different evaluate calls for different purposes
      let evaluateCallCount = 0
      mockPuppeteerClient.evaluate.mockImplementation(() => {
        evaluateCallCount++
        switch (evaluateCallCount) {
          case 1: return Promise.resolve({ title: 'Test Business', hasJsErrors: false, consoleErrors: [], httpStatus: 200 })
          case 2: return Promise.resolve(0) // no broken elements
          case 3: return Promise.resolve({ loadTime: 1000, domContentLoaded: 500, firstContentfulPaint: 800, largestContentfulPaint: 0, cumulativeLayoutShift: 0 })
          case 4: return Promise.resolve({ hasAltTexts: true, hasProperHeadings: true, hasFormLabels: true })
          default: return Promise.resolve(undefined)
        }
      })

      // Act - run multiple monitoring tasks
      const healthCheck = await service.checkWebsiteHealth('test-business-1')
      const lighthouse = await service.runLighthouseAudit('test-business-1')
      const screenshot = await service.captureScreenshot('test-business-1')

      // Assert
      expect(healthCheck.isOnline).toBe(true)
      expect(lighthouse.performance).toBeGreaterThan(80)
      expect(screenshot).toMatch(/\.png$/)
      
      // Verify Puppeteer client was called appropriately
      expect(mockPuppeteerClient.navigate).toHaveBeenCalledTimes(3)
      expect(mockPuppeteerClient.evaluate).toHaveBeenCalledTimes(5) // 2 for health + 2 for lighthouse + 1 for screenshot
    })
  })
})