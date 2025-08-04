import Bull, { Queue, Job, JobOptions as BullJobOptions } from 'bull'
import { logger } from '../index'
import { redisClient } from '../lib/redis'
import { 
  JobType, 
  JobPriority, 
  BaseJobData, 
  JobResult, 
  JobOptions,
  QueueConfig 
} from './types'

// Queue configurations
const queueConfigs: Record<string, QueueConfig> = {
  'business-queue': {
    name: 'business-queue',
    concurrency: 3,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 50,
      removeOnFail: 50
    }
  },
  'marketing-queue': {
    name: 'marketing-queue',
    concurrency: 5,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 20
    }
  },
  'analytics-queue': {
    name: 'analytics-queue',
    concurrency: 2,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 10000
      },
      removeOnComplete: 200,
      removeOnFail: 50
    }
  },
  'payment-queue': {
    name: 'payment-queue',
    concurrency: 10,
    defaultJobOptions: {
      priority: JobPriority.HIGH,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  },
  'system-queue': {
    name: 'system-queue',
    concurrency: 1,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 30000
      },
      removeOnComplete: 10,
      removeOnFail: 10
    }
  },
  'ai-queue': {
    name: 'ai-queue',
    concurrency: 2,
    defaultJobOptions: {
      priority: JobPriority.NORMAL,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 50,
      removeOnFail: 20
    }
  }
}

// Initialize queues
export const queues: Record<string, Queue> = {}

// Create Redis connection options for Bull
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
}

// Initialize all queues
export const initializeQueues = async () => {
  try {
    logger.info('🔄 Initializing job queues...')
    
    for (const [queueKey, config] of Object.entries(queueConfigs)) {
      const queue = new Bull(config.name, {
        redis: redisOptions,
        defaultJobOptions: config.defaultJobOptions as BullJobOptions,
        settings: {
          retryProcessDelay: 5000,
          stalledInterval: 30000,
          maxStalledCount: 1,
        }
      })

      // Error handling
      queue.on('error', (error) => {
        logger.error(`Queue ${config.name} error:`, error)
      })

      queue.on('waiting', (jobId) => {
        logger.debug(`Job ${jobId} is waiting in queue ${config.name}`)
      })

      queue.on('active', (job) => {
        logger.info(`Job ${job.id} started processing in queue ${config.name}`)
      })

      queue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed in queue ${config.name}`, { result })
      })

      queue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed in queue ${config.name}:`, err)
      })

      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled in queue ${config.name}`)
      })

      queues[queueKey] = queue
    }

    logger.info('✅ Job queues initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize job queues:', error)
    throw error
  }
}

// Add job to appropriate queue
export const addJob = async <T extends BaseJobData>(
  jobType: JobType,
  data: T,
  options: JobOptions = {}
): Promise<Job<T>> => {
  const queueName = getQueueNameByJobType(jobType)
  const queue = queues[queueName]
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found for job type ${jobType}`)
  }

  // Merge options with defaults
  const jobOptions: BullJobOptions = {
    priority: options.priority || JobPriority.NORMAL,
    delay: options.delay || 0,
    attempts: options.attempts || queue.defaultJobOptions.attempts,
    backoff: options.backoff || queue.defaultJobOptions.backoff,
    removeOnComplete: options.removeOnComplete || queue.defaultJobOptions.removeOnComplete,
    removeOnFail: options.removeOnFail || queue.defaultJobOptions.removeOnFail,
    repeat: options.repeat,
  }

  try {
    const job = await queue.add(jobType, data, jobOptions)
    logger.info(`Job ${job.id} added to queue ${queueName}`, { jobType, data })
    return job
  } catch (error) {
    logger.error(`Failed to add job to queue ${queueName}:`, error)
    throw error
  }
}

// Get queue name by job type
const getQueueNameByJobType = (jobType: JobType): string => {
  if (jobType.startsWith('business:')) return 'business-queue'
  if (jobType.startsWith('marketing:')) return 'marketing-queue'
  if (jobType.startsWith('analytics:')) return 'analytics-queue'
  if (jobType.startsWith('payment:')) return 'payment-queue'
  if (jobType.startsWith('system:')) return 'system-queue'
  if (jobType.startsWith('ai:')) return 'ai-queue'
  
  throw new Error(`Unknown job type: ${jobType}`)
}

// Get job by ID
export const getJob = async (queueName: string, jobId: string): Promise<Job | null> => {
  const queue = queues[queueName]
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }
  
  return await queue.getJob(jobId)
}

// Get queue statistics
export const getQueueStats = async (queueName: string) => {
  const queue = queues[queueName]
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ])

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
    total: waiting.length + active.length + completed.length + failed.length + delayed.length
  }
}

// Get all queue statistics
export const getAllQueueStats = async () => {
  const stats: Record<string, any> = {}
  
  for (const queueName of Object.keys(queues)) {
    try {
      stats[queueName] = await getQueueStats(queueName)
    } catch (error) {
      logger.error(`Failed to get stats for queue ${queueName}:`, error)
      stats[queueName] = { error: error.message }
    }
  }
  
  return stats
}

// Clean queues (remove completed/failed jobs)
export const cleanQueues = async () => {
  logger.info('🧹 Cleaning queues...')
  
  for (const [queueName, queue] of Object.entries(queues)) {
    try {
      // Clean completed jobs older than 24 hours
      await queue.clean(24 * 60 * 60 * 1000, 'completed')
      // Clean failed jobs older than 7 days
      await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed')
      
      logger.info(`Queue ${queueName} cleaned`)
    } catch (error) {
      logger.error(`Failed to clean queue ${queueName}:`, error)
    }
  }
  
  logger.info('✅ Queue cleaning completed')
}

// Graceful shutdown
export const closeQueues = async () => {
  logger.info('👋 Closing job queues...')
  
  const closePromises = Object.entries(queues).map(async ([queueName, queue]) => {
    try {
      await queue.close()
      logger.info(`Queue ${queueName} closed`)
    } catch (error) {
      logger.error(`Error closing queue ${queueName}:`, error)
    }
  })
  
  await Promise.all(closePromises)
  logger.info('✅ All queues closed')
}