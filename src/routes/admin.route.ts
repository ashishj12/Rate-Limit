import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
// import { adminRegisterValidator, adminLoginValidator } from '../validators/auth.validator.js';


const router: Router = Router();
const adminController = new AdminController();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.post('/users/:userId/reset-rate-limit', adminController.resetUserRateLimit);

export default router;
