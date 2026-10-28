import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes.js';
import adminRoutes from '../features/admin-operations/adminOperations.routes.js';
import socialRoutes from '../features/social/social.routes.js';
import staysRoutes from '../features/stays/stays.routes.js';

const router = Router();

// Feature-Based Route Slices
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/social', socialRoutes);
router.use('/stays', staysRoutes);

export default router;
