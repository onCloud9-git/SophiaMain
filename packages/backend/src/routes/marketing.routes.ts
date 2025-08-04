import { Router, Request, Response } from 'express'
import { marketingService } from '../services/marketing.service'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validation.middleware'
import { z } from 'zod'
import { logger } from '../index'

const router = Router()

// Validation schemas
const createCampaignSchema = z.object({
  businessId: z.string().cuid(),
  campaignType: z.enum(['google_ads', 'facebook_ads', 'instagram_ads']).optional().default('google_ads'),
  budget: z.number().min(10).max(10000).optional().default(100),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional()
})

const optimizeCampaignSchema = z.object({
  campaignId: z.string().cuid()
})

const scaleCampaignSchema = z.object({
  campaignId: z.string().cuid(),
  factor: z.number().min(0.1).max(5.0)
})

/**
 * GET /api/marketing/campaigns/:businessId
 * Get all campaigns for a business
 */
router.get('/campaigns/:businessId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params

    const campaigns = await marketingService.getCampaignsByBusiness(businessId)

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    })

  } catch (error) {
    logger.error('Error fetching campaigns:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/marketing/campaigns/create
 * Create automated campaigns for a business
 */
router.post('/campaigns/create', 
  authMiddleware, 
  validateRequest(createCampaignSchema), 
  async (req: Request, res: Response) => {
    try {
      const { businessId } = req.body

      const campaigns = await marketingService.createAutomatedCampaigns(businessId)

      res.status(201).json({
        success: true,
        data: campaigns,
        message: `Created ${campaigns.length} automated campaigns`
      })

    } catch (error) {
      logger.error('Error creating campaigns:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * GET /api/marketing/campaigns/:campaignId/analysis
 * Get campaign performance analysis
 */
router.get('/campaigns/:campaignId/analysis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params
    const { window } = req.query

    const analysisWindow = window ? parseInt(window as string) : 14

    const analysis = await marketingService.analyzeCampaignPerformance(campaignId, analysisWindow)

    res.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    logger.error('Error analyzing campaign:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/marketing/campaigns/optimize
 * Optimize campaign based on performance analysis
 */
router.post('/campaigns/optimize', 
  authMiddleware, 
  validateRequest(optimizeCampaignSchema), 
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.body

      const optimization = await marketingService.optimizeCampaign(campaignId)

      res.json({
        success: true,
        data: optimization,
        message: `Campaign optimized with ${optimization.optimizations.length} actions`
      })

    } catch (error) {
      logger.error('Error optimizing campaign:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * POST /api/marketing/campaigns/scale
 * Scale campaign budget by factor
 */
router.post('/campaigns/scale', 
  authMiddleware, 
  validateRequest(scaleCampaignSchema), 
  async (req: Request, res: Response) => {
    try {
      const { campaignId, factor } = req.body

      await marketingService.scaleCampaign(campaignId, factor)

      res.json({
        success: true,
        message: `Campaign budget scaled by ${factor}x`
      })

    } catch (error) {
      logger.error('Error scaling campaign:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * POST /api/marketing/campaigns/:campaignId/pause
 * Pause a campaign
 */
router.post('/campaigns/:campaignId/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params

    await marketingService.pauseCampaign(campaignId)

    res.json({
      success: true,
      message: 'Campaign paused successfully'
    })

  } catch (error) {
    logger.error('Error pausing campaign:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/marketing/campaigns/:campaignId/resume
 * Resume a paused campaign
 */
router.post('/campaigns/:campaignId/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params

    await marketingService.resumeCampaign(campaignId)

    res.json({
      success: true,
      message: 'Campaign resumed successfully'
    })

  } catch (error) {
    logger.error('Error resuming campaign:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/marketing/campaigns/pause-all
 * Pause all campaigns for a business
 */
router.post('/campaigns/pause-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.body

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID is required'
      })
    }

    const pausedCount = await marketingService.pauseAllCampaigns(businessId)

    res.json({
      success: true,
      message: `Paused ${pausedCount} campaigns`,
      data: { pausedCount }
    })

  } catch (error) {
    logger.error('Error pausing all campaigns:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export { router as marketingRoutes }