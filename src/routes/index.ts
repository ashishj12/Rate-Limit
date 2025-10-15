import { Router } from 'express';
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import adminRoutes from './admin.route.js';

const router:Router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;