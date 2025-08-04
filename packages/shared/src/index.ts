// Business types
export * from './types/business'

// Marketing types  
export * from './types/marketing'

// Analytics types
export * from './types/analytics'

// Authentication types
export * from './types/auth'

// AI and automation types
export * from './types/ai'

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: Date
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface FilterParams {
  [key: string]: string | number | boolean | Date | undefined
}

// Error types
export class SophiaError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'SophiaError'
  }
}

export enum ErrorCodes {
  BUSINESS_CREATION_FAILED = 'BUSINESS_CREATION_FAILED',
  DEVELOPMENT_TIMEOUT = 'DEVELOPMENT_TIMEOUT',
  CAMPAIGN_OPTIMIZATION_FAILED = 'CAMPAIGN_OPTIMIZATION_FAILED',
  ANALYTICS_DATA_UNAVAILABLE = 'ANALYTICS_DATA_UNAVAILABLE',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}