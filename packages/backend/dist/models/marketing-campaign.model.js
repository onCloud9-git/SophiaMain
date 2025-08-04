"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingCampaignModel = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
class MarketingCampaignModel {
    /**
     * Create a new marketing campaign
     */
    static async create(data) {
        return prisma_1.prisma.marketingCampaign.create({
            data: {
                ...data,
                budget: new client_1.Prisma.Decimal(data.budget),
                status: 'DRAFT'
            }
        });
    }
    /**
     * Find campaign by ID
     */
    static async findById(id) {
        return prisma_1.prisma.marketingCampaign.findUnique({
            where: { id }
        });
    }
    /**
     * Find campaign by ID with business data
     */
    static async findByIdWithBusiness(id) {
        return prisma_1.prisma.marketingCampaign.findUnique({
            where: { id },
            include: {
                business: {
                    select: { id: true, name: true, status: true }
                }
            }
        });
    }
    /**
     * Find all campaigns by business ID
     */
    static async findByBusinessId(businessId) {
        return prisma_1.prisma.marketingCampaign.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find campaigns by platform
     */
    static async findByPlatform(platform) {
        return prisma_1.prisma.marketingCampaign.findMany({
            where: { platform },
            include: {
                business: {
                    select: { id: true, name: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find campaigns by status
     */
    static async findByStatus(status) {
        return prisma_1.prisma.marketingCampaign.findMany({
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
     * Find active campaigns for automation
     */
    static async findActiveCampaigns() {
        return prisma_1.prisma.marketingCampaign.findMany({
            where: {
                status: 'ACTIVE',
                business: {
                    status: 'ACTIVE'
                }
            },
            include: {
                business: true
            }
        });
    }
    /**
     * Update campaign data
     */
    static async update(id, data) {
        const updateData = { ...data };
        // Convert numbers to Decimal for financial fields
        if (data.budget !== undefined) {
            updateData.budget = new client_1.Prisma.Decimal(data.budget);
        }
        if (data.spent !== undefined) {
            updateData.spent = new client_1.Prisma.Decimal(data.spent);
        }
        return prisma_1.prisma.marketingCampaign.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Update campaign status
     */
    static async updateStatus(id, status) {
        return prisma_1.prisma.marketingCampaign.update({
            where: { id },
            data: { status }
        });
    }
    /**
     * Update campaign performance metrics
     */
    static async updateMetrics(id, metrics) {
        const updateData = { ...metrics };
        if (metrics.spent !== undefined) {
            updateData.spent = new client_1.Prisma.Decimal(metrics.spent);
        }
        return prisma_1.prisma.marketingCampaign.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Increment campaign metrics (for real-time updates)
     */
    static async incrementMetrics(id, metrics) {
        const current = await this.findById(id);
        if (!current)
            throw new Error('Campaign not found');
        const updateData = {};
        if (metrics.spent !== undefined) {
            updateData.spent = new client_1.Prisma.Decimal(current.spent.toNumber() + metrics.spent);
        }
        if (metrics.impressions !== undefined) {
            updateData.impressions = current.impressions + metrics.impressions;
        }
        if (metrics.clicks !== undefined) {
            updateData.clicks = current.clicks + metrics.clicks;
        }
        if (metrics.conversions !== undefined) {
            updateData.conversions = current.conversions + metrics.conversions;
        }
        return prisma_1.prisma.marketingCampaign.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Delete campaign
     */
    static async delete(id) {
        return prisma_1.prisma.marketingCampaign.delete({
            where: { id }
        });
    }
    /**
     * Get campaign performance summary
     */
    static async getPerformanceSummary(businessId) {
        const campaigns = await prisma_1.prisma.marketingCampaign.findMany({
            where: { businessId }
        });
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
        const totalSpent = campaigns.reduce((sum, c) => sum + c.spent.toNumber(), 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
        const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        return {
            totalCampaigns,
            activeCampaigns,
            totalSpent,
            totalImpressions,
            totalClicks,
            totalConversions,
            avgCTR,
            avgCPC,
            avgConversionRate
        };
    }
    /**
     * Pause all campaigns for a business
     */
    static async pauseAllCampaigns(businessId) {
        const result = await prisma_1.prisma.marketingCampaign.updateMany({
            where: {
                businessId,
                status: 'ACTIVE'
            },
            data: { status: 'PAUSED' }
        });
        return result.count;
    }
    /**
     * Find campaigns by external platform ID
     */
    static async findByExternalId(platform, externalId) {
        const where = { platform };
        switch (platform) {
            case 'GOOGLE_ADS':
                where.googleAdsId = externalId;
                break;
            case 'FACEBOOK_ADS':
            case 'INSTAGRAM_ADS':
                where.facebookId = externalId;
                break;
            case 'LINKEDIN_ADS':
                where.linkedinId = externalId;
                break;
        }
        return prisma_1.prisma.marketingCampaign.findFirst({ where });
    }
}
exports.MarketingCampaignModel = MarketingCampaignModel;
//# sourceMappingURL=marketing-campaign.model.js.map