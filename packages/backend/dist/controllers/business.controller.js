"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const business_service_1 = require("../services/business.service");
const index_1 = require("../index");
class BusinessController {
    /**
     * Create a new business
     * POST /api/businesses
     */
    static async create(req, res) {
        try {
            const ownerId = req.user?.id;
            if (!ownerId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const business = await business_service_1.BusinessService.createBusiness(req.body, ownerId);
            res.status(201).json({
                success: true,
                message: 'Business created successfully',
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Business creation controller error:', error);
            const message = error instanceof Error ? error.message : 'Business creation failed';
            const statusCode = message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get business by ID
     * GET /api/businesses/:id
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const ownerId = req.user?.id;
            const business = await business_service_1.BusinessService.getBusinessById(id, ownerId);
            if (!business) {
                res.status(404).json({
                    success: false,
                    message: 'Business not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Get business controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get business';
            const statusCode = message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get business with full details
     * GET /api/businesses/:id/details
     */
    static async getDetails(req, res) {
        try {
            const { id } = req.params;
            const ownerId = req.user?.id;
            const business = await business_service_1.BusinessService.getBusinessWithDetails(id, ownerId);
            if (!business) {
                res.status(404).json({
                    success: false,
                    message: 'Business not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Get business details controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get business details';
            const statusCode = message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get all businesses for the authenticated user
     * GET /api/businesses
     */
    static async getAll(req, res) {
        try {
            const ownerId = req.user?.id;
            if (!ownerId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await business_service_1.BusinessService.getBusinessesByOwner(ownerId, pagination);
            res.status(200).json({
                success: true,
                data: result.businesses,
                pagination: result.pagination
            });
        }
        catch (error) {
            index_1.logger.error('Get businesses controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get businesses';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get businesses by status
     * GET /api/businesses/status/:status
     */
    static async getByStatus(req, res) {
        try {
            const { status } = req.params;
            // Validate status
            const validStatuses = ['PLANNING', 'DEVELOPING', 'DEPLOYING', 'ACTIVE', 'PAUSED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid business status'
                });
                return;
            }
            const businesses = await business_service_1.BusinessService.getBusinessesByStatus(status);
            res.status(200).json({
                success: true,
                data: businesses
            });
        }
        catch (error) {
            index_1.logger.error('Get businesses by status controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get businesses by status';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
    /**
     * Update business
     * PUT /api/businesses/:id
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const ownerId = req.user?.id;
            const business = await business_service_1.BusinessService.updateBusiness(id, req.body, ownerId);
            res.status(200).json({
                success: true,
                message: 'Business updated successfully',
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Update business controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update business';
            const statusCode = message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 : 400;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Update business status
     * PATCH /api/businesses/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const ownerId = req.user?.id;
            // Validate status
            const validStatuses = ['PLANNING', 'DEVELOPING', 'DEPLOYING', 'ACTIVE', 'PAUSED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid business status'
                });
                return;
            }
            const business = await business_service_1.BusinessService.updateBusinessStatus(id, status, ownerId);
            res.status(200).json({
                success: true,
                message: 'Business status updated successfully',
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Update business status controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update business status';
            const statusCode = message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 : 400;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Delete business
     * DELETE /api/businesses/:id
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const ownerId = req.user?.id;
            const business = await business_service_1.BusinessService.deleteBusiness(id, ownerId);
            res.status(200).json({
                success: true,
                message: 'Business deleted successfully',
                data: business
            });
        }
        catch (error) {
            index_1.logger.error('Delete business controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete business';
            const statusCode = message.includes('not found') ? 404 :
                message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    /**
     * Search businesses
     * GET /api/businesses/search?q=query
     */
    static async search(req, res) {
        try {
            const { q: query } = req.query;
            const ownerId = req.user?.id;
            if (!query || typeof query !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
                return;
            }
            const businesses = await business_service_1.BusinessService.searchBusinesses(query, ownerId);
            res.status(200).json({
                success: true,
                data: businesses
            });
        }
        catch (error) {
            index_1.logger.error('Search businesses controller error:', error);
            const message = error instanceof Error ? error.message : 'Search failed';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get business statistics
     * GET /api/businesses/statistics
     */
    static async getStatistics(req, res) {
        try {
            const ownerId = req.user?.id;
            const statistics = await business_service_1.BusinessService.getBusinessStatistics(ownerId);
            res.status(200).json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            index_1.logger.error('Get business statistics controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get statistics';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
    /**
     * Get active businesses (for admin/monitoring)
     * GET /api/businesses/active
     */
    static async getActive(req, res) {
        try {
            const businesses = await business_service_1.BusinessService.getActiveBusinesses();
            res.status(200).json({
                success: true,
                data: businesses
            });
        }
        catch (error) {
            index_1.logger.error('Get active businesses controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to get active businesses';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
}
exports.BusinessController = BusinessController;
//# sourceMappingURL=business.controller.js.map