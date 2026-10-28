import { Router } from 'express';
import { AuthController } from './auth.controller.js';

const router = Router();

// Availability check for unique username, email, phone
router.post('/check-availability', AuthController.checkAvailability);

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
router.get('/me', AuthController.getProfile);

export default router;
