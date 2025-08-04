"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentModel = void 0;
const prisma_1 = require("../lib/prisma");
class DeploymentModel {
    /**
     * Create a new deployment record
     */
    static async create(data) {
        return prisma_1.prisma.deployment.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        });
    }
    /**
     * Find deployment by ID
     */
    static async findById(id) {
        return prisma_1.prisma.deployment.findUnique({
            where: { id }
        });
    }
    /**
     * Find deployment by ID with business data
     */
    static async findByIdWithBusiness(id) {
        return prisma_1.prisma.deployment.findUnique({
            where: { id },
            include: {
                business: {
                    select: { id: true, name: true, status: true }
                }
            }
        });
    }
    /**
     * Find all deployments by business ID
     */
    static async findByBusinessId(businessId) {
        return prisma_1.prisma.deployment.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find latest deployment for a business
     */
    static async findLatestByBusinessId(businessId) {
        return prisma_1.prisma.deployment.findFirst({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find deployments by status
     */
    static async findByStatus(status) {
        return prisma_1.prisma.deployment.findMany({
            where: { status },
            include: {
                business: {
                    select: { id: true, name: true, status: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Find active/in-progress deployments
     */
    static async findActiveDeployments() {
        return prisma_1.prisma.deployment.findMany({
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
        });
    }
    /**
     * Update deployment data
     */
    static async update(id, data) {
        return prisma_1.prisma.deployment.update({
            where: { id },
            data
        });
    }
    /**
     * Update deployment status
     */
    static async updateStatus(id, status) {
        const updateData = { status };
        // Automatically set timestamps based on status
        if (status === 'IN_PROGRESS' && !await this.hasStarted(id)) {
            updateData.startedAt = new Date();
        }
        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
            updateData.completedAt = new Date();
        }
        return prisma_1.prisma.deployment.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Start deployment (set status to IN_PROGRESS and startedAt)
     */
    static async startDeployment(id) {
        return prisma_1.prisma.deployment.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            }
        });
    }
    /**
     * Complete deployment successfully
     */
    static async completeDeployment(id, url) {
        return prisma_1.prisma.deployment.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                ...(url && { url })
            }
        });
    }
    /**
     * Fail deployment with error logs
     */
    static async failDeployment(id, errorLogs) {
        return prisma_1.prisma.deployment.update({
            where: { id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                ...(errorLogs && { errorLogs })
            }
        });
    }
    /**
     * Cancel deployment
     */
    static async cancelDeployment(id) {
        return prisma_1.prisma.deployment.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                completedAt: new Date()
            }
        });
    }
    /**
     * Delete deployment
     */
    static async delete(id) {
        return prisma_1.prisma.deployment.delete({
            where: { id }
        });
    }
    /**
     * Check if deployment has started
     */
    static async hasStarted(id) {
        const deployment = await prisma_1.prisma.deployment.findUnique({
            where: { id },
            select: { startedAt: true }
        });
        return !!deployment?.startedAt;
    }
    /**
     * Get deployment statistics
     */
    static async getStatistics(businessId) {
        const where = businessId ? { businessId } : {};
        const [total, pending, inProgress, completed, failed, cancelled] = await Promise.all([
            prisma_1.prisma.deployment.count({ where }),
            prisma_1.prisma.deployment.count({ where: { ...where, status: 'PENDING' } }),
            prisma_1.prisma.deployment.count({ where: { ...where, status: 'IN_PROGRESS' } }),
            prisma_1.prisma.deployment.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma_1.prisma.deployment.count({ where: { ...where, status: 'FAILED' } }),
            prisma_1.prisma.deployment.count({ where: { ...where, status: 'CANCELLED' } })
        ]);
        const successRate = total > 0 ? (completed / total) * 100 : 0;
        // Calculate average deployment time for completed deployments
        const completedDeployments = await prisma_1.prisma.deployment.findMany({
            where: {
                ...where,
                status: 'COMPLETED',
                startedAt: { not: null },
                completedAt: { not: null }
            },
            select: { startedAt: true, completedAt: true }
        });
        const avgDeploymentTime = completedDeployments.length > 0
            ? completedDeployments.reduce((sum, deployment) => {
                const duration = deployment.completedAt.getTime() - deployment.startedAt.getTime();
                return sum + duration;
            }, 0) / completedDeployments.length / 1000 / 60 // Convert to minutes
            : 0;
        return {
            total,
            pending,
            inProgress,
            completed,
            failed,
            cancelled,
            successRate,
            avgDeploymentTime
        };
    }
    /**
     * Get recent deployments with performance data
     */
    static async getRecentDeployments(limit = 20) {
        const deployments = await prisma_1.prisma.deployment.findMany({
            include: {
                business: {
                    select: { id: true, name: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return deployments.map(deployment => ({
            ...deployment,
            duration: deployment.startedAt && deployment.completedAt
                ? (deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000 / 60 // minutes
                : undefined
        }));
    }
    /**
     * Find deployments that have been running too long (potentially stuck)
     */
    static async findStuckDeployments(timeoutMinutes = 60) {
        const timeoutDate = new Date();
        timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);
        return prisma_1.prisma.deployment.findMany({
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
        });
    }
    /**
     * Get successful deployment for business (for URL retrieval)
     */
    static async getSuccessfulDeployment(businessId) {
        return prisma_1.prisma.deployment.findFirst({
            where: {
                businessId,
                status: 'COMPLETED',
                url: { not: null }
            },
            orderBy: { completedAt: 'desc' }
        });
    }
}
exports.DeploymentModel = DeploymentModel;
//# sourceMappingURL=deployment.model.js.map