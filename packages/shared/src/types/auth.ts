export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  
  // Subscription info
  stripeCustomerId?: string
  subscriptionStatus?: SubscriptionStatus
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}