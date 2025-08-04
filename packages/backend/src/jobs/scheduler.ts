import * as cron from 'node-cron'
import { logger } from '../index'
import { addJob } from './queue'
import { 
  JobType, 
  JobPriority,
  BusinessCreationJobData,
  MarketingCampaignJobData,
  AnalyticsJobData,
  PaymentJobData,
  AIJobData 
} from './types'

// Cron job scheduler for recurring tasks
export class JobScheduler {
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map()
  
  // Initialize all scheduled jobs
  static async initialize(): Promise<void> {
    try {
      logger.info('🕐 Initializing job scheduler...')
      
      // Schedule system maintenance jobs
      this.scheduleSystemJobs()
      
      // Schedule analytics collection jobs
      this.scheduleAnalyticsJobs()
      
      // Schedule marketing automation jobs
      this.scheduleMarketingJobs()
      
      // Schedule payment jobs
      this.schedulePaymentJobs()
      
      // Schedule health checks
      this.scheduleHealthChecks()
      
      logger.info('✅ Job scheduler initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize job scheduler:', error)
      throw error
    }
  }
  
  // Schedule system maintenance jobs
  private static scheduleSystemJobs(): void {
    // Daily system cleanup at 2 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('🧹 Running scheduled system cleanup')
        await addJob(JobType.SYSTEM_CLEANUP, {
          id: `cleanup_${Date.now()}`,
          priority: JobPriority.LOW,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule system cleanup job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    // Weekly system backup on Sundays at 3 AM
    const backupJob = cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('💾 Running scheduled system backup')
        await addJob(JobType.SYSTEM_BACKUP, {
          id: `backup_${Date.now()}`,
          priority: JobPriority.HIGH,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule system backup job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('system-cleanup', cleanupJob)
    this.scheduledJobs.set('system-backup', backupJob)
    
    // Start the jobs
    cleanupJob.start()
    backupJob.start()
    
    logger.info('✅ System jobs scheduled')
  }
  
  // Schedule analytics collection jobs
  private static scheduleAnalyticsJobs(): void {
    // Daily analytics collection at 1 AM
    const analyticsJob = cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('📊 Running scheduled analytics collection')
        
        // Get all active businesses and collect analytics for each
        const { BusinessService } = await import('../services/business.service')
        const activeBusinesses = await BusinessService.getActiveBusinesses()
        
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const today = new Date()
        
        // Schedule analytics collection for each active business
        for (const business of activeBusinesses) {
          if (business.analyticsPropertyId) {
            const analyticsData: AnalyticsJobData = {
              id: `analytics_${business.id}_${Date.now()}`,
              businessId: business.id,
              dataSource: 'google_analytics',
              dateRange: {
                from: yesterday.toISOString().split('T')[0], // YYYY-MM-DD format
                to: today.toISOString().split('T')[0]
              },
              metrics: ['activeUsers', 'pageViews', 'conversions', 'totalRevenue', 'bounceRate', 'sessionDuration'],
              reportType: 'daily',
              priority: JobPriority.NORMAL,
              timestamp: new Date()
            }
            
            await addJob(JobType.ANALYTICS_COLLECT, analyticsData)
            logger.info(`Scheduled analytics collection for business: ${business.name} (${business.id})`)
          }
        }
      } catch (error) {
        logger.error('Failed to schedule analytics collection job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    // Weekly analytics report on Mondays at 9 AM
    const reportJob = cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('📋 Running scheduled analytics report')
        
        // Get all active businesses and generate reports for each
        const { BusinessService } = await import('../services/business.service')
        const activeBusinesses = await BusinessService.getActiveBusinesses()
        
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const today = new Date()
        
        // Schedule weekly reports for each active business
        for (const business of activeBusinesses) {
          if (business.analyticsPropertyId) {
            const reportData: AnalyticsJobData = {
              id: `report_${business.id}_${Date.now()}`,
              businessId: business.id,
              dataSource: 'google_analytics',
              dateRange: {
                from: weekAgo.toISOString().split('T')[0], // YYYY-MM-DD format
                to: today.toISOString().split('T')[0]
              },
              metrics: ['activeUsers', 'pageViews', 'conversions', 'totalRevenue', 'bounceRate', 'sessionDuration'],
              reportType: 'weekly',
              priority: JobPriority.NORMAL,
              timestamp: new Date()
            }
            
            await addJob(JobType.ANALYTICS_REPORT, reportData)
            logger.info(`Scheduled weekly analytics report for business: ${business.name} (${business.id})`)
          }
        }
      } catch (error) {
        logger.error('Failed to schedule analytics report job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('analytics-collection', analyticsJob)
    this.scheduledJobs.set('analytics-report', reportJob)
    
    analyticsJob.start()
    reportJob.start()
    
    logger.info('✅ Analytics jobs scheduled')
  }
  
  // Schedule marketing automation jobs
  private static scheduleMarketingJobs(): void {
    // Daily marketing campaign monitoring at 10 AM
    const monitoringJob = cron.schedule('0 10 * * *', async () => {
      try {
        logger.info('📈 Running scheduled marketing campaign monitoring')
        
        // TODO: Get all active campaigns and monitor each
        await addJob(JobType.MARKETING_CAMPAIGN_MONITOR, {
          id: `monitoring_${Date.now()}`,
          priority: JobPriority.HIGH,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule marketing monitoring job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    // Bi-weekly campaign optimization on Tuesdays and Fridays at 2 PM
    const optimizationJob = cron.schedule('0 14 * * 2,5', async () => {
      try {
        logger.info('🎯 Running scheduled campaign optimization')
        
        await addJob(JobType.MARKETING_CAMPAIGN_OPTIMIZE, {
          id: `optimization_${Date.now()}`,
          priority: JobPriority.HIGH,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule campaign optimization job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('marketing-monitoring', monitoringJob)
    this.scheduledJobs.set('marketing-optimization', optimizationJob)
    
    monitoringJob.start()
    optimizationJob.start()
    
    logger.info('✅ Marketing jobs scheduled')
  }
  
  // Schedule payment jobs
  private static schedulePaymentJobs(): void {
    // Daily payment retry for failed payments at 6 AM
    const retryJob = cron.schedule('0 6 * * *', async () => {
      try {
        logger.info('💳 Running scheduled payment retry')
        
        // TODO: Get failed payments and retry them
        await addJob(JobType.PAYMENT_RETRY, {
          id: `retry_${Date.now()}`,
          paymentIntentId: 'batch_retry',
          amount: 0,
          currency: 'usd',
          customerId: 'system',
          priority: JobPriority.HIGH,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule payment retry job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('payment-retry', retryJob)
    retryJob.start()
    
    logger.info('✅ Payment jobs scheduled')
  }
  
  // Schedule health checks
  private static scheduleHealthChecks(): void {
    // System health check every 30 minutes
    const healthCheckJob = cron.schedule('*/30 * * * *', async () => {
      try {
        logger.debug('🏥 Running scheduled health check')
        
        await addJob(JobType.SYSTEM_HEALTH_CHECK, {
          id: `health_${Date.now()}`,
          priority: JobPriority.LOW,
          timestamp: new Date()
        })
      } catch (error) {
        logger.error('Failed to schedule health check job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('health-check', healthCheckJob)
    healthCheckJob.start()
    
    logger.info('✅ Health check jobs scheduled')
  }
  
  // Schedule AI optimization jobs
  static scheduleAIOptimization(): void {
    // Weekly AI optimization on Sundays at 6 AM
    const aiOptimizationJob = cron.schedule('0 6 * * 0', async () => {
      try {
        logger.info('🤖 Running scheduled AI optimization')
        
        const aiData: AIJobData = {
          id: `ai_optimization_${Date.now()}`,
          taskType: 'optimization',
          context: {
            type: 'system_optimization',
            scope: 'all_businesses',
            timeframe: 'weekly'
          },
          priority: JobPriority.NORMAL,
          timestamp: new Date()
        }
        
        await addJob(JobType.AI_OPTIMIZATION, aiData)
      } catch (error) {
        logger.error('Failed to schedule AI optimization job:', error)
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })
    
    this.scheduledJobs.set('ai-optimization', aiOptimizationJob)
    aiOptimizationJob.start()
    
    logger.info('✅ AI optimization jobs scheduled')
  }
  
  // Add a custom scheduled job
  static addScheduledJob(
    name: string, 
    cronExpression: string, 
    jobType: JobType, 
    jobData: any,
    options: { timezone?: string; scheduled?: boolean } = {}
  ): void {
    try {
      const task = cron.schedule(cronExpression, async () => {
        try {
          logger.info(`🔄 Running custom scheduled job: ${name}`)
          await addJob(jobType, {
            ...jobData,
            id: `${name}_${Date.now()}`,
            timestamp: new Date()
          })
        } catch (error) {
          logger.error(`Failed to run scheduled job ${name}:`, error)
        }
      }, {
        scheduled: options.scheduled !== false,
        timezone: options.timezone || 'UTC'
      })
      
      this.scheduledJobs.set(name, task)
      
      if (options.scheduled !== false) {
        task.start()
      }
      
      logger.info(`✅ Custom job '${name}' scheduled with expression: ${cronExpression}`)
    } catch (error) {
      logger.error(`Failed to schedule custom job '${name}':`, error)
      throw error
    }
  }
  
  // Remove a scheduled job
  static removeScheduledJob(name: string): boolean {
    const task = this.scheduledJobs.get(name)
    if (task) {
      task.stop()
      task.destroy()
      this.scheduledJobs.delete(name)
      logger.info(`🗑️ Scheduled job '${name}' removed`)
      return true
    }
    
    logger.warn(`Scheduled job '${name}' not found`)
    return false
  }
  
  // Get all scheduled jobs
  static getScheduledJobs(): string[] {
    return Array.from(this.scheduledJobs.keys())
  }
  
  // Start a specific job
  static startJob(name: string): boolean {
    const task = this.scheduledJobs.get(name)
    if (task) {
      task.start()
      logger.info(`▶️ Scheduled job '${name}' started`)
      return true
    }
    
    logger.warn(`Scheduled job '${name}' not found`)
    return false
  }
  
  // Stop a specific job
  static stopJob(name: string): boolean {
    const task = this.scheduledJobs.get(name)
    if (task) {
      task.stop()
      logger.info(`⏸️ Scheduled job '${name}' stopped`)
      return true
    }
    
    logger.warn(`Scheduled job '${name}' not found`)
    return false
  }
  
  // Graceful shutdown
  static async shutdown(): Promise<void> {
    logger.info('👋 Shutting down job scheduler...')
    
    for (const [name, task] of this.scheduledJobs) {
      try {
        task.stop()
        task.destroy()
        logger.info(`Stopped scheduled job: ${name}`)
      } catch (error) {
        logger.error(`Error stopping job ${name}:`, error)
      }
    }
    
    this.scheduledJobs.clear()
    logger.info('✅ Job scheduler shut down completed')
  }
}