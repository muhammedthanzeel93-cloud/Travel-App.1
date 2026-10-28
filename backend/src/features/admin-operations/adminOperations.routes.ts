import { Router } from 'express';
import { AdminOperationsController } from './adminOperations.controller.js';

const router = Router();

// Admin Authentication & 2FA Email OTP Verification
router.post('/login', AdminOperationsController.loginAdmin);
router.post('/login/validate', AdminOperationsController.validateAdminCredentials);
router.post('/login/verify-otp', AdminOperationsController.verifyAdminOtp);
router.get('/verify', AdminOperationsController.verifyAdminToken);
router.post('/logout', AdminOperationsController.logoutAdmin);

// Platform & Stays Operations Desk
router.get('/operations/stays-queue', AdminOperationsController.getStaysDeskQueue);
router.get('/rooms/dashboard-stats', AdminOperationsController.getRoomDashboardStats);
router.put('/rooms/hotels/:hotelId/status', AdminOperationsController.updateHotelStatus);
router.put('/rooms/rooms/:roomId/review-highlight', AdminOperationsController.reviewRoomHighlightPhoto);

export default router;
