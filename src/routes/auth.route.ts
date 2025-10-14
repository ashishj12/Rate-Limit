import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router: Router = Router();
const authController = new AuthController();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
