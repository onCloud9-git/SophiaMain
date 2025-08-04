import { Router } from 'express';
import { stripeController } from '../controllers/stripe.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const SetupProductSchema = z.object({
  body: z.object({
    businessId: z.string().min(1, 'Business ID is required'),
  }),
});

const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    businessId: z.string().min(1, 'Business ID is required'),
    successUrl: z.string().url('Invalid success URL').optional(),
    cancelUrl: z.string().url('Invalid cancel URL').optional(),
  }),
});

const BusinessIdParamSchema = z.object({
  params: z.object({
    businessId: z.string().min(1, 'Business ID is required'),
  }),
});

/**
 * POST /api/stripe/setup-product
 * Setup Stripe product and pricing for a business
 * Requires authentication
 */
router.post(
  '/setup-product',
  authMiddleware,
  validateRequest(SetupProductSchema),
  async (req, res) => {
    await stripeController.setupProduct(req, res);
  }
);

/**
 * POST /api/stripe/create-checkout-session
 * Create Stripe checkout session for subscription
 * Requires authentication
 */
router.post(
  '/create-checkout-session',
  authMiddleware,
  validateRequest(CreateCheckoutSessionSchema),
  async (req, res) => {
    await stripeController.createCheckoutSession(req, res);
  }
);

/**
 * GET /api/stripe/subscription/:businessId
 * Get subscription status for a business
 * Requires authentication
 */
router.get(
  '/subscription/:businessId',
  authMiddleware,
  validateRequest(BusinessIdParamSchema),
  async (req, res) => {
    await stripeController.getSubscriptionStatus(req, res);
  }
);

/**
 * DELETE /api/stripe/subscription/:businessId
 * Cancel subscription for a business
 * Requires authentication
 */
router.delete(
  '/subscription/:businessId',
  authMiddleware,
  validateRequest(BusinessIdParamSchema),
  async (req, res) => {
    await stripeController.cancelSubscription(req, res);
  }
);

/**
 * POST /api/stripe/webhooks/:businessId
 * Handle Stripe webhooks
 * No authentication required (verified by Stripe signature)
 * Raw body parser should be used for this endpoint
 */
router.post(
  '/webhooks/:businessId',
  // Note: This endpoint requires raw body parsing
  // Should be configured in main app with express.raw({ type: 'application/json' })
  async (req, res) => {
    await stripeController.handleWebhook(req, res);
  }
);

/**
 * GET /api/stripe/health
 * Health check endpoint for Stripe integration
 */
router.get('/health', async (req, res) => {
  try {
    // Simple health check - could be extended to test Stripe connection
    res.json({
      success: true,
      message: 'Stripe service is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Stripe service health check failed',
      error: error.message,
    });
  }
});

export { router as stripeRoutes };