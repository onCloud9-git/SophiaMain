export enum BusinessStatus {
  PLANNING = 'PLANNING',
  DEVELOPING = 'DEVELOPING',
  DEPLOYING = 'DEPLOYING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED'
}

export interface Business {
  id: string
  name: string
  description: string
  industry: string
  status: BusinessStatus
  createdAt: Date
  updatedAt: Date
  
  // Business Configuration
  websiteUrl?: string
  repositoryUrl?: string
  landingPageUrl?: string
  
  // Financial Data
  monthlyPrice: number
  currency: string
  
  // Analytics & Tracking
  analyticsId?: string
  stripeProductId?: string
  
  // Relationships
  ownerId: string
}

export interface BusinessCreationRequest {
  name: string
  description: string
  industry: string
  monthlyPrice: number
  currency?: string
  enableAIResearch?: boolean
}

export interface BusinessIdea {
  title: string
  description: string
  industry: string
  targetMarket: string
  businessModel: string
  estimatedRevenue: number
  competitionAnalysis: string[]
  marketOpportunity: string
}

export interface BusinessPlan {
  idea: BusinessIdea
  technicalSpecs: {
    technologies: string[]
    features: string[]
    architecture: string
  }
  marketingStrategy: {
    targetAudience: string
    channels: string[]
    budget: number
  }
  financialProjections: {
    monthlyRevenue: number
    costs: number
    profitMargin: number
  }
}