import express from 'express'
import { Request, Response } from 'express'
import { logger } from '../index'
import { JobManager } from './manager'
import { queues, getAllQueueStats, getJob } from './queue'
import { JobScheduler } from './scheduler'
import { authMiddleware } from '../middlewares/auth.middleware'

// Job dashboard routes for monitoring and management
export const jobDashboardRoutes = express.Router()

// Middleware for admin access (extends auth to check admin role)
const adminAuthMiddleware = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    // First run normal auth
    await authMiddleware(req, res, (err: any) => {
      if (err) {
        return next(err)
      }
      
      // Check if user has admin role
      const user = (req as any).user
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        })
      }
      
      next()
    })
  } catch (error) {
    logger.error('Admin auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

// Apply admin auth to all dashboard routes
jobDashboardRoutes.use(adminAuthMiddleware)

// Dashboard overview endpoint
jobDashboardRoutes.get('/overview', async (req: Request, res: Response) => {
  try {
    const stats = await JobManager.getSystemStats()
    const health = await JobManager.healthCheck()
    
    res.json({
      success: true,
      data: {
        ...stats,
        health: health.status,
        healthDetails: health.details
      }
    })
  } catch (error) {
    logger.error('Dashboard overview error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview',
      error: error.message
    })
  }
})

// Queue statistics endpoint
jobDashboardRoutes.get('/queues', async (req: Request, res: Response) => {
  try {
    const queueStats = await getAllQueueStats()
    
    // Add additional queue information
    const detailedStats = await Promise.all(
      Object.keys(queues).map(async (queueName) => {
        const queue = queues[queueName]
        const stats = queueStats[queueName]
        
        // Get recent jobs
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaiting(0, 5),
          queue.getActive(0, 5),
          queue.getCompleted(0, 5),
          queue.getFailed(0, 5)
        ])
        
        return {
          name: queueName,
          stats,
          recentJobs: {
            waiting: waiting.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              createdAt: job.timestamp
            })),
            active: active.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress(),
              createdAt: job.timestamp
            })),
            completed: completed.map(job => ({
              id: job.id,
              name: job.name,
              completedAt: job.finishedOn,
              result: job.returnvalue
            })),
            failed: failed.map(job => ({
              id: job.id,
              name: job.name,
              error: job.failedReason,
              failedAt: job.finishedOn
            }))
          }
        }
      })
    )
    
    res.json({
      success: true,
      data: detailedStats
    })
  } catch (error) {
    logger.error('Queue stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get queue statistics',
      error: error.message
    })
  }
})

// Specific queue details endpoint
jobDashboardRoutes.get('/queues/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params
    const queue = queues[queueName]
    
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue '${queueName}' not found`
      })
    }
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(0, 20),
      queue.getActive(0, 20),
      queue.getCompleted(0, 20),
      queue.getFailed(0, 20),
      queue.getDelayed(0, 20)
    ])
    
    res.json({
      success: true,
      data: {
        name: queueName,
        jobs: {
          waiting: waiting.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            opts: job.opts,
            createdAt: job.timestamp
          })),
          active: active.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            progress: job.progress(),
            processedOn: job.processedOn,
            createdAt: job.timestamp
          })),
          completed: completed.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            result: job.returnvalue,
            completedAt: job.finishedOn,
            duration: job.finishedOn ? job.finishedOn - job.processedOn : null
          })),
          failed: failed.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            error: job.failedReason,
            stackTrace: job.stacktrace,
            failedAt: job.finishedOn,
            attempts: job.attemptsMade
          })),
          delayed: delayed.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            delay: job.opts.delay,
            createdAt: job.timestamp
          }))
        }
      }
    })
  } catch (error) {
    logger.error(`Queue ${req.params.queueName} details error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to get queue '${req.params.queueName}' details`,
      error: error.message
    })
  }
})

// Job details endpoint
jobDashboardRoutes.get('/jobs/:queueName/:jobId', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params
    const job = await getJob(queueName, jobId)
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job '${jobId}' not found in queue '${queueName}'`
      })
    }
    
    res.json({
      success: true,
      data: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: await job.progress(),
        state: await job.getState(),
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace
      }
    })
  } catch (error) {
    logger.error(`Job ${req.params.jobId} details error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to get job '${req.params.jobId}' details`,
      error: error.message
    })
  }
})

// Scheduled jobs endpoint
jobDashboardRoutes.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const scheduledJobs = JobScheduler.getScheduledJobs()
    
    res.json({
      success: true,
      data: {
        total: scheduledJobs.length,
        jobs: scheduledJobs.map(jobName => ({
          name: jobName,
          // TODO: Add more details like next run time, frequency, etc.
          status: 'active'
        }))
      }
    })
  } catch (error) {
    logger.error('Scheduled jobs error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled jobs',
      error: error.message
    })
  }
})

// System health endpoint
jobDashboardRoutes.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await JobManager.healthCheck()
    
    res.json({
      success: true,
      data: health
    })
  } catch (error) {
    logger.error('Health check error:', error)
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    })
  }
})

// Job management endpoints

// Retry a failed job
jobDashboardRoutes.post('/jobs/:queueName/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params
    const job = await getJob(queueName, jobId)
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job '${jobId}' not found in queue '${queueName}'`
      })
    }
    
    await job.retry()
    logger.info(`Job ${jobId} in queue ${queueName} retried by admin`)
    
    res.json({
      success: true,
      message: 'Job retried successfully'
    })
  } catch (error) {
    logger.error(`Job retry error for ${req.params.jobId}:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to retry job',
      error: error.message
    })
  }
})

// Remove a job
jobDashboardRoutes.delete('/jobs/:queueName/:jobId', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params
    const job = await getJob(queueName, jobId)
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job '${jobId}' not found in queue '${queueName}'`
      })
    }
    
    await job.remove()
    logger.info(`Job ${jobId} in queue ${queueName} removed by admin`)
    
    res.json({
      success: true,
      message: 'Job removed successfully'
    })
  } catch (error) {
    logger.error(`Job removal error for ${req.params.jobId}:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove job',
      error: error.message
    })
  }
})

// Pause a queue
jobDashboardRoutes.post('/queues/:queueName/pause', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params
    const queue = queues[queueName]
    
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue '${queueName}' not found`
      })
    }
    
    await queue.pause()
    logger.info(`Queue ${queueName} paused by admin`)
    
    res.json({
      success: true,
      message: 'Queue paused successfully'
    })
  } catch (error) {
    logger.error(`Queue pause error for ${req.params.queueName}:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to pause queue',
      error: error.message
    })
  }
})

// Resume a queue
jobDashboardRoutes.post('/queues/:queueName/resume', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params
    const queue = queues[queueName]
    
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue '${queueName}' not found`
      })
    }
    
    await queue.resume()
    logger.info(`Queue ${queueName} resumed by admin`)
    
    res.json({
      success: true,
      message: 'Queue resumed successfully'
    })
  } catch (error) {
    logger.error(`Queue resume error for ${req.params.queueName}:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to resume queue',
      error: error.message
    })
  }
})

// Clean a queue (remove completed/failed jobs)
jobDashboardRoutes.post('/queues/:queueName/clean', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params
    const { type = 'completed', age = 24 * 60 * 60 * 1000 } = req.body // Default: completed jobs older than 24h
    const queue = queues[queueName]
    
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: `Queue '${queueName}' not found`
      })
    }
    
    const cleanedCount = await queue.clean(age, type)
    logger.info(`Queue ${queueName} cleaned: ${cleanedCount} ${type} jobs removed`)
    
    res.json({
      success: true,
      message: `Cleaned ${cleanedCount} ${type} jobs from queue`,
      data: { cleanedCount, type, age }
    })
  } catch (error) {
    logger.error(`Queue clean error for ${req.params.queueName}:`, error)
    res.status(500).json({
      success: false,
      message: 'Failed to clean queue',
      error: error.message
    })
  }
})

// Export dashboard routes
export default jobDashboardRoutes