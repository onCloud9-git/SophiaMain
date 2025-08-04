import { MarketingCampaign, CampaignPlatform, CampaignStatus } from '@prisma/client';
export interface CreateCampaignData {
    name: string;
    platform: CampaignPlatform;
    budget: number;
    businessId: string;
    startDate: Date;
    endDate?: Date;
    targetKeywords?: string[];
    audienceData?: any;
    googleAdsId?: string;
    facebookId?: string;
    linkedinId?: string;
}
export interface UpdateCampaignData {
    name?: string;
    status?: CampaignStatus;
    budget?: number;
    spent?: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    endDate?: Date;
    targetKeywords?: string[];
    audienceData?: any;
    googleAdsId?: string;
    facebookId?: string;
    linkedinId?: string;
}
export interface CampaignWithBusiness extends MarketingCampaign {
    business?: {
        id: string;
        name: string;
        status: string;
    };
}
export declare class MarketingCampaignModel {
    /**
     * Create a new marketing campaign
     */
    static create(data: CreateCampaignData): Promise<MarketingCampaign>;
    /**
     * Find campaign by ID
     */
    static findById(id: string): Promise<MarketingCampaign | null>;
    /**
     * Find campaign by ID with business data
     */
    static findByIdWithBusiness(id: string): Promise<CampaignWithBusiness | null>;
    /**
     * Find all campaigns by business ID
     */
    static findByBusinessId(businessId: string): Promise<MarketingCampaign[]>;
    /**
     * Find campaigns by platform
     */
    static findByPlatform(platform: CampaignPlatform): Promise<CampaignWithBusiness[]>;
    /**
     * Find campaigns by status
     */
    static findByStatus(status: CampaignStatus): Promise<CampaignWithBusiness[]>;
    /**
     * Find active campaigns for automation
     */
    static findActiveCampaigns(): Promise<MarketingCampaign[]>;
    /**
     * Update campaign data
     */
    static update(id: string, data: UpdateCampaignData): Promise<MarketingCampaign>;
    /**
     * Update campaign status
     */
    static updateStatus(id: string, status: CampaignStatus): Promise<MarketingCampaign>;
    /**
     * Update campaign performance metrics
     */
    static updateMetrics(id: string, metrics: {
        spent?: number;
        impressions?: number;
        clicks?: number;
        conversions?: number;
    }): Promise<MarketingCampaign>;
    /**
     * Increment campaign metrics (for real-time updates)
     */
    static incrementMetrics(id: string, metrics: {
        spent?: number;
        impressions?: number;
        clicks?: number;
        conversions?: number;
    }): Promise<MarketingCampaign>;
    /**
     * Delete campaign
     */
    static delete(id: string): Promise<MarketingCampaign>;
    /**
     * Get campaign performance summary
     */
    static getPerformanceSummary(businessId: string): Promise<{
        totalCampaigns: number;
        activeCampaigns: number;
        totalSpent: number;
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        avgCTR: number;
        avgCPC: number;
        avgConversionRate: number;
    }>;
    /**
     * Pause all campaigns for a business
     */
    static pauseAllCampaigns(businessId: string): Promise<number>;
    /**
     * Find campaigns by external platform ID
     */
    static findByExternalId(platform: CampaignPlatform, externalId: string): Promise<MarketingCampaign | null>;
}
