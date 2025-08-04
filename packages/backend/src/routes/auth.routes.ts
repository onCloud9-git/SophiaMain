import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { validateRequest } from '../middlewares/validation.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { 
  userRegistrationSchema, 
  userLoginSchema, 
  userUpdateSchema 
} from '../utils/schemas'

const router: Router = Router()

// Public routes
router.post('/register', 
  validateRequest({ body: userRegistrationSchema }), 
  AuthController.register
)

router.post('/login', 
  validateRequest({ body: userLoginSchema }), 
  AuthController.login
)

// Protected routes (require authentication)
router.get('/profile', 
  authMiddleware, 
  AuthController.getProfile
)

router.put('/profile', 
  authMiddleware,
  validateRequest({ body: userUpdateSchema }), 
  AuthController.updateProfile
)

router.post('/change-password', 
  authMiddleware, 
  AuthController.changePassword
)

router.post('/refresh-token', 
  authMiddleware, 
  AuthController.refreshToken
)

router.delete('/account', 
  authMiddleware, 
  AuthController.deleteAccount
)

export default router