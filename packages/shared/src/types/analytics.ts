export interface BusinessMetric {
  id: string
  date: Date
  visitors: number
  conversions: number
  revenue: number
  
  // Analytics Data
  bounceRate?: number
  sessionDuration?: number
  pageViews: number
  
  // Business Performance
  businessId: string
}

export interface AnalyticsData {
  metrics: {
    activeUsers: number
    conversions: number
    totalRevenue: number
    bounceRate: number
  }
  dimensions: {
    date: string
    [key: string]: string | number
  }[]
}

export interface DateRange {
  start: string
  end: string
}

export interface TrackingCode {
  googleAnalyticsId: string
  trackingScript: string
  customEvents: Record<string, any>
}

export interface DashboardConfig {
  widgets: {
    type: 'metric' | 'chart' | 'table'
    title: string
    config: Record<string, any>
    position: { x: number; y: number; w: number; h: number }
  }[]
  filters: {
    dateRange: DateRange
    segments: string[]
  }
}

export interface PerformanceMetrics {
  responseTime: number
  uptime: number
  errorRate: number
  throughput: number
  timestamp: Date
}

export interface LighthouseReport {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  pwa: number
  metrics: {
    firstContentfulPaint: number
    largestContentfulPaint: number
    speedIndex: number
    cumulativeLayoutShift: number
  }
}