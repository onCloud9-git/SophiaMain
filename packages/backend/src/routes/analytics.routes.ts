import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { analyticsService } from '../services'
import { BusinessService } from '../services/business.service'
import { authMiddleware } from '../middlewares'

const router = Router()

// Validation schemas
const DateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const SetupTrackingSchema = z.object({
  businessId: z.string().cuid(),
  websiteUrl: z.string().url()
})

const ConversionEventSchema = z.object({
  businessId: z.string().cuid(),
  eventName: z.string().min(1).max(100),
  value: z.number().optional(),
  metadata: z.any().optional()
})

/**
 * @route POST /api/analytics/setup
 * @desc Setup Google Analytics tracking for a business
 * @access Private
 */
router.post('/setup', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, websiteUrl } = SetupTrackingSchema.parse(req.body)
    
    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    // Check if analytics is already setup
    if (business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is already configured for this business'
      })
    }

    const trackingCode = await analyticsService.setupTracking(businessId, websiteUrl)
    
    res.status(201).json({
      success: true,
      message: 'Analytics tracking setup successfully',
      data: trackingCode
    })

  } catch (error) {
    console.error('Setup tracking error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      })
    }

    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/metrics
 * @desc Get analytics metrics for a business
 * @access Private
 */
router.get('/:businessId/metrics', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params
    const { start, end } = DateRangeSchema.parse(req.query)

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const metrics = await analyticsService.getMetrics(business.analyticsPropertyId, { start, end })
    
    res.json({
      success: true,
      data: {
        businessId,
        dateRange: { start, end },
        metrics
      }
    })

  } catch (error) {
    console.error('Get metrics error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      })
    }

    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/summary
 * @desc Get aggregated analytics summary for a business
 * @access Private
 */
router.get('/:businessId/summary', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params
    const days = parseInt(req.query.days as string) || 30

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const summary = await analyticsService.aggregateMetrics(businessId, days)
    
    res.json({
      success: true,
      data: {
        businessId,
        period: `${days} days`,
        summary
      }
    })

  } catch (error) {
    console.error('Get summary error:', error)
    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/realtime
 * @desc Get real-time analytics metrics
 * @access Private
 */
router.get('/:businessId/realtime', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const realTimeMetrics = await analyticsService.getRealTimeMetrics(business.analyticsPropertyId)
    
    res.json({
      success: true,
      data: {
        businessId,
        realTime: realTimeMetrics,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Get real-time metrics error:', error)
    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/dashboard
 * @desc Get custom dashboard URL for business analytics
 * @access Private
 */
router.get('/:businessId/dashboard', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const dashboard = await analyticsService.createCustomDashboard(businessId)
    
    res.json({
      success: true,
      data: {
        businessId,
        dashboardUrl: dashboard.dashboardUrl
      }
    })

  } catch (error) {
    console.error('Get dashboard error:', error)
    next(error)
  }
})

/**
 * @route POST /api/analytics/track-conversion
 * @desc Track custom conversion event
 * @access Private
 */
router.post('/track-conversion', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, eventName, value, metadata } = ConversionEventSchema.parse(req.body)

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    await analyticsService.trackConversion(businessId, eventName, value)
    
    res.status(201).json({
      success: true,
      message: 'Conversion event tracked successfully',
      data: {
        businessId,
        eventName,
        value,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Track conversion error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      })
    }

    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/conversions
 * @desc Get conversion events for a business
 * @access Private
 */
router.get('/:businessId/conversions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params
    const limit = parseInt(req.query.limit as string) || 100

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    const conversions = await BusinessService.getConversionEvents(businessId, limit)
    
    res.json({
      success: true,
      data: {
        businessId,
        conversions
      }
    })

  } catch (error) {
    console.error('Get conversions error:', error)
    next(error)
  }
})

/**
 * @route POST /api/analytics/:businessId/compare-periods
 * @desc Compare analytics metrics between two periods
 * @access Private
 */
router.post('/:businessId/compare-periods', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params
    const { currentPeriod, previousPeriod } = req.body

    // Validate request body
    if (!currentPeriod?.start || !currentPeriod?.end || !previousPeriod?.start || !previousPeriod?.end) {
      return res.status(400).json({
        success: false,
        message: 'Both currentPeriod and previousPeriod with start/end dates are required'
      })
    }

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const comparison = await analyticsService.comparePeriodsAnalysis(
      businessId, 
      currentPeriod, 
      previousPeriod
    )
    
    res.json({
      success: true,
      data: {
        businessId,
        comparison
      }
    })

  } catch (error) {
    console.error('Compare periods error:', error)
    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/insights
 * @desc Get comprehensive business performance insights
 * @access Private
 */
router.get('/:businessId/insights', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params
    const days = parseInt(req.query.days as string) || 30

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const insights = await analyticsService.getBusinessInsights(businessId, days)
    
    res.json({
      success: true,
      data: {
        businessId,
        period: `${days} days`,
        insights
      }
    })

  } catch (error) {
    console.error('Get insights error:', error)
    next(error)
  }
})

/**
 * @route GET /api/analytics/:businessId/trend/:metric
 * @desc Get trend analysis for a specific metric
 * @access Private
 */
router.get('/:businessId/trend/:metric', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, metric } = req.params
    const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month'

    // Validate metric
    const validMetrics = ['activeUsers', 'conversions', 'revenue', 'bounceRate', 'pageViews']
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: `Invalid metric. Valid options: ${validMetrics.join(', ')}`
      })
    }

    // Verify business ownership
    const business = await BusinessService.getBusinessById(businessId, req.user.id)
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found or access denied' 
      })
    }

    if (!business.analyticsPropertyId) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tracking is not configured for this business'
      })
    }

    const trendAnalysis = await analyticsService.getTrendAnalysis(businessId, metric, period)
    
    res.json({
      success: true,
      data: {
        businessId,
        metric,
        period,
        analysis: trendAnalysis
      }
    })

  } catch (error) {
    console.error('Get trend analysis error:', error)
    next(error)
  }
})

export { router as analyticsRoutes }