import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { Job } from 'bull'
import { BusinessProcessor } from '../jobs/processors/business.processor'
import { JobManager } from '../jobs/manager'
import { BusinessCreationJobData, JobType } from '../jobs/types'
import { businessService } from '../services'
import { cursorAIService } from '../services/cursor-ai.service'
import { webSocketService } from '../services/websocket.service'
import { createTestServer } from './setup'

// Mock external services
jest.mock('../services/cursor-ai.service')
jest.mock('../services/websocket.service')

const mockCursorAIService = cursorAIService as jest.Mocked<typeof cursorAIService>
const mockWebSocketService = webSocketService as jest.Mocked<typeof webSocketService>

describe('Business Creation Workflow Integration Tests', () => {
  let testServer: any
  
  beforeAll(async () => {
    testServer = await createTestServer()
    await JobManager.initialize()
  })
  
  afterAll(async () => {
    await JobManager.shutdown()
    await testServer?.close()
  })
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup common mocks
    mockCursorAIService.createProject.mockResolvedValue({
      businessId: 'test-business',
      projectPath: '/tmp/test-project',
      repositoryUrl: 'https://github.com/sophia-ai/test-business',
      deploymentUrl: 'https://test-business.vercel.app'
    })
    
    mockCursorAIService.getProjectProgress.mockResolvedValue({
      businessId: 'test-business',
      stage: 'development',
      progress: 50,
      hasTestableComponents: true,
      testUrl: 'http://localhost:3000/test-business',
      isComplete: false,
      lastUpdate: new Date()
    })
    
    mockWebSocketService.emitProgressUpdate.mockResolvedValue()
    mockWebSocketService.emitNotification.mockResolvedValue()
    mockWebSocketService.emitDevelopmentUpdate.mockResolvedValue()
  })
  
  describe('Complete Business Creation Flow', () => {
    test('should successfully create business without AI research', async () => {
      // Arrange
      const jobData: BusinessCreationJobData = {
        businessIdea: 'SaaS platform for project management',
        aiResearch: false,
        userPrompt: 'Create a simple project management tool',
        targetMarket: 'small-businesses',
        businessModel: 'subscription',
        userId: 'test-user-123'
      }
      
      const mockJob = {
        id: 'test-job-1',
        data: jobData,
        progress: jest.fn(),
        attemptsMade: 0,
        opts: { attempts: 3 }
      } as unknown as Job<BusinessCreationJobData>
      
      // Act
      const result = await BusinessProcessor.processBusinessCreation(mockJob)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('businessId')
      expect(result.data).toHaveProperty('businessPlan')
      expect(result.data).toHaveProperty('projectSetup')
      
      // Verify progress updates were called
      expect(mockJob.progress).toHaveBeenCalledWith(5)
      expect(mockJob.progress).toHaveBeenCalledWith(30)
      expect(mockJob.progress).toHaveBeenCalledWith(100)
      
      // Verify WebSocket emissions
      expect(mockWebSocketService.emitProgressUpdate).toHaveBeenCalled()
      expect(mockWebSocketService.emitNotification).toHaveBeenCalledWith(
        jobData.userId,
        expect.objectContaining({
          type: 'success',
          title: 'Biznes utworzony!'
        })
      )
      
      // Verify Cursor AI integration
      expect(mockCursorAIService.createProject).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          businessPlan: expect.any(Object),
          features: expect.arrayContaining(['authentication', 'payments', 'dashboard']),
          techStack: expect.arrayContaining(['next.js', 'typescript', 'tailwindcss']),
          requirements: expect.arrayContaining(['responsive design', 'SEO optimization'])
        })
      )
    }, 30000)
    
    test('should successfully create business with AI research', async () => {
      // Arrange
      const jobData: BusinessCreationJobData = {
        businessIdea: 'AI-powered fitness app',
        aiResearch: true,
        targetMarket: 'fitness-enthusiasts',
        businessModel: 'freemium',
        userId: 'test-user-456'
      }
      
      const mockJob = {
        id: 'test-job-2',
        data: jobData,
        progress: jest.fn(),
        attemptsMade: 0,
        opts: { attempts: 3 }
      } as unknown as Job<BusinessCreationJobData>
      
      // Act
      const result = await BusinessProcessor.processBusinessCreation(mockJob)
      
      // Assert
      expect(result.success).toBe(true)
      
      // Verify AI research step was included
      expect(mockWebSocketService.emitProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Przeprowadzanie badań AI...',
          stage: 'research'
        })
      )
    }, 30000)
    
    test('should handle business creation failure gracefully', async () => {
      // Arrange
      const jobData: BusinessCreationJobData = {
        businessIdea: 'Invalid business concept',
        userId: 'test-user-789'
      }
      
      const mockJob = {
        id: 'test-job-3',
        data: jobData,
        progress: jest.fn(),
        attemptsMade: 1,
        opts: { attempts: 3, backoff: { delay: 5000 } }
      } as unknown as Job<BusinessCreationJobData>
      
      // Mock a failure in Cursor AI service
      mockCursorAIService.createProject.mockRejectedValue(new Error('Cursor AI setup failed'))
      
      // Act
      const result = await BusinessProcessor.processBusinessCreation(mockJob)
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cursor AI setup failed')
      expect(result.metadata?.retryCount).toBe(1)
      
      // Verify error notification was sent
      expect(mockWebSocketService.emitNotification).toHaveBeenCalledWith(
        jobData.userId,
        expect.objectContaining({
          type: 'error',
          title: 'Błąd tworzenia biznesu'
        })
      )
    })
  })
  
  describe('Development Monitoring Flow', () => {
    test('should monitor development progress successfully', async () => {
      // Arrange
      const businessId = 'test-business-monitoring'
      const mockJob = {
        id: 'monitor-job-1',
        data: { businessId },
        progress: jest.fn()
      } as unknown as Job<{businessId: string}>
      
      // Act
      const result = await BusinessProcessor.processDevelopmentMonitoring(mockJob)
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('progress')
      expect(result.data).toHaveProperty('businessId', businessId)
      
      // Verify monitoring updates were sent
      expect(mockWebSocketService.emitDevelopmentUpdate).toHaveBeenCalledWith(
        businessId,
        expect.objectContaining({
          stage: 'development',
          progress: 50,
          hasTestableComponents: true
        })
      )
    })
    
    test('should trigger deployment when development is complete', async () => {
      // Arrange
      const businessId = 'test-business-complete'
      const mockJob = {
        id: 'monitor-job-2',
        data: { businessId },
        progress: jest.fn()
      } as unknown as Job<{businessId: string}>
      
      // Mock completed development
      mockCursorAIService.getProjectProgress.mockResolvedValue({
        businessId,
        stage: 'complete',
        progress: 100,
        hasTestableComponents: true,
        isComplete: true,
        lastUpdate: new Date()
      })
      
      mockCursorAIService.deployProject.mockResolvedValue('https://test-business-complete.vercel.app')
      
      // Mock business service
      const mockBusiness = {
        id: businessId,
        name: 'Test Business Complete',
        ownerId: 'test-owner-123'
      }
      
      jest.spyOn(businessService, 'getBusinessById').mockResolvedValue(mockBusiness as any)
      jest.spyOn(businessService, 'updateBusiness').mockResolvedValue(mockBusiness as any)
      
      // Act
      const result = await BusinessProcessor.processDevelopmentMonitoring(mockJob)
      
      // Assert
      expect(result.success).toBe(true)
      
      // Verify deployment was triggered
      expect(mockCursorAIService.deployProject).toHaveBeenCalledWith(businessId)
      
      // Verify business status was updated
      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        businessId,
        expect.objectContaining({
          status: 'active',
          metadata: expect.objectContaining({
            deploymentUrl: 'https://test-business-complete.vercel.app'
          })
        })
      )
      
      // Verify deployment notification was sent
      expect(mockWebSocketService.emitNotification).toHaveBeenCalledWith(
        'test-owner-123',
        expect.objectContaining({
          type: 'success',
          title: 'Deployment ukończony!'
        })
      )
    })
  })
  
  describe('End-to-End Workflow Integration', () => {
    test('should complete full business creation to deployment flow', async () => {
      // This test simulates the complete workflow using JobManager
      
      // Arrange - Create a business creation job
      const jobData: Omit<BusinessCreationJobData, 'id'> = {
        businessIdea: 'E-commerce platform for local artisans',
        aiResearch: true,
        targetMarket: 'local-artisans',
        businessModel: 'marketplace',
        userId: 'test-user-e2e'
      }
      
      // Setup progressive mocks for development stages
      let progressCallCount = 0
      mockCursorAIService.getProjectProgress.mockImplementation(async () => {
        progressCallCount++
        if (progressCallCount === 1) {
          return {
            businessId: 'e2e-business',
            stage: 'development',
            progress: 30,
            hasTestableComponents: false,
            isComplete: false,
            lastUpdate: new Date()
          }
        } else if (progressCallCount === 2) {
          return {
            businessId: 'e2e-business',
            stage: 'testing',
            progress: 70,
            hasTestableComponents: true,
            testUrl: 'http://localhost:3000/e2e-business',
            isComplete: false,
            lastUpdate: new Date()
          }
        } else {
          return {
            businessId: 'e2e-business',
            stage: 'complete',
            progress: 100,
            hasTestableComponents: true,
            isComplete: true,
            lastUpdate: new Date()
          }
        }
      })
      
      mockCursorAIService.deployProject.mockResolvedValue('https://e2e-business.vercel.app')
      
      // Act - Create the business through JobManager
      const job = await JobManager.createBusiness(jobData)
      
      // Wait for job completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Assert
      expect(job).toBeDefined()
      expect(job.data.businessIdea).toBe(jobData.businessIdea)
      
      // Verify that all services were called
      expect(mockCursorAIService.createProject).toHaveBeenCalled()
      expect(mockWebSocketService.emitProgressUpdate).toHaveBeenCalled()
      
    }, 45000)
    
    test('should handle workflow interruption and recovery', async () => {
      // Test system resilience when jobs fail and retry
      
      const jobData: BusinessCreationJobData = {
        businessIdea: 'Unstable test business',
        userId: 'test-user-retry'
      }
      
      const mockJob = {
        id: 'retry-job-1',
        data: jobData,
        progress: jest.fn(),
        attemptsMade: 0,
        opts: { attempts: 3, backoff: { delay: 1000 } }
      } as unknown as Job<BusinessCreationJobData>
      
      // First attempt fails
      mockCursorAIService.createProject
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          businessId: 'retry-business',
          projectPath: '/tmp/retry-project',
          repositoryUrl: 'https://github.com/sophia-ai/retry-business',
          deploymentUrl: 'https://retry-business.vercel.app'
        })
      
      // First call should fail
      const firstResult = await BusinessProcessor.processBusinessCreation(mockJob)
      expect(firstResult.success).toBe(false)
      
      // Simulate retry with incremented attempt count
      mockJob.attemptsMade = 1
      
      // Second call should succeed
      const secondResult = await BusinessProcessor.processBusinessCreation(mockJob)
      expect(secondResult.success).toBe(true)
      expect(secondResult.metadata?.retryCount).toBe(1)
    })
  })
  
  describe('Real-time Progress Tracking', () => {
    test('should emit progress updates at each stage', async () => {
      const jobData: BusinessCreationJobData = {
        businessIdea: 'Progress tracking test',
        userId: 'test-user-progress'
      }
      
      const mockJob = {
        id: 'progress-job',
        data: jobData,
        progress: jest.fn(),
        attemptsMade: 0,
        opts: { attempts: 3 }
      } as unknown as Job<BusinessCreationJobData>
      
      await BusinessProcessor.processBusinessCreation(mockJob)
      
      // Verify progress updates were emitted in correct order
      const progressCalls = mockWebSocketService.emitProgressUpdate.mock.calls
      
      expect(progressCalls).toEqual(
        expect.arrayContaining([
          [expect.objectContaining({ message: 'Iniciowanie procesu tworzenia biznesu...', progress: 5 })],
          [expect.objectContaining({ message: 'Tworzenie rekordu biznesu...', progress: 30 })],
          [expect.objectContaining({ message: 'Generowanie planu biznesowego...', progress: 45 })],
          [expect.objectContaining({ message: 'Inicjowanie projektu Cursor AI...', progress: 65 })],
          [expect.objectContaining({ message: 'Biznes został pomyślnie utworzony!', progress: 100 })]
        ])
      )
    })
  })
})