import { Deployment, DeploymentStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface CreateDeploymentData {
  businessId: string
  version: string
  environment?: string
  url?: string
  commitHash?: string
  buildLogs?: string
}

export interface UpdateDeploymentData {
  status?: DeploymentStatus
  url?: string
  buildLogs?: string
  errorLogs?: string
  startedAt?: Date
  completedAt?: Date
}

export interface DeploymentWithBusiness extends Deployment {
  business?: {
    id: string
    name: string
    status: string
  }
}

export class DeploymentModel {
  /**
   * Create a new deployment record
   */
  static async create(data: CreateDeploymentData): Promise<Deployment> {
    return prisma.deployment.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    })
  }

  /**
   * Find deployment by ID
   */
  static async findById(id: string): Promise<Deployment | null> {
    return prisma.deployment.findUnique({
      where: { id }
    })
  }

  /**
   * Find deployment by ID with business data
   */
  static async findByIdWithBusiness(id: string): Promise<DeploymentWithBusiness | null> {
    return prisma.deployment.findUnique({
      where: { id },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      }
    })
  }

  /**
   * Find all deployments by business ID
   */
  static async findByBusinessId(businessId: string): Promise<Deployment[]> {
    return prisma.deployment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Find latest deployment for a business
   */
  static async findLatestByBusinessId(businessId: string): Promise<Deployment | null> {
    return prisma.deployment.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Find deployments by status
   */
  static async findByStatus(status: DeploymentStatus): Promise<DeploymentWithBusiness[]> {
    return prisma.deployment.findMany({
      where: { status },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Find active/in-progress deployments
   */
  static async findActiveDeployments(): Promise<DeploymentWithBusiness[]> {
    return prisma.deployment.findMany({
      where: { 
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { startedAt: 'asc' }
    })
  }

  /**
   * Update deployment data
   */
  static async update(id: string, data: UpdateDeploymentData): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data
    })
  }

  /**
   * Update deployment status
   */
  static async updateStatus(id: string, status: DeploymentStatus): Promise<Deployment> {
    const updateData: any = { status }
    
    // Automatically set timestamps based on status
    if (status === 'IN_PROGRESS' && !await this.hasStarted(id)) {
      updateData.startedAt = new Date()
    }
    
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      updateData.completedAt = new Date()
    }

    return prisma.deployment.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Start deployment (set status to IN_PROGRESS and startedAt)
   */
  static async startDeployment(id: string): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })
  }

  /**
   * Complete deployment successfully
   */
  static async completeDeployment(id: string, url?: string): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        ...(url && { url })
      }
    })
  }

  /**
   * Fail deployment with error logs
   */
  static async failDeployment(id: string, errorLogs?: string): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        ...(errorLogs && { errorLogs })
      }
    })
  }

  /**
   * Cancel deployment
   */
  static async cancelDeployment(id: string): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    })
  }

  /**
   * Delete deployment
   */
  static async delete(id: string): Promise<Deployment> {
    return prisma.deployment.delete({
      where: { id }
    })
  }

  /**
   * Check if deployment has started
   */
  private static async hasStarted(id: string): Promise<boolean> {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      select: { startedAt: true }
    })
    return !!deployment?.startedAt
  }

  /**
   * Get deployment statistics
   */
  static async getStatistics(businessId?: string): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    cancelled: number
    successRate: number
    avgDeploymentTime: number
  }> {
    const where = businessId ? { businessId } : {}
    
    const [total, pending, inProgress, completed, failed, cancelled] = await Promise.all([
      prisma.deployment.count({ where }),
      prisma.deployment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.deployment.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.deployment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.deployment.count({ where: { ...where, status: 'FAILED' } }),
      prisma.deployment.count({ where: { ...where, status: 'CANCELLED' } })
    ])

    const successRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate average deployment time for completed deployments
    const completedDeployments = await prisma.deployment.findMany({
      where: { 
        ...where, 
        status: 'COMPLETED',
        startedAt: { not: null },
        completedAt: { not: null }
      },
      select: { startedAt: true, completedAt: true }
    })

    const avgDeploymentTime = completedDeployments.length > 0
      ? completedDeployments.reduce((sum, deployment) => {
          const duration = deployment.completedAt!.getTime() - deployment.startedAt!.getTime()
          return sum + duration
        }, 0) / completedDeployments.length / 1000 / 60 // Convert to minutes
      : 0

    return {
      total,
      pending,
      inProgress,
      completed,
      failed,
      cancelled,
      successRate,
      avgDeploymentTime
    }
  }

  /**
   * Get recent deployments with performance data
   */
  static async getRecentDeployments(limit: number = 20): Promise<Array<DeploymentWithBusiness & {
    duration?: number
  }>> {
    const deployments = await prisma.deployment.findMany({
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return deployments.map(deployment => ({
      ...deployment,
      duration: deployment.startedAt && deployment.completedAt
        ? (deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000 / 60 // minutes
        : undefined
    }))
  }

  /**
   * Find deployments that have been running too long (potentially stuck)
   */
  static async findStuckDeployments(timeoutMinutes: number = 60): Promise<DeploymentWithBusiness[]> {
    const timeoutDate = new Date()
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes)

    return prisma.deployment.findMany({
      where: {
        status: 'IN_PROGRESS',
        startedAt: {
          lt: timeoutDate
        }
      },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      }
    })
  }

  /**
   * Get successful deployment for business (for URL retrieval)
   */
  static async getSuccessfulDeployment(businessId: string): Promise<Deployment | null> {
    return prisma.deployment.findFirst({
      where: {
        businessId,
        status: 'COMPLETED',
        url: { not: null }
      },
      orderBy: { completedAt: 'desc' }
    })
  }
}