import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { logger } from '../index'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string | null
      }
    }
  }
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured')
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      })
      return
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    logger.error('Auth middleware error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
      return
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

// Optional authentication - user may or may not be logged in
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      next()
      return
    }

    const token = authHeader.substring(7)
    
    if (!process.env.JWT_SECRET) {
      next()
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (user) {
      req.user = user
    }
    
    next()
  } catch (error) {
    // On optional auth, we just continue without user on error
    logger.warn('Optional auth middleware error:', error)
    next()
  }
}