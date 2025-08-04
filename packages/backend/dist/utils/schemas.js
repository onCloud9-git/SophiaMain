"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricCreateSchema = exports.dateRangeQuerySchema = exports.paginationQuerySchema = exports.idParamSchema = exports.campaignUpdateSchema = exports.campaignCreateSchema = exports.businessUpdateSchema = exports.businessCreateSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.userRegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long').optional()
});
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.userUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    avatar: zod_1.z.string().url('Invalid avatar URL').optional()
});
// Business schemas
exports.businessCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Business name is required').max(100, 'Name too long'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
    industry: zod_1.z.string().min(1, 'Industry is required').max(50, 'Industry name too long'),
    monthlyPrice: zod_1.z.number().min(0.01, 'Monthly price must be greater than 0').max(10000, 'Monthly price too high'),
    currency: zod_1.z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD')
});
exports.businessUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Business name is required').max(100, 'Name too long').optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long').optional(),
    industry: zod_1.z.string().min(1, 'Industry is required').max(50, 'Industry name too long').optional(),
    monthlyPrice: zod_1.z.number().min(0.01, 'Monthly price must be greater than 0').max(10000, 'Monthly price too high').optional(),
    currency: zod_1.z.string().length(3, 'Currency must be 3 characters').optional(),
    websiteUrl: zod_1.z.string().url('Invalid website URL').optional(),
    repositoryUrl: zod_1.z.string().url('Invalid repository URL').optional(),
    landingPageUrl: zod_1.z.string().url('Invalid landing page URL').optional(),
    analyticsId: zod_1.z.string().optional(),
    stripeProductId: zod_1.z.string().optional(),
    stripePriceId: zod_1.z.string().optional()
});
// Campaign schemas
exports.campaignCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Campaign name is required').max(100, 'Name too long'),
    platform: zod_1.z.enum(['GOOGLE_ADS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'LINKEDIN_ADS']),
    budget: zod_1.z.number().min(1, 'Budget must be at least $1').max(100000, 'Budget too high'),
    startDate: zod_1.z.string().datetime('Invalid start date'),
    endDate: zod_1.z.string().datetime('Invalid end date').optional(),
    targetKeywords: zod_1.z.array(zod_1.z.string()).optional(),
    audienceData: zod_1.z.record(zod_1.z.any()).optional()
});
exports.campaignUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Campaign name is required').max(100, 'Name too long').optional(),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
    budget: zod_1.z.number().min(1, 'Budget must be at least $1').max(100000, 'Budget too high').optional(),
    endDate: zod_1.z.string().datetime('Invalid end date').optional(),
    targetKeywords: zod_1.z.array(zod_1.z.string()).optional(),
    audienceData: zod_1.z.record(zod_1.z.any()).optional()
});
// Common parameter schemas
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid('Invalid ID format')
});
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
    limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('10'),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
exports.dateRangeQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime('Invalid start date').optional(),
    endDate: zod_1.z.string().datetime('Invalid end date').optional()
});
// Metrics schemas
exports.metricCreateSchema = zod_1.z.object({
    date: zod_1.z.string().datetime('Invalid date'),
    visitors: zod_1.z.number().min(0, 'Visitors cannot be negative').default(0),
    conversions: zod_1.z.number().min(0, 'Conversions cannot be negative').default(0),
    revenue: zod_1.z.number().min(0, 'Revenue cannot be negative').default(0),
    bounceRate: zod_1.z.number().min(0).max(1, 'Bounce rate must be between 0 and 1').optional(),
    sessionDuration: zod_1.z.number().min(0, 'Session duration cannot be negative').optional(),
    pageViews: zod_1.z.number().min(0, 'Page views cannot be negative').default(0),
    totalImpressions: zod_1.z.number().min(0, 'Impressions cannot be negative').default(0),
    totalClicks: zod_1.z.number().min(0, 'Clicks cannot be negative').default(0),
    totalSpent: zod_1.z.number().min(0, 'Spent amount cannot be negative').default(0),
    newSubscriptions: zod_1.z.number().min(0, 'New subscriptions cannot be negative').default(0),
    cancelledSubscriptions: zod_1.z.number().min(0, 'Cancelled subscriptions cannot be negative').default(0),
    activeSubscriptions: zod_1.z.number().min(0, 'Active subscriptions cannot be negative').default(0)
});
//# sourceMappingURL=schemas.js.map