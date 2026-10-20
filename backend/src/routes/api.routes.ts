import { Router } from 'express';
import { AdminOperationsController } from '../controllers/adminOperations.controller.js';
import { TicketingController } from '../controllers/ticketing.controller.js';
import { CustomizerController } from '../controllers/customizer.controller.js';
import { SocialController } from '../controllers/social.controller.js';
import { StaysController } from '../controllers/stays.controller.js';

const router = Router();

// ==================== SUPER ADMIN OPERATIONS DESK ====================
router.get('/admin/operations/ticketing-desk', AdminOperationsController.getTicketingDeskQueue);
router.post('/admin/operations/ticketing-desk/issue-flight/:pnr', AdminOperationsController.issueFlightTicket);
router.post('/admin/operations/ticketing-desk/issue-train/:pnr', AdminOperationsController.issueTrainTicket);

// Multi-Vertical Flight Operations
router.get('/admin/flights/dashboard-stats', AdminOperationsController.getFlightDashboardStats);
router.get('/admin/flights/bookings', AdminOperationsController.getFlightBookings);
router.post('/admin/flights/disruption/:pnr', AdminOperationsController.broadcastFlightDisruption);

// Multi-Vertical Train Operations
router.get('/admin/trains/dashboard-stats', AdminOperationsController.getTrainDashboardStats);
router.get('/admin/trains/bookings', AdminOperationsController.getTrainBookings);

// Multi-Vertical Room Operations
router.get('/admin/rooms/dashboard-stats', AdminOperationsController.getRoomDashboardStats);
router.put('/admin/rooms/hotels/:hotelId/status', AdminOperationsController.updateHotelStatus);
router.put('/admin/rooms/rooms/:roomId/review-highlight', AdminOperationsController.reviewRoomHighlightPhoto);

// ==================== TRAVELER TICKETING & 4H OFFLINE VAULT ====================
router.get('/ticketing/flights/search', TicketingController.searchFlights);
router.post('/ticketing/flights/book', TicketingController.bookFlight);
router.get('/ticketing/trains/search', TicketingController.searchTrains);
router.post('/ticketing/trains/book', TicketingController.bookTrain);
router.get('/vault/my-passes', TicketingController.getOfflineVaultPasses);

// ==================== DYNAMIC VISA & ROAD MAP CUSTOMIZER ====================
router.get('/customizer/dubai-10-day', CustomizerController.getDubai10DayItinerary);
router.post('/customizer/save', CustomizerController.saveCustomItinerary);

// ==================== TRAVEL SOCIAL EXPERIENCE ====================
router.get('/social/feed', SocialController.getFeed);
router.post('/social/posts/:postId/like', SocialController.toggleLikePost);
router.get('/social/reels', SocialController.getReels);
router.get('/social/stories', SocialController.getStories);
router.get('/social/messages', SocialController.getDirectMessages);

// ==================== STAYS & ROOM HIGHLIGHT STUDIO ====================
router.get('/stays/hotels', StaysController.getHotels);
router.post('/stays/book', StaysController.bookStayPackage);

export default router;
