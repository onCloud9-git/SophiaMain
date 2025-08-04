import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { Server } from 'socket.io'
import winston from 'winston'

// Import routes
import { authRoutes, businessRoutes, stripeRoutes } from './routes'
import { jobDashboardRoutes, JobManager } from './jobs'

// Initialize Prisma
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
})

// Logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Create Express app
const app: express.Application = express()
const server = createServer(app)

// Initialize Socket.IO
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
    methods: ['GET', 'POST']
  }
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware stack
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}))
app.use(compression())
app.use(limiter)
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))
// Stripe webhook endpoints need raw body - must be before JSON parsing
app.use('/api/stripe/webhooks', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/businesses', businessRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/jobs', jobDashboardRoutes)

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  })
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
  
  // Join user room for personalized notifications
  socket.on('join_user_room', (userId: string) => {
    socket.join(`user:${userId}`)
    logger.info(`User ${userId} joined their room`)
  })
})

// Initialize job system
const initializeJobSystem = async () => {
  try {
    await JobManager.initialize()
    logger.info('✅ Job management system initialized')
  } catch (error) {
    logger.error('Failed to initialize job system:', error)
    // Don't exit - continue without job system for now
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed')
  })
  
  // Shutdown job system
  if (JobManager.isInitialized()) {
    try {
      await JobManager.shutdown()
      logger.info('Job system shut down')
    } catch (error) {
      logger.error('Error shutting down job system:', error)
    }
  }
  
  // Close database connection
  await prisma.$disconnect()
  logger.info('Database connection closed')
  
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, async () => {
  logger.info(`🚀 Sophia AI Backend Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Initialize job system after server starts
  await initializeJobSystem()
})

export { app, server }