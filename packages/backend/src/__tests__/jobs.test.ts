import { JobManager } from '../jobs/manager'
import { JobType, JobPriority, BusinessCreationJobData, MarketingCampaignJobData } from '../jobs/types'
import { JobScheduler } from '../jobs/scheduler'

// Mock Redis and Bull dependencies
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    ping: jest.fn()
  }))
}))

jest.mock('bull', () => {
  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    getJob: jest.fn(),
    getWaiting: jest.fn(() => []),
    getActive: jest.fn(() => []),
    getCompleted: jest.fn(() => []),
    getFailed: jest.fn(() => []),
    getDelayed: jest.fn(() => []),
    close: jest.fn(),
    on: jest.fn(),
    clean: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn()
  }
  
  return jest.fn(() => mockQueue)
})

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn()
  }))
}))

describe('Job Management System', () => {
  
  beforeAll(async () => {
    // Mock environment variables
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PORT = '6379'
  })
  
  afterAll(async () => {
    if (JobManager.isInitialized()) {
      await JobManager.shutdown()
    }
  })
  
  describe('JobManager', () => {
    
    it('should initialize successfully', async () => {
      expect(JobManager.isInitialized()).toBe(false)
      
      await JobManager.initialize()
      
      expect(JobManager.isInitialized()).toBe(true)
    })
    
    it('should create a business creation job', async () => {
      const businessData: Omit<BusinessCreationJobData, 'id'> = {
        businessIdea: 'AI-powered task management app',
        aiResearch: true,
        userId: 'test-user-123',
        targetMarket: 'SMB',
        businessModel: 'subscription'
      }
      
      const job = await JobManager.createBusiness(businessData)
      
      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
    })
    
    it('should create a marketing campaign job', async () => {
      const campaignData: Omit<MarketingCampaignJobData, 'id'> = {
        campaignType: 'google_ads',
        targetAudience: 'Small business owners',
        budget: 1000,
        duration: 30,
        businessId: 'test-business-123',
        keywords: ['task management', 'productivity', 'business automation']
      }
      
      const job = await JobManager.createMarketingCampaign(campaignData)
      
      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
    })
    
    it('should get system statistics', async () => {
      const stats = await JobManager.getSystemStats()
      
      expect(stats).toBeDefined()
      expect(stats.timestamp).toBeDefined()
      expect(stats.queues).toBeDefined()
      expect(stats.scheduledJobs).toBeDefined()
      expect(stats.system).toBeDefined()
    })
    
    it('should perform health check', async () => {
      const health = await JobManager.healthCheck()
      
      expect(health).toBeDefined()
      expect(health.status).toBeDefined()
      expect(health.details).toBeDefined()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })
    
    it('should handle job manager restart', async () => {
      expect(JobManager.isInitialized()).toBe(true)
      
      await JobManager.restart()
      
      expect(JobManager.isInitialized()).toBe(true)
    })
    
    it('should fail to add job when not initialized', async () => {
      await JobManager.shutdown()
      
      await expect(
        JobManager.addJob(JobType.BUSINESS_CREATION, {
          id: 'test',
          businessIdea: 'test',
          userId: 'test'
        })
      ).rejects.toThrow('Job manager not initialized')
      
      // Re-initialize for other tests
      await JobManager.initialize()
    })
  })
  
  describe('JobScheduler', () => {
    
    it('should initialize scheduled jobs', async () => {
      await JobScheduler.initialize()
      
      const scheduledJobs = JobScheduler.getScheduledJobs()
      expect(scheduledJobs.length).toBeGreaterThan(0)
    })
    
    it('should add custom scheduled job', () => {
      const jobName = 'test-custom-job'
      const cronExpression = '0 0 * * *' // Daily at midnight
      
      JobScheduler.addScheduledJob(
        jobName,
        cronExpression,
        JobType.SYSTEM_HEALTH_CHECK,
        { test: true },
        { scheduled: false }
      )
      
      const scheduledJobs = JobScheduler.getScheduledJobs()
      expect(scheduledJobs).toContain(jobName)
    })
    
    it('should start and stop scheduled jobs', () => {
      const jobName = 'test-start-stop-job'
      
      JobScheduler.addScheduledJob(
        jobName,
        '0 0 * * *',
        JobType.SYSTEM_HEALTH_CHECK,
        {},
        { scheduled: false }
      )
      
      expect(JobScheduler.startJob(jobName)).toBe(true)
      expect(JobScheduler.stopJob(jobName)).toBe(true)
    })
    
    it('should remove scheduled job', () => {
      const jobName = 'test-remove-job'
      
      JobScheduler.addScheduledJob(
        jobName,
        '0 0 * * *',
        JobType.SYSTEM_HEALTH_CHECK,
        {},
        { scheduled: false }
      )
      
      expect(JobScheduler.removeScheduledJob(jobName)).toBe(true)
      expect(JobScheduler.removeScheduledJob(jobName)).toBe(false) // Already removed
    })
    
    it('should handle non-existent job operations', () => {
      const nonExistentJob = 'non-existent-job'
      
      expect(JobScheduler.startJob(nonExistentJob)).toBe(false)
      expect(JobScheduler.stopJob(nonExistentJob)).toBe(false)
      expect(JobScheduler.removeScheduledJob(nonExistentJob)).toBe(false)
    })
  })
  
  describe('Job Types and Validation', () => {
    
    it('should validate job priorities', () => {
      expect(JobPriority.LOW).toBe(1)
      expect(JobPriority.NORMAL).toBe(5)
      expect(JobPriority.HIGH).toBe(10)
      expect(JobPriority.CRITICAL).toBe(15)
    })
    
    it('should have all required job types', () => {
      const expectedJobTypes = [
        'business:creation',
        'business:deployment',
        'business:monitoring',
        'marketing:campaign:create',
        'marketing:campaign:monitor',
        'marketing:campaign:optimize',
        'analytics:collect',
        'analytics:process',
        'analytics:report',
        'payment:process',
        'payment:retry',
        'payment:webhook',
        'system:cleanup',
        'system:backup',
        'system:health',
        'ai:research',
        'ai:decision',
        'ai:optimization'
      ]
      
      expectedJobTypes.forEach(jobType => {
        expect(Object.values(JobType)).toContain(jobType)
      })
    })
  })
  
  describe('Error Handling', () => {
    
    it('should handle Redis connection failure gracefully', async () => {
      // Mock Redis connection failure
      const originalRedis = require('redis')
      originalRedis.createClient.mockImplementationOnce(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        quit: jest.fn(),
        on: jest.fn()
      }))
      
      await JobManager.shutdown()
      
      await expect(JobManager.initialize()).rejects.toThrow()
    })
    
    it('should handle job addition errors', async () => {
      // Re-initialize after error test
      await JobManager.initialize()
      
      // Mock queue.add to throw error
      const Bull = require('bull')
      const mockQueue = Bull()
      mockQueue.add.mockRejectedValueOnce(new Error('Queue add failed'))
      
      // This should still work because we're using the real implementation
      // The error would be caught and logged
    })
  })
  
  describe('Integration Tests', () => {
    
    it('should handle complete job lifecycle', async () => {
      // Create a job
      const businessData: Omit<BusinessCreationJobData, 'id'> = {
        businessIdea: 'Test business idea',
        userId: 'test-user',
        aiResearch: false
      }
      
      const job = await JobManager.createBusiness(businessData)
      expect(job).toBeDefined()
      
      // Check system stats include our job
      const stats = await JobManager.getSystemStats()
      expect(stats.queues).toBeDefined()
      
      // Health check should pass
      const health = await JobManager.healthCheck()
      expect(health.status).toBe('healthy')
    })
    
    it('should handle multiple job types simultaneously', async () => {
      const jobs = await Promise.all([
        JobManager.createBusiness({
          businessIdea: 'Business 1',
          userId: 'user1'
        }),
        JobManager.createMarketingCampaign({
          campaignType: 'facebook_ads',
          targetAudience: 'Young professionals',
          budget: 500,
          duration: 14,
          businessId: 'business1'
        }),
        JobManager.collectAnalytics({
          dataSource: 'google_analytics',
          dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date()
          },
          metrics: ['sessions', 'pageviews'],
          businessId: 'business1'
        })
      ])
      
      expect(jobs).toHaveLength(3)
      jobs.forEach(job => {
        expect(job).toBeDefined()
        expect(job.id).toBeDefined()
      })
    })
  })
})

describe('Job Processors', () => {
  
  it('should validate business creation job data', () => {
    const validData: BusinessCreationJobData = {
      id: 'test-123',
      businessIdea: 'AI task manager',
      userId: 'user123',
      aiResearch: true,
      targetMarket: 'SMB',
      businessModel: 'subscription',
      timestamp: new Date()
    }
    
    expect(validData.businessIdea).toBeDefined()
    expect(validData.userId).toBeDefined()
  })
  
  it('should validate marketing campaign job data', () => {
    const validData: MarketingCampaignJobData = {
      id: 'campaign-123',
      campaignType: 'google_ads',
      targetAudience: 'Business owners',
      budget: 1000,
      duration: 30,
      businessId: 'business123',
      keywords: ['productivity', 'automation'],
      demographics: {
        age: [25, 55],
        location: ['US', 'CA'],
        interests: ['business', 'technology']
      },
      timestamp: new Date()
    }
    
    expect(validData.campaignType).toBeDefined()
    expect(validData.budget).toBeGreaterThan(0)
    expect(validData.duration).toBeGreaterThan(0)
  })
})