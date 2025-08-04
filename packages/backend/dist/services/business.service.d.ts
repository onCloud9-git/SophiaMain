import { Business, BusinessStatus } from '@prisma/client';
import { BusinessWithDetails } from '../models/business.model';
import { BusinessCreateInput, BusinessUpdateInput, PaginationQuery } from '../utils/schemas';
export interface BusinessListResponse {
    businesses: Business[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface BusinessStatsResponse {
    total: number;
    active: number;
    developing: number;
    paused: number;
    closed: number;
}
export declare class BusinessService {
    /**
     * Create a new business
     */
    static createBusiness(businessData: BusinessCreateInput, ownerId: string): Promise<Business>;
    /**
     * Get business by ID
     */
    static getBusinessById(id: string, ownerId?: string): Promise<Business | null>;
    /**
     * Get business with full details (includes relations)
     */
    static getBusinessWithDetails(id: string, ownerId?: string): Promise<BusinessWithDetails | null>;
    /**
     * Get all businesses for an owner with pagination
     */
    static getBusinessesByOwner(ownerId: string, pagination: PaginationQuery): Promise<BusinessListResponse>;
    /**
     * Get businesses by status
     */
    static getBusinessesByStatus(status: BusinessStatus): Promise<Business[]>;
    /**
     * Get active businesses for automation
     */
    static getActiveBusinesses(): Promise<Business[]>;
    /**
     * Update business
     */
    static updateBusiness(id: string, updateData: BusinessUpdateInput, ownerId?: string): Promise<Business>;
    /**
     * Update business status
     */
    static updateBusinessStatus(id: string, status: BusinessStatus, ownerId?: string): Promise<Business>;
    /**
     * Update Stripe integration data
     */
    static updateStripeData(id: string, stripeData: {
        productId: string;
        priceId: string;
    }, ownerId?: string): Promise<Business>;
    /**
     * Delete business
     */
    static deleteBusiness(id: string, ownerId?: string): Promise<Business>;
    /**
     * Search businesses
     */
    static searchBusinesses(query: string, ownerId?: string): Promise<Business[]>;
    /**
     * Get business statistics
     */
    static getBusinessStatistics(ownerId?: string): Promise<BusinessStatsResponse>;
    /**
     * Mark business as failed (used by job queue)
     */
    static markBusinessAsFailed(id: string, reason?: string): Promise<Business>;
    /**
     * Get businesses requiring monitoring (active businesses)
     */
    static getBusinessesForMonitoring(): Promise<Business[]>;
}
