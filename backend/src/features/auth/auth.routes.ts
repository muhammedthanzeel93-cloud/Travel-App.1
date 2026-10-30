import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateToken, requireSuperAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

// Availability check for unique username, email, phone
router.post('/check-availability', AuthController.checkAvailability);

// Check user active/blocked status
router.get('/check-status', AuthController.checkStatus);
router.post('/check-status', AuthController.checkStatus);

// Send OTP via Email or SMS
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP
router.post('/verify-otp', AuthController.verifyOtp);

// Register New User (Requires verified OTP)
router.post('/register', AuthController.register);

// Login (Username/Email/Phone + Password)
router.post('/login', AuthController.login);

// Forgot Password Flow
router.post('/forgot-password/request', AuthController.requestPasswordReset);
router.post('/forgot-password/reset', AuthController.resetPassword);

// Current User Profile
router.get('/me', authenticateToken, AuthController.getProfile);

// User Management (Admin Console - Strictly Protected by Super Admin RBAC)
router.get('/users', authenticateToken, requireSuperAdmin, AuthController.getAllUsers);
router.post('/users/delete', authenticateToken, requireSuperAdmin, AuthController.deleteUser);
router.post('/users/toggle-block', authenticateToken, requireSuperAdmin, AuthController.toggleBlockUser);

export default router;
