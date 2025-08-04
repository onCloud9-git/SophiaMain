import { z } from 'zod';
export declare const userRegistrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
}>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const userUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatar?: string | undefined;
}, {
    name?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const businessCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    industry: z.ZodString;
    monthlyPrice: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    industry: string;
    monthlyPrice: number;
    currency: string;
}, {
    name: string;
    description: string;
    industry: string;
    monthlyPrice: number;
    currency?: string | undefined;
}>;
export declare const businessUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    monthlyPrice: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    websiteUrl: z.ZodOptional<z.ZodString>;
    repositoryUrl: z.ZodOptional<z.ZodString>;
    landingPageUrl: z.ZodOptional<z.ZodString>;
    analyticsId: z.ZodOptional<z.ZodString>;
    stripeProductId: z.ZodOptional<z.ZodString>;
    stripePriceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    industry?: string | undefined;
    monthlyPrice?: number | undefined;
    currency?: string | undefined;
    websiteUrl?: string | undefined;
    repositoryUrl?: string | undefined;
    landingPageUrl?: string | undefined;
    analyticsId?: string | undefined;
    stripeProductId?: string | undefined;
    stripePriceId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    industry?: string | undefined;
    monthlyPrice?: number | undefined;
    currency?: string | undefined;
    websiteUrl?: string | undefined;
    repositoryUrl?: string | undefined;
    landingPageUrl?: string | undefined;
    analyticsId?: string | undefined;
    stripeProductId?: string | undefined;
    stripePriceId?: string | undefined;
}>;
export declare const campaignCreateSchema: z.ZodObject<{
    name: z.ZodString;
    platform: z.ZodEnum<["GOOGLE_ADS", "FACEBOOK_ADS", "INSTAGRAM_ADS", "LINKEDIN_ADS"]>;
    budget: z.ZodNumber;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    targetKeywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    audienceData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    platform: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS";
    budget: number;
    startDate: string;
    endDate?: string | undefined;
    targetKeywords?: string[] | undefined;
    audienceData?: Record<string, any> | undefined;
}, {
    name: string;
    platform: "GOOGLE_ADS" | "FACEBOOK_ADS" | "INSTAGRAM_ADS" | "LINKEDIN_ADS";
    budget: number;
    startDate: string;
    endDate?: string | undefined;
    targetKeywords?: string[] | undefined;
    audienceData?: Record<string, any> | undefined;
}>;
export declare const campaignUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "FAILED"]>>;
    budget: z.ZodOptional<z.ZodNumber>;
    endDate: z.ZodOptional<z.ZodString>;
    targetKeywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    audienceData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED" | undefined;
    name?: string | undefined;
    budget?: number | undefined;
    endDate?: string | undefined;
    targetKeywords?: string[] | undefined;
    audienceData?: Record<string, any> | undefined;
}, {
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED" | undefined;
    name?: string | undefined;
    budget?: number | undefined;
    endDate?: string | undefined;
    targetKeywords?: string[] | undefined;
    audienceData?: Record<string, any> | undefined;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const dateRangeQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const metricCreateSchema: z.ZodObject<{
    date: z.ZodString;
    visitors: z.ZodDefault<z.ZodNumber>;
    conversions: z.ZodDefault<z.ZodNumber>;
    revenue: z.ZodDefault<z.ZodNumber>;
    bounceRate: z.ZodOptional<z.ZodNumber>;
    sessionDuration: z.ZodOptional<z.ZodNumber>;
    pageViews: z.ZodDefault<z.ZodNumber>;
    totalImpressions: z.ZodDefault<z.ZodNumber>;
    totalClicks: z.ZodDefault<z.ZodNumber>;
    totalSpent: z.ZodDefault<z.ZodNumber>;
    newSubscriptions: z.ZodDefault<z.ZodNumber>;
    cancelledSubscriptions: z.ZodDefault<z.ZodNumber>;
    activeSubscriptions: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    date: string;
    visitors: number;
    conversions: number;
    revenue: number;
    pageViews: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpent: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    activeSubscriptions: number;
    bounceRate?: number | undefined;
    sessionDuration?: number | undefined;
}, {
    date: string;
    visitors?: number | undefined;
    conversions?: number | undefined;
    revenue?: number | undefined;
    bounceRate?: number | undefined;
    sessionDuration?: number | undefined;
    pageViews?: number | undefined;
    totalImpressions?: number | undefined;
    totalClicks?: number | undefined;
    totalSpent?: number | undefined;
    newSubscriptions?: number | undefined;
    cancelledSubscriptions?: number | undefined;
    activeSubscriptions?: number | undefined;
}>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
export type MetricCreateInput = z.infer<typeof metricCreateSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
