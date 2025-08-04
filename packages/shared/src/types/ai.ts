export interface MarketAnalysis {
  industry: string
  marketSize: number
  competitorCount: number
  growthRate: number
  barriers: string[]
  opportunities: string[]
  threats: string[]
  recommendation: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
}

export interface BusinessDecision {
  action: 'SCALE' | 'PAUSE' | 'OPTIMIZE' | 'CLOSE' | 'MAINTAIN'
  confidence: number
  reasoning: string
  metrics: {
    revenue: number
    growth: number
    efficiency: number
    market: number
  }
  recommendations: ActionPlan[]
}

export interface ActionPlan {
  type: 'MARKETING' | 'DEVELOPMENT' | 'BUSINESS' | 'FINANCIAL'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  expectedImpact: string
  timeframe: string
  resources: string[]
}

export interface DevelopmentPlan {
  projectId: string
  phases: {
    name: string
    duration: number
    tasks: string[]
    dependencies: string[]
  }[]
  technologies: string[]
  estimatedCompletion: Date
}

export interface ProgressStatus {
  phase: string
  progress: number
  tasksCompleted: number
  totalTasks: number
  currentTask: string
  isComplete: boolean
  hasIssues: boolean
  issues?: string[]
  estimatedCompletion: Date
}

// Job Queue Types
export interface JobData {
  businessId?: string
  userId?: string
  [key: string]: any
}

export interface BusinessCreationJob extends JobData {
  businessId: string
  enableAIResearch: boolean
  businessData: any
}

export interface MonitoringJob extends JobData {
  businessId: string
  url?: string
  checks: ('health' | 'performance' | 'functionality')[]
}

export interface MarketingAutomationJob extends JobData {
  businessIds?: string[]
  action: 'EVALUATE' | 'OPTIMIZE' | 'SCALE' | 'PAUSE'
}