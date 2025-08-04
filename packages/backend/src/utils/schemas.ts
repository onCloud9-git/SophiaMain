import { z } from 'zod'

// User schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional()
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
})

// Business schemas
export const businessCreateSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  industry: z.string().min(1, 'Industry is required').max(50, 'Industry name too long'),
  monthlyPrice: z.number().min(0.01, 'Monthly price must be greater than 0').max(10000, 'Monthly price too high'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD')
})

export const businessUpdateSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Name too long').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long').optional(),
  industry: z.string().min(1, 'Industry is required').max(50, 'Industry name too long').optional(),
  monthlyPrice: z.number().min(0.01, 'Monthly price must be greater than 0').max(10000, 'Monthly price too high').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  repositoryUrl: z.string().url('Invalid repository URL').optional(),
  landingPageUrl: z.string().url('Invalid landing page URL').optional(),
  analyticsId: z.string().optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional()
})

// Campaign schemas
export const campaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name too long'),
  platform: z.enum(['GOOGLE_ADS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'LINKEDIN_ADS']),
  budget: z.number().min(1, 'Budget must be at least $1').max(100000, 'Budget too high'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  targetKeywords: z.array(z.string()).optional(),
  audienceData: z.record(z.any()).optional()
})

export const campaignUpdateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name too long').optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
  budget: z.number().min(1, 'Budget must be at least $1').max(100000, 'Budget too high').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  targetKeywords: z.array(z.string()).optional(),
  audienceData: z.record(z.any()).optional()
})

// Common parameter schemas
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format')
})

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional()
})

// Metrics schemas
export const metricCreateSchema = z.object({
  date: z.string().datetime('Invalid date'),
  visitors: z.number().min(0, 'Visitors cannot be negative').default(0),
  conversions: z.number().min(0, 'Conversions cannot be negative').default(0),
  revenue: z.number().min(0, 'Revenue cannot be negative').default(0),
  bounceRate: z.number().min(0).max(1, 'Bounce rate must be between 0 and 1').optional(),
  sessionDuration: z.number().min(0, 'Session duration cannot be negative').optional(),
  pageViews: z.number().min(0, 'Page views cannot be negative').default(0),
  totalImpressions: z.number().min(0, 'Impressions cannot be negative').default(0),
  totalClicks: z.number().min(0, 'Clicks cannot be negative').default(0),
  totalSpent: z.number().min(0, 'Spent amount cannot be negative').default(0),
  newSubscriptions: z.number().min(0, 'New subscriptions cannot be negative').default(0),
  cancelledSubscriptions: z.number().min(0, 'Cancelled subscriptions cannot be negative').default(0),
  activeSubscriptions: z.number().min(0, 'Active subscriptions cannot be negative').default(0)
})

// Export types for use in controllers
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type BusinessCreateInput = z.infer<typeof businessCreateSchema>
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>
export type MetricCreateInput = z.infer<typeof metricCreateSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>