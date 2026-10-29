import { Router } from 'express';
import { AdminOperationsController } from './adminOperations.controller.js';

const router = Router();

// Admin Authentication & 2FA Email OTP Verification
router.post('/login', AdminOperationsController.loginAdmin);
router.post('/login/validate', AdminOperationsController.validateAdminCredentials);
router.post('/login/verify-otp', AdminOperationsController.verifyAdminOtp);
router.get('/verify', AdminOperationsController.verifyAdminToken);
router.post('/logout', AdminOperationsController.logoutAdmin);

export default router;
