import { User } from '@prisma/client'
import { prisma } from '../index'
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  isValidEmail, 
  isStrongPassword 
} from '../utils/auth.util'
import { 
  UserRegistrationInput, 
  UserLoginInput 
} from '../utils/schemas'
import { logger } from '../index'

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string | null
    createdAt: Date
  }
  token: string
}

export class AuthService {
  static async register(userData: UserRegistrationInput): Promise<AuthResponse> {
    const { email, password, name } = userData

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(password)
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    try {
      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      })

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email
      })

      logger.info(`New user registered: ${user.email}`)

      return {
        user,
        token
      }
    } catch (error) {
      logger.error('Registration error:', error)
      throw new Error('Failed to create user')
    }
  }

  static async login(loginData: UserLoginInput): Promise<AuthResponse> {
    const { email, password } = loginData

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        throw new Error('Invalid credentials')
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password)
      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email
      })

      logger.info(`User logged in: ${user.email}`)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    } catch (error) {
      logger.error('Login error:', error)
      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw error
      }
      throw new Error('Failed to authenticate user')
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      }) as User | null
    } catch (error) {
      logger.error('Get user error:', error)
      return null
    }
  }

  static async updateUser(
    userId: string, 
    updateData: { name?: string; avatar?: string }
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      })

      logger.info(`User updated: ${user.email}`)
      return user as User
    } catch (error) {
      logger.error('Update user error:', error)
      throw new Error('Failed to update user')
    }
  }

  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    // Validate new password strength
    const passwordValidation = isStrongPassword(newPassword)
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
    }

    try {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword)

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })

      logger.info(`Password changed for user: ${user.email}`)
    } catch (error) {
      logger.error('Change password error:', error)
      if (error instanceof Error && 
          (error.message === 'User not found' || error.message === 'Current password is incorrect')) {
        throw error
      }
      throw new Error('Failed to change password')
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Delete user (this will cascade delete related businesses, campaigns, etc.)
      await prisma.user.delete({
        where: { id: userId }
      })

      logger.info(`User deleted: ${user.email}`)
    } catch (error) {
      logger.error('Delete user error:', error)
      if (error instanceof Error && error.message === 'User not found') {
        throw error
      }
      throw new Error('Failed to delete user')
    }
  }
}