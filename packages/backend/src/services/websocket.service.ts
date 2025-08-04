import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { logger } from '../index'

interface ProgressUpdate {
  businessId: string
  stage: string
  progress: number
  message: string
  timestamp: Date
  data?: any
}

interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  businessId?: string
  userId?: string
}

export class WebSocketService {
  private io: Server | null = null
  private connectedClients = new Map<string, string>() // socketId -> userId
  
  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })
    
    this.setupEventHandlers()
    logger.info('WebSocket server initialized')
  }
  
  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return
    
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)
      
      // Handle authentication
      socket.on('authenticate', (data: { userId: string, token: string }) => {
        // TODO: Verify JWT token
        this.connectedClients.set(socket.id, data.userId)
        socket.join(`user:${data.userId}`)
        logger.info(`User ${data.userId} authenticated on socket ${socket.id}`)
        
        socket.emit('authenticated', { success: true })
      })
      
      // Handle business subscription
      socket.on('subscribe:business', (businessId: string) => {
        socket.join(`business:${businessId}`)
        logger.info(`Socket ${socket.id} subscribed to business ${businessId}`)
      })
      
      // Handle business unsubscription
      socket.on('unsubscribe:business', (businessId: string) => {
        socket.leave(`business:${businessId}`)
        logger.info(`Socket ${socket.id} unsubscribed from business ${businessId}`)
      })
      
      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.connectedClients.get(socket.id)
        this.connectedClients.delete(socket.id)
        logger.info(`Client disconnected: ${socket.id} (user: ${userId})`)
      })
    })
  }
  
  /**
   * Send progress update for business creation
   */
  emitProgressUpdate(update: ProgressUpdate): void {
    if (!this.io) return
    
    logger.info(`Emitting progress update for business ${update.businessId}`, update)
    
    // Send to business-specific room
    this.io.to(`business:${update.businessId}`).emit('business:progress', update)
    
    // Send to all authenticated users (for admin dashboard)
    this.io.emit('admin:progress', update)
  }
  
  /**
   * Send notification to specific user
   */
  emitNotification(userId: string, notification: NotificationData): void {
    if (!this.io) return
    
    logger.info(`Sending notification to user ${userId}`, notification)
    this.io.to(`user:${userId}`).emit('notification', notification)
  }
  
  /**
   * Send notification to all users
   */
  emitBroadcastNotification(notification: NotificationData): void {
    if (!this.io) return
    
    logger.info('Broadcasting notification to all users', notification)
    this.io.emit('notification', notification)
  }
  
  /**
   * Send business status update
   */
  emitBusinessStatusUpdate(businessId: string, status: any): void {
    if (!this.io) return
    
    logger.info(`Emitting status update for business ${businessId}`, status)
    this.io.to(`business:${businessId}`).emit('business:status', {
      businessId,
      status,
      timestamp: new Date()
    })
  }
  
  /**
   * Send development monitoring update
   */
  emitDevelopmentUpdate(businessId: string, data: any): void {
    if (!this.io) return
    
    logger.info(`Emitting development update for business ${businessId}`, data)
    this.io.to(`business:${businessId}`).emit('business:development', {
      businessId,
      data,
      timestamp: new Date()
    })
  }
  
  /**
   * Send analytics update
   */
  emitAnalyticsUpdate(businessId: string, metrics: any): void {
    if (!this.io) return
    
    this.io.to(`business:${businessId}`).emit('business:analytics', {
      businessId,
      metrics,
      timestamp: new Date()
    })
  }
  
  /**
   * Send campaign update
   */
  emitCampaignUpdate(businessId: string, campaign: any): void {
    if (!this.io) return
    
    this.io.to(`business:${businessId}`).emit('business:campaign', {
      businessId,
      campaign,
      timestamp: new Date()
    })
  }
  
  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedClients.size
  }
  
  /**
   * Get users subscribed to business
   */
  getBusinessSubscribers(businessId: string): string[] {
    if (!this.io) return []
    
    const room = this.io.sockets.adapter.rooms.get(`business:${businessId}`)
    return room ? Array.from(room) : []
  }
  
  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedClients.values()).includes(userId)
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()