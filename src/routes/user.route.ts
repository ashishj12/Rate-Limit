import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';

const router: Router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile);
router.put('/rate-limit', authenticate, userController.updateRateLimit);
router.get('/logs', authenticate, userController.getApiLogs);
router.get('/stats', authenticate, userController.getStats);
router.get('/test', authenticate, rateLimiter, userController.testEndpoint);

export default router;
