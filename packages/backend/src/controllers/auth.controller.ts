import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { logger } from '../index'

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body)
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      })
    } catch (error) {
      logger.error('Registration controller error:', error)
      
      const message = error instanceof Error ? error.message : 'Registration failed'
      const statusCode = message.includes('already exists') ? 409 : 400
      
      res.status(statusCode).json({
        success: false,
        message
      })
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body)
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      })
    } catch (error) {
      logger.error('Login controller error:', error)
      
      const message = error instanceof Error ? error.message : 'Login failed'
      const statusCode = message.includes('Invalid credentials') ? 401 : 400
      
      res.status(statusCode).json({
        success: false,
        message
      })
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const user = await AuthService.getUserById(req.user.id)
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        })
        return
      }

      res.status(200).json({
        success: true,
        data: { user }
      })
    } catch (error) {
      logger.error('Get profile controller error:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      })
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const user = await AuthService.updateUser(req.user.id, req.body)
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      })
    } catch (error) {
      logger.error('Update profile controller error:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      })
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        })
        return
      }

      await AuthService.changePassword(req.user.id, currentPassword, newPassword)
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      })
    } catch (error) {
      logger.error('Change password controller error:', error)
      
      const message = error instanceof Error ? error.message : 'Failed to change password'
      const statusCode = message.includes('incorrect') || message.includes('not found') ? 400 : 500
      
      res.status(statusCode).json({
        success: false,
        message
      })
    }
  }

  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      await AuthService.deleteUser(req.user.id)
      
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      })
    } catch (error) {
      logger.error('Delete account controller error:', error)
      
      const message = error instanceof Error ? error.message : 'Failed to delete account'
      const statusCode = message.includes('not found') ? 404 : 500
      
      res.status(statusCode).json({
        success: false,
        message
      })
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      // For refresh, we generate a new token with current user data
      const { generateToken } = await import('../utils/auth.util')
      const token = generateToken({
        userId: req.user.id,
        email: req.user.email
      })
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { 
          token,
          user: req.user
        }
      })
    } catch (error) {
      logger.error('Refresh token controller error:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      })
    }
  }
}