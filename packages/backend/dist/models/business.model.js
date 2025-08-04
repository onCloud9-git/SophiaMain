"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessModel = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
class BusinessModel {
    /**
     * Create a new business
     */
    static async create(data) {
        return prisma_1.prisma.business.create({
            data: {
                ...data,
                monthlyPrice: new client_1.Prisma.Decimal(data.monthlyPrice),
                initialBudget: data.initialBudget ? new client_1.Prisma.Decimal(data.initialBudget) : undefined,
                targetCPA: data.targetCPA ? new client_1.Prisma.Decimal(data.targetCPA) : undefined,
                status: 'PLANNING'
            }
        });
    }
    /**
     * Find business by ID
     */
    static async findById(id) {
        return prisma_1.prisma.business.findUnique({
            where: { id }
        });
    }
    /**
     * Find business by ID with all related data
     */
    static async findByIdWithDetails(id) {
        return prisma_1.prisma.business.findUnique({
            where: { id },
            include: {
                campaigns: {
                    orderBy: { createdAt: 'desc' }
                },
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 30 // Last 30 days
                },
                deployments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10 // Last 10 deployments
                },
                owner: {
                    select: { id: true, email: true, name: true }
                }
            }
        });
    }
    /**
     * Find all businesses by owner
     */
    static async findByOwnerId(ownerId) {
        return prisma_1.prisma.business.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find businesses by status
     */
    static async findByStatus(status) {
        return prisma_1.prisma.business.findMany({
            where: { status },
            include: {
                owner: {
                    select: { id: true, email: true, name: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Find active businesses for monitoring/automation
     */
    static async findActiveBusinesses() {
        return prisma_1.prisma.business.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                campaigns: true,
                metrics: {
                    orderBy: { date: 'desc' },
                    take: 14 // Last 2 weeks for decision making
                }
            }
        });
    }
    /**
     * Update business data
     */
    static async update(id, data) {
        const updateData = { ...data };
        // Convert numbers to Decimal for financial fields
        if (data.monthlyPrice !== undefined) {
            updateData.monthlyPrice = new client_1.Prisma.Decimal(data.monthlyPrice);
        }
        if (data.initialBudget !== undefined) {
            updateData.initialBudget = new client_1.Prisma.Decimal(data.initialBudget);
        }
        if (data.targetCPA !== undefined) {
            updateData.targetCPA = new client_1.Prisma.Decimal(data.targetCPA);
        }
        return prisma_1.prisma.business.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Update business status
     */
    static async updateStatus(id, status) {
        return prisma_1.prisma.business.update({
            where: { id },
            data: { status }
        });
    }
    /**
     * Update Stripe integration data
     */
    static async updateStripeData(id, data) {
        return prisma_1.prisma.business.update({
            where: { id },
            data: {
                stripeProductId: data.productId,
                stripePriceId: data.priceId
            }
        });
    }
    /**
     * Delete business and all related data (cascade)
     */
    static async delete(id) {
        return prisma_1.prisma.business.delete({
            where: { id }
        });
    }
    /**
     * Get business statistics
     */
    static async getStatistics(ownerId) {
        const where = ownerId ? { ownerId } : {};
        const [total, active, developing, paused, closed] = await Promise.all([
            prisma_1.prisma.business.count({ where }),
            prisma_1.prisma.business.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma_1.prisma.business.count({ where: { ...where, status: 'DEVELOPING' } }),
            prisma_1.prisma.business.count({ where: { ...where, status: 'PAUSED' } }),
            prisma_1.prisma.business.count({ where: { ...where, status: 'CLOSED' } })
        ]);
        return { total, active, developing, paused, closed };
    }
    /**
     * Search businesses by name or industry
     */
    static async search(query, ownerId) {
        const where = {
            AND: [
                ownerId ? { ownerId } : {},
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { industry: { contains: query, mode: 'insensitive' } }
                    ]
                }
            ]
        };
        return prisma_1.prisma.business.findMany({
            where,
            orderBy: { updatedAt: 'desc' }
        });
    }
}
exports.BusinessModel = BusinessModel;
//# sourceMappingURL=business.model.js.map