// Job types and interfaces for Bull Queue

export enum JobType {
  // Business creation jobs
  BUSINESS_CREATION = 'business:creation',
  BUSINESS_DEPLOYMENT = 'business:deployment',
  BUSINESS_MONITORING = 'business:monitoring',
  DEVELOPMENT_MONITORING = 'development:monitoring',
  
  // Marketing automation jobs
  MARKETING_CAMPAIGN_CREATE = 'marketing:campaign:create',
  MARKETING_CAMPAIGN_MONITOR = 'marketing:campaign:monitor',
  MARKETING_CAMPAIGN_OPTIMIZE = 'marketing:campaign:optimize',
  
  // Analytics jobs
  ANALYTICS_COLLECT = 'analytics:collect',
  ANALYTICS_PROCESS = 'analytics:process',
  ANALYTICS_REPORT = 'analytics:report',
  
  // Payment jobs
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_RETRY = 'payment:retry',
  PAYMENT_WEBHOOK = 'payment:webhook',
  
  // System jobs
  SYSTEM_CLEANUP = 'system:cleanup',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_HEALTH_CHECK = 'system:health',
  
  // AI jobs
  AI_RESEARCH = 'ai:research',
  AI_DECISION = 'ai:decision',
  AI_OPTIMIZATION = 'ai:optimization',
}

// Job priorities
export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 15,
}

// Job status
export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  STUCK = 'stuck',
}

// Base job data interface
export interface BaseJobData {
  id?: string
  userId?: string
  businessId?: string
  priority?: JobPriority
  attempts?: number
  timestamp?: Date
}

// Business creation job data
export interface BusinessCreationJobData extends BaseJobData {
  businessIdea: string
  aiResearch?: boolean
  userPrompt?: string
  targetMarket?: string
  businessModel?: string
}

// Development monitoring job data
export interface DevelopmentMonitoringJobData extends BaseJobData {
  businessId: string
  monitoringType?: 'progress' | 'testing' | 'deployment'
}

// Marketing campaign job data
export interface MarketingCampaignJobData extends BaseJobData {
  campaignType: 'google_ads' | 'facebook_ads' | 'instagram_ads'
  targetAudience: string
  budget: number
  duration: number
  keywords?: string[]
  demographics?: {
    age?: [number, number]
    gender?: string
    location?: string[]
    interests?: string[]
  }
}

// Analytics job data
export interface AnalyticsJobData extends BaseJobData {
  dataSource: 'google_analytics' | 'stripe' | 'custom'
  dateRange: {
    from: string // ISO date string YYYY-MM-DD
    to: string   // ISO date string YYYY-MM-DD
  }
  metrics: string[]
  reportType?: 'summary' | 'detailed' | 'trend'
}

// Payment job data
export interface PaymentJobData extends BaseJobData {
  paymentIntentId: string
  amount: number
  currency: string
  customerId: string
  subscriptionId?: string
  retryCount?: number
}

// AI job data
export interface AIJobData extends BaseJobData {
  taskType: 'research' | 'decision' | 'optimization' | 'generation'
  context: Record<string, any>
  parameters?: Record<string, any>
  expectedOutput?: string
}

// Job result interface
export interface JobResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    processingTime?: number
    retryCount?: number
    nextRetry?: Date
  }
}

// Job options
export interface JobOptions {
  priority?: JobPriority
  delay?: number
  attempts?: number
  backoff?: {
    type: 'exponential' | 'fixed'
    delay: number
  }
  removeOnComplete?: number
  removeOnFail?: number
  repeat?: {
    cron?: string
    every?: number
  }
}

// Queue configuration
export interface QueueConfig {
  name: string
  concurrency: number
  defaultJobOptions: JobOptions
}