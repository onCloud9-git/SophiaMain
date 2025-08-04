import { Router } from 'express'
import { BusinessController } from '../controllers'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validation.middleware'
import { 
  businessCreateSchema, 
  businessUpdateSchema, 
  idParamSchema,
  paginationQuerySchema
} from '../utils/schemas'

const router: Router = Router()

// All business routes require authentication
router.use(authMiddleware)

/**
 * GET /api/businesses
 * Get all businesses for authenticated user with pagination
 */
router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  BusinessController.getAll
)

/**
 * POST /api/businesses
 * Create a new business
 */
router.post(
  '/',
  validateRequest({ body: businessCreateSchema }),
  BusinessController.create
)

/**
 * GET /api/businesses/search
 * Search businesses by query
 */
router.get(
  '/search',
  BusinessController.search
)

/**
 * GET /api/businesses/statistics
 * Get business statistics for authenticated user
 */
router.get(
  '/statistics',
  BusinessController.getStatistics
)

/**
 * GET /api/businesses/active
 * Get active businesses (for monitoring/admin)
 */
router.get(
  '/active',
  BusinessController.getActive
)

/**
 * GET /api/businesses/status/:status
 * Get businesses by status
 */
router.get(
  '/status/:status',
  BusinessController.getByStatus
)

/**
 * GET /api/businesses/:id
 * Get business by ID
 */
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  BusinessController.getById
)

/**
 * GET /api/businesses/:id/details
 * Get business with full details (including relations)
 */
router.get(
  '/:id/details',
  validateRequest({ params: idParamSchema }),
  BusinessController.getDetails
)

/**
 * PUT /api/businesses/:id
 * Update business
 */
router.put(
  '/:id',
  validateRequest({ 
    params: idParamSchema,
    body: businessUpdateSchema 
  }),
  BusinessController.update
)

/**
 * PATCH /api/businesses/:id/status
 * Update business status only
 */
router.patch(
  '/:id/status',
  validateRequest({ params: idParamSchema }),
  BusinessController.updateStatus
)

/**
 * DELETE /api/businesses/:id
 * Delete business
 */
router.delete(
  '/:id',
  validateRequest({ params: idParamSchema }),
  BusinessController.delete
)

export { router as businessRoutes }