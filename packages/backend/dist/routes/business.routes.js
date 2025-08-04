"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutes = void 0;
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const schemas_1 = require("../utils/schemas");
const router = (0, express_1.Router)();
exports.businessRoutes = router;
// All business routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * GET /api/businesses
 * Get all businesses for authenticated user with pagination
 */
router.get('/', (0, validation_middleware_1.validateRequest)({ query: schemas_1.paginationQuerySchema }), controllers_1.BusinessController.getAll);
/**
 * POST /api/businesses
 * Create a new business
 */
router.post('/', (0, validation_middleware_1.validateRequest)({ body: schemas_1.businessCreateSchema }), controllers_1.BusinessController.create);
/**
 * GET /api/businesses/search
 * Search businesses by query
 */
router.get('/search', controllers_1.BusinessController.search);
/**
 * GET /api/businesses/statistics
 * Get business statistics for authenticated user
 */
router.get('/statistics', controllers_1.BusinessController.getStatistics);
/**
 * GET /api/businesses/active
 * Get active businesses (for monitoring/admin)
 */
router.get('/active', controllers_1.BusinessController.getActive);
/**
 * GET /api/businesses/status/:status
 * Get businesses by status
 */
router.get('/status/:status', controllers_1.BusinessController.getByStatus);
/**
 * GET /api/businesses/:id
 * Get business by ID
 */
router.get('/:id', (0, validation_middleware_1.validateRequest)({ params: schemas_1.idParamSchema }), controllers_1.BusinessController.getById);
/**
 * GET /api/businesses/:id/details
 * Get business with full details (including relations)
 */
router.get('/:id/details', (0, validation_middleware_1.validateRequest)({ params: schemas_1.idParamSchema }), controllers_1.BusinessController.getDetails);
/**
 * PUT /api/businesses/:id
 * Update business
 */
router.put('/:id', (0, validation_middleware_1.validateRequest)({
    params: schemas_1.idParamSchema,
    body: schemas_1.businessUpdateSchema
}), controllers_1.BusinessController.update);
/**
 * PATCH /api/businesses/:id/status
 * Update business status only
 */
router.patch('/:id/status', (0, validation_middleware_1.validateRequest)({ params: schemas_1.idParamSchema }), controllers_1.BusinessController.updateStatus);
/**
 * DELETE /api/businesses/:id
 * Delete business
 */
router.delete('/:id', (0, validation_middleware_1.validateRequest)({ params: schemas_1.idParamSchema }), controllers_1.BusinessController.delete);
//# sourceMappingURL=business.routes.js.map