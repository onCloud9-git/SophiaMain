import { Job } from 'bull'
import { logger } from '../index'
import { initializeQueues, closeQueues, queues, addJob, getJob, getAllQueueStats } from './queue'
import { initializeRedis, closeRedisConnections } from '../lib/redis'
import { JobScheduler } from './scheduler'
import { 
  BusinessProcessor,
  MarketingProcessor,
  AnalyticsProcessor,
  PaymentProcessor,
  SystemProcessor,
  AIProcessor
} from './processors'
import { 
  JobType, 
  JobResult,
  BusinessCreationJobData,
  MarketingCampaignJobData,
  AnalyticsJobData,
  PaymentJobData,
  AIJobData
} from './types'

// Main job manager class
export class JobManager {
  private static initialized = false
  
  // Initialize the job system
  static async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        logger.warn('Job manager already initialized')
        return
      }
      
      logger.info('🚀 Initializing job management system...')
      
      // Step 1: Initialize Redis connections
      await initializeRedis()
      
      // Step 2: Initialize job queues
      await initializeQueues()
      
      // Step 3: Setup job processors
      this.setupJobProcessors()
      
      // Step 4: Initialize job scheduler
      await JobScheduler.initialize()
      
      this.initialized = true
      logger.info('✅ Job management system initialized successfully')
      
    } catch (error) {
      logger.error('Failed to initialize job management system:', error)
      throw error
    }
  }
  
  // Setup job processors for each queue
  private static setupJobProcessors(): void {
    logger.info('🔧 Setting up job processors...')
    
    // Business queue processors
    if (queues['business-queue']) {
      queues['business-queue'].process(JobType.BUSINESS_CREATION, 1, async (job: Job<BusinessCreationJobData>) => {
        return await BusinessProcessor.processBusinessCreation(job)
      })
      
      queues['business-queue'].process(JobType.BUSINESS_DEPLOYMENT, 1, async (job: Job) => {
        return await BusinessProcessor.processBusinessDeployment(job)
      })
      
      queues['business-queue'].process(JobType.BUSINESS_MONITORING, 2, async (job: Job) => {
        return await BusinessProcessor.processBusinessMonitoring(job)
      })
      
      queues['business-queue'].process(JobType.DEVELOPMENT_MONITORING, 3, async (job: Job<{businessId: string}>) => {
        return await BusinessProcessor.processDevelopmentMonitoring(job)
      })
    }
    
    // Marketing queue processors
    if (queues['marketing-queue']) {
      queues['marketing-queue'].process(JobType.MARKETING_CAMPAIGN_CREATE, 3, async (job: Job<MarketingCampaignJobData>) => {
        return await MarketingProcessor.processCampaignCreation(job)
      })
      
      queues['marketing-queue'].process(JobType.MARKETING_CAMPAIGN_MONITOR, 5, async (job: Job) => {
        return await MarketingProcessor.processCampaignMonitoring(job)
      })
      
      queues['marketing-queue'].process(JobType.MARKETING_CAMPAIGN_OPTIMIZE, 2, async (job: Job) => {
        return await MarketingProcessor.processCampaignOptimization(job)
      })
    }
    
    // Analytics queue processors
    if (queues['analytics-queue']) {
      queues['analytics-queue'].process(JobType.ANALYTICS_COLLECT, 2, async (job: Job<AnalyticsJobData>) => {
        return await AnalyticsProcessor.processAnalyticsCollection(job)
      })
      
      queues['analytics-queue'].process(JobType.ANALYTICS_PROCESS, 1, async (job: Job<AnalyticsJobData>) => {
        return await AnalyticsProcessor.processAnalyticsProcessing(job)
      })
      
      queues['analytics-queue'].process(JobType.ANALYTICS_REPORT, 1, async (job: Job<AnalyticsJobData>) => {
        return await AnalyticsProcessor.processAnalyticsReporting(job)
      })
    }
    
    // Payment queue processors
    if (queues['payment-queue']) {
      queues['payment-queue'].process(JobType.PAYMENT_PROCESS, 5, async (job: Job<PaymentJobData>) => {
        return await PaymentProcessor.processPayment(job)
      })
      
      queues['payment-queue'].process(JobType.PAYMENT_RETRY, 3, async (job: Job<PaymentJobData>) => {
        return await PaymentProcessor.processPaymentRetry(job)
      })
      
      queues['payment-queue'].process(JobType.PAYMENT_WEBHOOK, 10, async (job: Job) => {
        return await PaymentProcessor.processPaymentWebhook(job)
      })
    }
    
    // System queue processors
    if (queues['system-queue']) {
      queues['system-queue'].process(JobType.SYSTEM_CLEANUP, 1, async (job: Job) => {
        return await SystemProcessor.processSystemCleanup(job)
      })
      
      queues['system-queue'].process(JobType.SYSTEM_BACKUP, 1, async (job: Job) => {
        return await SystemProcessor.processSystemBackup(job)
      })
      
      queues['system-queue'].process(JobType.SYSTEM_HEALTH_CHECK, 1, async (job: Job) => {
        return await SystemProcessor.processSystemHealthCheck(job)
      })
    }
    
    // AI queue processors
    if (queues['ai-queue']) {
      queues['ai-queue'].process(JobType.AI_RESEARCH, 1, async (job: Job<AIJobData>) => {
        return await AIProcessor.processAIResearch(job)
      })
      
      queues['ai-queue'].process(JobType.AI_DECISION, 1, async (job: Job<AIJobData>) => {
        return await AIProcessor.processAIDecision(job)
      })
      
      queues['ai-queue'].process(JobType.AI_OPTIMIZATION, 1, async (job: Job<AIJobData>) => {
        return await AIProcessor.processAIOptimization(job)
      })
      
      queues['ai-queue'].process('ai:generation', 2, async (job: Job<AIJobData>) => {
        return await AIProcessor.processAIGeneration(job)
      })
    }
    
    logger.info('✅ Job processors setup completed')
  }
  
  // Add a job to the appropriate queue
  static async addJob<T>(jobType: JobType, data: T, options?: any): Promise<Job<T>> {
    this.ensureInitialized()
    
    try {
      const job = await addJob(jobType, data, options)
      logger.info(`Job ${job.id} added to queue`, { jobType, data })
      return job
    } catch (error) {
      logger.error(`Failed to add job of type ${jobType}:`, error)
      throw error
    }
  }
  
  // Get job by ID and queue name
  static async getJob(queueName: string, jobId: string): Promise<Job | null> {
    this.ensureInitialized()
    
    try {
      return await getJob(queueName, jobId)
    } catch (error) {
      logger.error(`Failed to get job ${jobId} from queue ${queueName}:`, error)
      throw error
    }
  }
  
  // Get comprehensive job system statistics
  static async getSystemStats(): Promise<any> {
    this.ensureInitialized()
    
    try {
      const queueStats = await getAllQueueStats()
      const scheduledJobs = JobScheduler.getScheduledJobs()
      
      return {
        timestamp: new Date().toISOString(),
        queues: queueStats,
        scheduledJobs: {
          total: scheduledJobs.length,
          jobs: scheduledJobs
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    } catch (error) {
      logger.error('Failed to get system stats:', error)
      throw error
    }
  }
  
  // Create a business creation job
  static async createBusiness(data: Omit<BusinessCreationJobData, 'id'>): Promise<Job<BusinessCreationJobData>> {
    const jobData: BusinessCreationJobData = {
      ...data,
      id: `business_${Date.now()}`,
      timestamp: new Date()
    }
    
    return await this.addJob(JobType.BUSINESS_CREATION, jobData, {
      priority: 10,
      attempts: 3
    })
  }
  
  // Create a marketing campaign job
  static async createMarketingCampaign(data: Omit<MarketingCampaignJobData, 'id'>): Promise<Job<MarketingCampaignJobData>> {
    const jobData: MarketingCampaignJobData = {
      ...data,
      id: `campaign_${Date.now()}`,
      timestamp: new Date()
    }
    
    return await this.addJob(JobType.MARKETING_CAMPAIGN_CREATE, jobData, {
      priority: 8,
      attempts: 5
    })
  }
  
  // Create an analytics job
  static async collectAnalytics(data: Omit<AnalyticsJobData, 'id'>): Promise<Job<AnalyticsJobData>> {
    const jobData: AnalyticsJobData = {
      ...data,
      id: `analytics_${Date.now()}`,
      timestamp: new Date()
    }
    
    return await this.addJob(JobType.ANALYTICS_COLLECT, jobData, {
      priority: 5,
      attempts: 3
    })
  }
  
  // Create a payment job
  static async processPayment(data: Omit<PaymentJobData, 'id'>): Promise<Job<PaymentJobData>> {
    const jobData: PaymentJobData = {
      ...data,
      id: `payment_${Date.now()}`,
      timestamp: new Date()
    }
    
    return await this.addJob(JobType.PAYMENT_PROCESS, jobData, {
      priority: 15,
      attempts: 5
    })
  }
  
  // Create an AI job
  static async runAITask(data: Omit<AIJobData, 'id'>): Promise<Job<AIJobData>> {
    const jobData: AIJobData = {
      ...data,
      id: `ai_${Date.now()}`,
      timestamp: new Date()
    }
    
    const jobType = data.taskType === 'research' ? JobType.AI_RESEARCH :
                   data.taskType === 'decision' ? JobType.AI_DECISION :
                   data.taskType === 'optimization' ? JobType.AI_OPTIMIZATION :
                   'ai:generation' as JobType
    
    return await this.addJob(jobType, jobData, {
      priority: 8,
      attempts: 3
    })
  }
  
  // Health check for the job system
  static async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.initialized) {
        return {
          status: 'unhealthy',
          details: { error: 'Job system not initialized' }
        }
      }
      
      const stats = await this.getSystemStats()
      
      // Check if queues are healthy
      const queueProblems = Object.entries(stats.queues).filter(([name, queueStats]: [string, any]) => {
        return queueStats.failed > 10 || queueStats.active === 0 && queueStats.waiting > 50
      })
      
      const status = queueProblems.length === 0 ? 'healthy' : 'degraded'
      
      return {
        status,
        details: {
          queues: stats.queues,
          scheduledJobs: stats.scheduledJobs,
          problems: queueProblems.map(([name]) => `Queue ${name} has issues`)
        }
      }
    } catch (error) {
      logger.error('Job system health check failed:', error)
      return {
        status: 'unhealthy',
        details: { error: error.message }
      }
    }
  }
  
  // Graceful shutdown
  static async shutdown(): Promise<void> {
    if (!this.initialized) {
      logger.warn('Job manager not initialized, skipping shutdown')
      return
    }
    
    try {
      logger.info('👋 Shutting down job management system...')
      
      // Step 1: Stop scheduler
      await JobScheduler.shutdown()
      
      // Step 2: Close queues
      await closeQueues()
      
      // Step 3: Close Redis connections
      await closeRedisConnections()
      
      this.initialized = false
      logger.info('✅ Job management system shut down completed')
      
    } catch (error) {
      logger.error('Error during job system shutdown:', error)
      throw error
    }
  }
  
  // Helper methods
  private static ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Job manager not initialized. Call JobManager.initialize() first.')
    }
  }
  
  // Get job manager status
  static isInitialized(): boolean {
    return this.initialized
  }
  
  // Restart the job system
  static async restart(): Promise<void> {
    logger.info('🔄 Restarting job management system...')
    
    if (this.initialized) {
      await this.shutdown()
    }
    
    await this.initialize()
    logger.info('✅ Job management system restarted')
  }
}