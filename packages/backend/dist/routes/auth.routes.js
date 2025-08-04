"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const schemas_1 = require("../utils/schemas");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_middleware_1.validateRequest)({ body: schemas_1.userRegistrationSchema }), auth_controller_1.AuthController.register);
router.post('/login', (0, validation_middleware_1.validateRequest)({ body: schemas_1.userLoginSchema }), auth_controller_1.AuthController.login);
// Protected routes (require authentication)
router.get('/profile', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.getProfile);
router.put('/profile', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validateRequest)({ body: schemas_1.userUpdateSchema }), auth_controller_1.AuthController.updateProfile);
router.post('/change-password', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.changePassword);
router.post('/refresh-token', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.refreshToken);
router.delete('/account', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map