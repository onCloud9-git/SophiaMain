import { testPrisma, createTestUser, cleanupTestData } from './setup'
import { GoogleAnalyticsService } from '../services/analytics.service'
import { BusinessService } from '../services/business.service'
import request from 'supertest'
import { app } from '../index'
import jwt from 'jsonwebtoken'

// Mock Google Analytics API
jest.mock('googleapis', () => ({
  google: {
    analytics: jest.fn(() => ({})),
    analyticsAdmin: jest.fn(() => ({
      properties: {
        create: jest.fn(),
        dataStreams: {
          create: jest.fn()
        }
      }
    })),
    analyticsData: jest.fn(() => ({
      properties: {
        runReport: jest.fn(),
        runRealtimeReport: jest.fn()
      }
    })),
    auth: {
      GoogleAuth: jest.fn(() => ({}))
    },
    options: jest.fn()
  }
}))

describe('Analytics Service', () => {
  let analyticsService: GoogleAnalyticsService
  let testUser: any
  let testBusiness: any
  let authToken: string

  beforeEach(async () => {
    await cleanupTestData()
    
    // Create test user
    const userData = await createTestUser()
    testUser = await testPrisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        name: userData.name
      }
    })

    // Create test business with analytics setup
    testBusiness = await testPrisma.business.create({
      data: {
        name: 'Test Analytics Business',
        description: 'A test business for analytics',
        industry: 'Technology',
        monthlyPrice: 29.99,
        status: 'ACTIVE',
        ownerId: testUser.id,
        analyticsPropertyId: 'test-property-123',
        analyticsMeasurementId: 'G-TEST12345',
        analyticsStreamId: 'test-stream-456'
      }
    })

    // Create auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret'
    )

    analyticsService = new GoogleAnalyticsService()
  })

  describe('Analytics Service Unit Tests', () => {
    
    test('should aggregate metrics correctly', async () => {
      // Create test metrics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      await testPrisma.businessMetric.createMany({
        data: [
          {
            businessId: testBusiness.id,
            date: today,
            visitors: 100,
            conversions: 5,
            revenue: 150.00,
            bounceRate: 45.5,
            sessionDuration: 120,
            pageViews: 250
          },
          {
            businessId: testBusiness.id,
            date: yesterday,
            visitors: 80,
            conversions: 3,
            revenue: 90.00,
            bounceRate: 50.0,
            sessionDuration: 100,
            pageViews: 200
          }
        ]
      })

      const aggregated = await analyticsService.aggregateMetrics(testBusiness.id, 2)

      expect(aggregated.activeUsers).toBe(180) // 100 + 80
      expect(aggregated.conversions).toBe(8) // 5 + 3
      expect(aggregated.totalRevenue).toBe(240) // 150 + 90
      expect(aggregated.pageViews).toBe(450) // 250 + 200
      expect(aggregated.bounceRate).toBe(47.75) // Average: (45.5 + 50) / 2
      expect(aggregated.sessionDuration).toBe(110) // Average: (120 + 100) / 2
    })

    test('should calculate performance score correctly', async () => {
      // Mock data for performance score calculation
      const mockMetrics = {
        date: '2024-01-01',
        activeUsers: 500,
        conversions: 15,
        totalRevenue: 3000,
        bounceRate: 45,
        sessionDuration: 150,
        pageViews: 1000
      }

      // Use private method through any type (for testing purposes)
      const score = (analyticsService as any).calculatePerformanceScore(mockMetrics)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(typeof score).toBe('number')
    })

    test('should determine trends correctly', async () => {
      const service = analyticsService as any

      // Test increasing trend
      const upTrend = service.determineTrend(120, 100) // 20% increase
      expect(upTrend).toBe('up')

      // Test decreasing trend
      const downTrend = service.determineTrend(80, 100) // 20% decrease
      expect(downTrend).toBe('down')

      // Test stable trend
      const stableTrend = service.determineTrend(102, 100) // 2% increase (stable)
      expect(stableTrend).toBe('stable')
    })

    test('should calculate percentage change correctly', async () => {
      const service = analyticsService as any

      const increase = service.calculatePercentageChange(100, 120)
      expect(increase).toBe(20)

      const decrease = service.calculatePercentageChange(100, 80)
      expect(decrease).toBe(-20)

      const noChange = service.calculatePercentageChange(100, 100)
      expect(noChange).toBe(0)

      const fromZero = service.calculatePercentageChange(0, 50)
      expect(fromZero).toBe(100)
    })

    test('should generate insights from trends', async () => {
      const service = analyticsService as any
      
      const trends = {
        activeUsersChange: 25,
        conversionsChange: 20,
        revenueChange: 30,
        bounceRateChange: -5,
        pageViewsChange: 15
      }

      const currentMetrics = {
        bounceRate: 35,
        activeUsers: 500
      }

      const previousMetrics = {
        bounceRate: 40,
        activeUsers: 400
      }

      const insights = service.generateTrendInsights(trends, currentMetrics, previousMetrics)

      expect(Array.isArray(insights)).toBe(true)
      expect(insights.length).toBeGreaterThan(0)
      expect(insights.some((insight: string) => insight.includes('Active users increased'))).toBe(true)
      expect(insights.some((insight: string) => insight.includes('Conversions improved'))).toBe(true)
      expect(insights.some((insight: string) => insight.includes('Revenue grew'))).toBe(true)
    })
  })

  describe('Analytics API Integration Tests', () => {

    test('POST /api/analytics/setup - should setup analytics tracking', async () => {
      // Create business without analytics
      const businessWithoutAnalytics = await testPrisma.business.create({
        data: {
          name: 'Test Business No Analytics',
          description: 'A test business without analytics',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'ACTIVE',
          ownerId: testUser.id
        }
      })

      // Mock Google Analytics API responses
      const mockAnalyticsAdmin = require('googleapis').google.analyticsAdmin()
      mockAnalyticsAdmin.properties.create.mockResolvedValue({
        data: { name: 'properties/test-property-123' }
      })
      mockAnalyticsAdmin.properties.dataStreams.create.mockResolvedValue({
        data: {
          name: 'properties/test-property-123/dataStreams/test-stream-456',
          webStreamData: { measurementId: 'G-TEST12345' }
        }
      })

      const response = await request(app)
        .post('/api/analytics/setup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: businessWithoutAnalytics.id,
          websiteUrl: 'https://test-business.com'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.trackingId).toBeDefined()
      expect(response.body.data.gtmCode).toBeDefined()
      expect(response.body.data.propertyId).toBeDefined()
    })

    test('GET /api/analytics/:businessId/summary - should get analytics summary', async () => {
      // Add some test metrics
      await testPrisma.businessMetric.create({
        data: {
          businessId: testBusiness.id,
          date: new Date(),
          visitors: 100,
          conversions: 5,
          revenue: 150.00,
          bounceRate: 45.5,
          sessionDuration: 120,
          pageViews: 250
        }
      })

      const response = await request(app)
        .get(`/api/analytics/${testBusiness.id}/summary?days=30`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.businessId).toBe(testBusiness.id)
      expect(response.body.data.summary).toBeDefined()
      expect(response.body.data.summary.activeUsers).toBeDefined()
      expect(response.body.data.summary.conversions).toBeDefined()
      expect(response.body.data.summary.totalRevenue).toBeDefined()
    })

    test('GET /api/analytics/:businessId/insights - should get business insights', async () => {
      // Add test metrics for insights
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await testPrisma.businessMetric.createMany({
        data: Array.from({ length: 5 }, (_, i) => {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          
          return {
            businessId: testBusiness.id,
            date,
            visitors: 100 + i * 10,
            conversions: 5 + i,
            revenue: 150.00 + i * 25,
            bounceRate: 45.5 - i * 2,
            sessionDuration: 120 + i * 10,
            pageViews: 250 + i * 20
          }
        })
      })

      const response = await request(app)
        .get(`/api/analytics/${testBusiness.id}/insights?days=30`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.insights).toBeDefined()
      expect(response.body.data.insights.performanceScore).toBeGreaterThanOrEqual(0)
      expect(response.body.data.insights.performanceScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(response.body.data.insights.keyMetrics)).toBe(true)
      expect(Array.isArray(response.body.data.insights.recommendations)).toBe(true)
      expect(Array.isArray(response.body.data.insights.predictions)).toBe(true)
    })

    test('POST /api/analytics/:businessId/compare-periods - should compare periods', async () => {
      // Add test metrics for two periods
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const currentPeriodData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        return {
          businessId: testBusiness.id,
          date,
          visitors: 120 + i * 5,
          conversions: 6 + i,
          revenue: 200.00 + i * 30,
          bounceRate: 40.0,
          sessionDuration: 130,
          pageViews: 300 + i * 15
        }
      })

      const previousPeriodData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - 7 - i)
        
        return {
          businessId: testBusiness.id,
          date,
          visitors: 100 + i * 3,
          conversions: 4 + i,
          revenue: 150.00 + i * 20,
          bounceRate: 50.0,
          sessionDuration: 110,
          pageViews: 250 + i * 10
        }
      })

      await testPrisma.businessMetric.createMany({
        data: [...currentPeriodData, ...previousPeriodData]
      })

      const currentPeriodStart = new Date(today)
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 6)
      
      const previousPeriodStart = new Date(today)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 13)
      
      const previousPeriodEnd = new Date(today)
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7)

      const response = await request(app)
        .post(`/api/analytics/${testBusiness.id}/compare-periods`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPeriod: {
            start: currentPeriodStart.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          },
          previousPeriod: {
            start: previousPeriodStart.toISOString().split('T')[0],
            end: previousPeriodEnd.toISOString().split('T')[0]
          }
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.comparison).toBeDefined()
      expect(response.body.data.comparison.currentPeriod).toBeDefined()
      expect(response.body.data.comparison.previousPeriod).toBeDefined()
      expect(response.body.data.comparison.trends).toBeDefined()
      expect(Array.isArray(response.body.data.comparison.insights)).toBe(true)
    })

    test('GET /api/analytics/:businessId/trend/:metric - should get trend analysis', async () => {
      // Add test metrics for trend analysis
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await testPrisma.businessMetric.createMany({
        data: Array.from({ length: 10 }, (_, i) => {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          
          return {
            businessId: testBusiness.id,
            date,
            visitors: 100 + i * 5, // Increasing trend
            conversions: 5 + Math.floor(i / 2),
            revenue: 150.00 + i * 15,
            bounceRate: 45.0,
            sessionDuration: 120,
            pageViews: 250 + i * 10
          }
        })
      })

      // Mock Google Analytics API for trend analysis
      const mockAnalyticsData = require('googleapis').google.analyticsData()
      mockAnalyticsData.properties.runReport.mockResolvedValue({
        data: {
          rows: Array.from({ length: 10 }, (_, i) => ({
            dimensionValues: [{ value: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }],
            metricValues: [
              { value: String(100 + i * 5) }, // activeUsers
              { value: String(5 + Math.floor(i / 2)) }, // conversions
              { value: String(150 + i * 15) }, // revenue
              { value: '45.0' }, // bounce rate
              { value: '120' }, // session duration
              { value: String(250 + i * 10) } // pageViews
            ]
          }))
        }
      })

      const response = await request(app)
        .get(`/api/analytics/${testBusiness.id}/trend/activeUsers?period=month`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.analysis).toBeDefined()
      expect(response.body.data.analysis.trend).toBeDefined()
      expect(response.body.data.analysis.strength).toBeDefined()
      expect(Array.isArray(response.body.data.analysis.data)).toBe(true)
      expect(response.body.data.analysis.seasonality).toBeDefined()
      expect(response.body.data.analysis.forecast).toBeDefined()
    })

    test('POST /api/analytics/track-conversion - should track conversion event', async () => {
      const response = await request(app)
        .post('/api/analytics/track-conversion')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: testBusiness.id,
          eventName: 'purchase',
          value: 99.99,
          metadata: { productId: 'test-product-123' }
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.eventName).toBe('purchase')
      expect(response.body.data.value).toBe(99.99)

      // Verify conversion was stored in database
      const conversion = await testPrisma.conversionEvent.findFirst({
        where: {
          businessId: testBusiness.id,
          eventName: 'purchase'
        }
      })

      expect(conversion).toBeTruthy()
      expect(conversion?.value?.toNumber()).toBe(99.99)
    })

    test('GET /api/analytics/:businessId/conversions - should get conversion events', async () => {
      // Create test conversion events
      await testPrisma.conversionEvent.createMany({
        data: [
          {
            businessId: testBusiness.id,
            eventName: 'purchase',
            value: 99.99,
            metadata: { productId: 'test-product-1' }
          },
          {
            businessId: testBusiness.id,
            eventName: 'signup',
            value: null,
            metadata: { source: 'organic' }
          }
        ]
      })

      const response = await request(app)
        .get(`/api/analytics/${testBusiness.id}/conversions?limit=10`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.conversions)).toBe(true)
      expect(response.body.data.conversions.length).toBeGreaterThan(0)
    })

    test('should return 404 for non-existent business', async () => {
      const response = await request(app)
        .get('/api/analytics/non-existent-business/summary')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    test('should return 400 for business without analytics setup', async () => {
      // Create business without analytics
      const businessWithoutAnalytics = await testPrisma.business.create({
        data: {
          name: 'Test Business No Analytics',
          description: 'A test business without analytics',
          industry: 'Technology',
          monthlyPrice: 29.99,
          status: 'ACTIVE',
          ownerId: testUser.id
        }
      })

      const response = await request(app)
        .get(`/api/analytics/${businessWithoutAnalytics.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Analytics tracking is not configured')
    })

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/analytics/${testBusiness.id}/summary`)

      expect(response.status).toBe(401)
    })
  })
})