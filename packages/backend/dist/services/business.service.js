"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const client_1 = require("@prisma/client");
const business_model_1 = require("../models/business.model");
const index_1 = require("../index");
class BusinessService {
    /**
     * Create a new business
     */
    static async createBusiness(businessData, ownerId) {
        try {
            const createData = {
                ...businessData,
                ownerId
            };
            const business = await business_model_1.BusinessModel.create(createData);
            index_1.logger.info(`Business created successfully: ${business.id}`, {
                businessId: business.id,
                ownerId,
                name: business.name
            });
            return business;
        }
        catch (error) {
            index_1.logger.error('Business creation failed:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error('Business with this name already exists');
                }
            }
            throw new Error('Failed to create business');
        }
    }
    /**
     * Get business by ID
     */
    static async getBusinessById(id, ownerId) {
        try {
            const business = await business_model_1.BusinessModel.findById(id);
            if (!business) {
                return null;
            }
            // Check ownership if ownerId is provided
            if (ownerId && business.ownerId !== ownerId) {
                throw new Error('Unauthorized access to business');
            }
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to get business ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get business with full details (includes relations)
     */
    static async getBusinessWithDetails(id, ownerId) {
        try {
            const business = await business_model_1.BusinessModel.findByIdWithDetails(id);
            if (!business) {
                return null;
            }
            // Check ownership if ownerId is provided
            if (ownerId && business.ownerId !== ownerId) {
                throw new Error('Unauthorized access to business');
            }
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to get business details ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get all businesses for an owner with pagination
     */
    static async getBusinessesByOwner(ownerId, pagination) {
        try {
            const { page, limit } = pagination;
            const skip = (page - 1) * limit;
            const [businesses, total] = await Promise.all([
                business_model_1.BusinessModel.findByOwnerId(ownerId, skip, limit),
                business_model_1.BusinessModel.countByOwnerId(ownerId)
            ]);
            return {
                businesses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            index_1.logger.error(`Failed to get businesses for owner ${ownerId}:`, error);
            throw new Error('Failed to retrieve businesses');
        }
    }
    /**
     * Get businesses by status
     */
    static async getBusinessesByStatus(status) {
        try {
            return await business_model_1.BusinessModel.findByStatus(status);
        }
        catch (error) {
            index_1.logger.error(`Failed to get businesses by status ${status}:`, error);
            throw new Error('Failed to retrieve businesses by status');
        }
    }
    /**
     * Get active businesses for automation
     */
    static async getActiveBusinesses() {
        try {
            return await business_model_1.BusinessModel.findActiveBusinesses();
        }
        catch (error) {
            index_1.logger.error('Failed to get active businesses:', error);
            throw new Error('Failed to retrieve active businesses');
        }
    }
    /**
     * Update business
     */
    static async updateBusiness(id, updateData, ownerId) {
        try {
            // Check if business exists and user has access
            const existingBusiness = await this.getBusinessById(id, ownerId);
            if (!existingBusiness) {
                throw new Error('Business not found');
            }
            const business = await business_model_1.BusinessModel.update(id, updateData);
            index_1.logger.info(`Business updated successfully: ${id}`, {
                businessId: id,
                ownerId: business.ownerId,
                changes: Object.keys(updateData)
            });
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to update business ${id}:`, error);
            throw error;
        }
    }
    /**
     * Update business status
     */
    static async updateBusinessStatus(id, status, ownerId) {
        try {
            // Check if business exists and user has access
            const existingBusiness = await this.getBusinessById(id, ownerId);
            if (!existingBusiness) {
                throw new Error('Business not found');
            }
            const business = await business_model_1.BusinessModel.updateStatus(id, status);
            index_1.logger.info(`Business status updated: ${id} -> ${status}`, {
                businessId: id,
                oldStatus: existingBusiness.status,
                newStatus: status
            });
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to update business status ${id}:`, error);
            throw error;
        }
    }
    /**
     * Update Stripe integration data
     */
    static async updateStripeData(id, stripeData, ownerId) {
        try {
            // Check if business exists and user has access
            const existingBusiness = await this.getBusinessById(id, ownerId);
            if (!existingBusiness) {
                throw new Error('Business not found');
            }
            const business = await business_model_1.BusinessModel.updateStripeData(id, stripeData);
            index_1.logger.info(`Stripe data updated for business: ${id}`, {
                businessId: id,
                productId: stripeData.productId,
                priceId: stripeData.priceId
            });
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to update Stripe data for business ${id}:`, error);
            throw error;
        }
    }
    /**
     * Delete business
     */
    static async deleteBusiness(id, ownerId) {
        try {
            // Check if business exists and user has access
            const existingBusiness = await this.getBusinessById(id, ownerId);
            if (!existingBusiness) {
                throw new Error('Business not found');
            }
            const business = await business_model_1.BusinessModel.delete(id);
            index_1.logger.info(`Business deleted successfully: ${id}`, {
                businessId: id,
                ownerId: business.ownerId,
                name: business.name
            });
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to delete business ${id}:`, error);
            throw error;
        }
    }
    /**
     * Search businesses
     */
    static async searchBusinesses(query, ownerId) {
        try {
            return await business_model_1.BusinessModel.search(query, ownerId);
        }
        catch (error) {
            index_1.logger.error(`Failed to search businesses with query "${query}":`, error);
            throw new Error('Search failed');
        }
    }
    /**
     * Get business statistics
     */
    static async getBusinessStatistics(ownerId) {
        try {
            return await business_model_1.BusinessModel.getStatistics(ownerId);
        }
        catch (error) {
            index_1.logger.error('Failed to get business statistics:', error);
            throw new Error('Failed to retrieve statistics');
        }
    }
    /**
     * Mark business as failed (used by job queue)
     */
    static async markBusinessAsFailed(id, reason) {
        try {
            const business = await business_model_1.BusinessModel.updateStatus(id, 'CLOSED');
            index_1.logger.warn(`Business marked as failed: ${id}`, {
                businessId: id,
                reason
            });
            return business;
        }
        catch (error) {
            index_1.logger.error(`Failed to mark business as failed ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get businesses requiring monitoring (active businesses)
     */
    static async getBusinessesForMonitoring() {
        try {
            return await business_model_1.BusinessModel.findByStatus('ACTIVE');
        }
        catch (error) {
            index_1.logger.error('Failed to get businesses for monitoring:', error);
            throw new Error('Failed to retrieve businesses for monitoring');
        }
    }
}
exports.BusinessService = BusinessService;
//# sourceMappingURL=business.service.js.map