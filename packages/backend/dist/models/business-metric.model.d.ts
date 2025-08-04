import { BusinessMetric } from '@prisma/client';
export interface CreateMetricData {
    businessId: string;
    date: Date;
    visitors?: number;
    conversions?: number;
    revenue?: number;
    bounceRate?: number;
    sessionDuration?: number;
    pageViews?: number;
    totalImpressions?: number;
    totalClicks?: number;
    totalSpent?: number;
    newSubscriptions?: number;
    cancelledSubscriptions?: number;
    activeSubscriptions?: number;
}
export interface UpdateMetricData {
    visitors?: number;
    conversions?: number;
    revenue?: number;
    bounceRate?: number;
    sessionDuration?: number;
    pageViews?: number;
    totalImpressions?: number;
    totalClicks?: number;
    totalSpent?: number;
    newSubscriptions?: number;
    cancelledSubscriptions?: number;
    activeSubscriptions?: number;
}
export interface MetricWithBusiness extends BusinessMetric {
    business?: {
        id: string;
        name: string;
        status: string;
    };
}
export interface BusinessMetricSummary {
    totalRevenue: number;
    totalVisitors: number;
    totalConversions: number;
    avgBounceRate: number;
    avgSessionDuration: number;
    totalSubscriptions: number;
    churnRate: number;
    avgRevenuePerUser: number;
    growthRate: number;
}
export declare class BusinessMetricModel {
    /**
     * Create or update metric for a specific date
     * Uses upsert to handle duplicate date entries
     */
    static upsert(data: CreateMetricData): Promise<BusinessMetric>;
    /**
     * Find metric by business ID and date
     */
    static findByBusinessAndDate(businessId: string, date: Date): Promise<BusinessMetric | null>;
    /**
     * Find metrics by business ID with date range
     */
    static findByBusinessIdAndDateRange(businessId: string, startDate: Date, endDate: Date): Promise<BusinessMetric[]>;
    /**
     * Find latest metrics for a business (last N days)
     */
    static findLatestMetrics(businessId: string, days?: number): Promise<BusinessMetric[]>;
    /**
     * Update metric data
     */
    static update(businessId: string, date: Date, data: UpdateMetricData): Promise<BusinessMetric>;
    /**
     * Delete metric
     */
    static delete(businessId: string, date: Date): Promise<BusinessMetric>;
    /**
     * Get business metric summary for date range
     */
    static getBusinessSummary(businessId: string, startDate: Date, endDate: Date): Promise<BusinessMetricSummary>;
    /**
     * Get metrics for all businesses for a specific date
     */
    static getAllBusinessMetricsForDate(date: Date): Promise<MetricWithBusiness[]>;
    /**
     * Get top performing businesses by revenue
     */
    static getTopPerformingBusinesses(days?: number, limit?: number): Promise<Array<{
        businessId: string;
        businessName: string;
        totalRevenue: number;
        totalVisitors: number;
    }>>;
    /**
     * Calculate performance for automated decision making (2-week analysis)
     */
    static calculatePerformanceScore(businessId: string): Promise<{
        score: number;
        metrics: {
            revenueGrowth: number;
            conversionRate: number;
            visitorGrowth: number;
            profitability: number;
        };
        recommendation: 'SCALE' | 'PAUSE' | 'CONTINUE';
    }>;
}
