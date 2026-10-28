import { Router } from 'express';
import { AdminOperationsController } from './adminOperations.controller.js';

const router = Router();

// Admin Authentication Portal
router.post('/login', AdminOperationsController.loginAdmin);
router.post('/login/validate', AdminOperationsController.validateAdminCredentials);
router.post('/login/verify-otp', AdminOperationsController.verifyAdminOtp);
router.get('/verify', AdminOperationsController.verifyAdminToken);
router.post('/logout', AdminOperationsController.logoutAdmin);

// Ticketing Desk Operations
router.get('/operations/ticketing-desk', AdminOperationsController.getTicketingDeskQueue);
router.post('/operations/ticketing-desk/issue-flight/:pnr', AdminOperationsController.issueFlightTicket);
router.post('/operations/ticketing-desk/issue-train/:pnr', AdminOperationsController.issueTrainTicket);

// Flight Operations
router.get('/flights/dashboard-stats', AdminOperationsController.getFlightDashboardStats);
router.get('/flights/bookings', AdminOperationsController.getFlightBookings);
router.post('/flights/disruption/:pnr', AdminOperationsController.broadcastFlightDisruption);

// Train Operations
router.get('/trains/dashboard-stats', AdminOperationsController.getTrainDashboardStats);
router.get('/trains/bookings', AdminOperationsController.getTrainBookings);

// Room Operations
router.get('/rooms/dashboard-stats', AdminOperationsController.getRoomDashboardStats);
router.put('/rooms/hotels/:hotelId/status', AdminOperationsController.updateHotelStatus);
router.put('/rooms/rooms/:roomId/review-highlight', AdminOperationsController.reviewRoomHighlightPhoto);

export default router;
