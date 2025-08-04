export enum CampaignPlatform {
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  INSTAGRAM_ADS = 'INSTAGRAM_ADS',
  LINKEDIN_ADS = 'LINKEDIN_ADS'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface MarketingCampaign {
  id: string
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  
  // External IDs
  googleAdsId?: string
  facebookId?: string
  
  // Dates
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
  
  // Relationships
  businessId: string
}

export interface CampaignConfig {
  name: string
  platform: CampaignPlatform
  budget: number
  targetAudience: {
    demographics: Record<string, any>
    interests: string[]
    behaviors: string[]
  }
  adSets: {
    name: string
    budget: number
    targeting: Record<string, any>
    creatives: {
      headline: string
      description: string
      imageUrl?: string
      callToAction: string
    }[]
  }[]
}

export interface CampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number // Click-through rate
  cpc: number // Cost per click
  cpa: number // Cost per acquisition
  roas: number // Return on ad spend
}

export interface OptimizationResult {
  action: 'SCALE' | 'PAUSE' | 'OPTIMIZE' | 'NO_ACTION'
  budgetChange?: number
  targetingChanges?: Record<string, any>
  creativeChanges?: string[]
  reason: string
  confidence: number
}