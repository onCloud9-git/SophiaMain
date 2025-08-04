import { Business, BusinessStatus } from '@prisma/client';
export interface CreateBusinessData {
    name: string;
    description: string;
    industry: string;
    monthlyPrice: number;
    currency?: string;
    ownerId: string;
    websiteUrl?: string;
    repositoryUrl?: string;
    landingPageUrl?: string;
    analyticsId?: string;
    stripeProductId?: string;
    stripePriceId?: string;
    googleAdsCustomerId?: string;
    googleAdsRefreshToken?: string;
    initialBudget?: number;
    targetCPA?: number;
}
export interface UpdateBusinessData {
    name?: string;
    description?: string;
    industry?: string;
    monthlyPrice?: number;
    currency?: string;
    status?: BusinessStatus;
    websiteUrl?: string;
    repositoryUrl?: string;
    landingPageUrl?: string;
    analyticsId?: string;
    stripeProductId?: string;
    stripePriceId?: string;
    googleAdsCustomerId?: string;
    googleAdsRefreshToken?: string;
    initialBudget?: number;
    targetCPA?: number;
}
export interface BusinessWithDetails extends Business {
    campaigns?: any[];
    metrics?: any[];
    deployments?: any[];
    owner?: {
        id: string;
        email: string;
        name: string | null;
    };
}
export declare class BusinessModel {
    /**
     * Create a new business
     */
    static create(data: CreateBusinessData): Promise<Business>;
    /**
     * Find business by ID
     */
    static findById(id: string): Promise<Business | null>;
    /**
     * Find business by ID with all related data
     */
    static findByIdWithDetails(id: string): Promise<BusinessWithDetails | null>;
    /**
     * Find all businesses by owner
     */
    static findByOwnerId(ownerId: string): Promise<Business[]>;
    /**
     * Find businesses by status
     */
    static findByStatus(status: BusinessStatus): Promise<Business[]>;
    /**
     * Find active businesses for monitoring/automation
     */
    static findActiveBusinesses(): Promise<Business[]>;
    /**
     * Update business data
     */
    static update(id: string, data: UpdateBusinessData): Promise<Business>;
    /**
     * Update business status
     */
    static updateStatus(id: string, status: BusinessStatus): Promise<Business>;
    /**
     * Update Stripe integration data
     */
    static updateStripeData(id: string, data: {
        productId: string;
        priceId: string;
    }): Promise<Business>;
    /**
     * Delete business and all related data (cascade)
     */
    static delete(id: string): Promise<Business>;
    /**
     * Get business statistics
     */
    static getStatistics(ownerId?: string): Promise<{
        total: number;
        active: number;
        developing: number;
        paused: number;
        closed: number;
    }>;
    /**
     * Search businesses by name or industry
     */
    static search(query: string, ownerId?: string): Promise<Business[]>;
}
