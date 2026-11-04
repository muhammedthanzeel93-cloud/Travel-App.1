import { Router } from 'express';
import { AdminOperationsController } from './adminOperations.controller.js';
import { authenticateToken, requireSuperAdmin } from '../../middlewares/auth.middleware.js';
import { AuthController } from '../auth/auth.controller.js';

const router = Router();

// Admin Authentication & 2FA Email OTP Verification
router.post('/login', AdminOperationsController.validateAdminCredentials);
router.post('/login/validate', AdminOperationsController.validateAdminCredentials);
router.post('/login/verify-otp', AdminOperationsController.verifyAdminOtp);
router.get('/verify', AdminOperationsController.verifyAdminToken);
router.post('/logout', AdminOperationsController.logoutAdmin);
router.get('/active-users', authenticateToken, requireSuperAdmin, AuthController.getActiveUserCount);

export default router;
