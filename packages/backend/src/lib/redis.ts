import Redis from 'redis'
import { logger } from '../index'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
}

// Create Redis client for Bull Queue
export const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || `redis://${redisConfig.host}:${redisConfig.port}`,
  password: redisConfig.password,
  database: redisConfig.db,
})

// Create Redis client for caching
export const cacheClient = Redis.createClient({
  url: process.env.REDIS_URL || `redis://${redisConfig.host}:${redisConfig.port}`,
  password: redisConfig.password,
  database: redisConfig.db + 1, // Use different database for cache
})

// Error handling
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  logger.info('✅ Redis Client connected successfully')
})

redisClient.on('ready', () => {
  logger.info('✅ Redis Client ready for operations')
})

cacheClient.on('error', (err) => {
  logger.error('Redis Cache Error:', err)
})

cacheClient.on('connect', () => {
  logger.info('✅ Redis Cache connected successfully')
})

// Initialize connections
export const initializeRedis = async () => {
  try {
    await redisClient.connect()
    await cacheClient.connect()
    logger.info('🔄 Redis connections initialized')
  } catch (error) {
    logger.error('Failed to initialize Redis connections:', error)
    throw error
  }
}

// Graceful shutdown
export const closeRedisConnections = async () => {
  try {
    await redisClient.quit()
    await cacheClient.quit()
    logger.info('👋 Redis connections closed')
  } catch (error) {
    logger.error('Error closing Redis connections:', error)
  }
}