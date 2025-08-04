import { Prisma, User } from '@prisma/client'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

export interface CreateUserData {
  email: string
  password: string
  name?: string
  avatar?: string
}

export interface UpdateUserData {
  email?: string
  name?: string
  avatar?: string
}

export class UserModel {
  /**
   * Create a new user with hashed password
   */
  static async create(data: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12)
    
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      }
    })
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    })
  }

  /**
   * Find user by ID with businesses
   */
  static async findByIdWithBusinesses(id: string): Promise<User & { businesses: any[] } | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { 
        businesses: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  /**
   * Update user data
   */
  static async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    })
  }

  /**
   * Verify user password
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * Delete user and all related data
   */
  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id }
    })
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    return !!user
  }
}