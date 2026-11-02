import { Router } from 'express';
import { StaysController } from './stays.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/hotels', StaysController.getHotels);
router.post('/book', authenticateToken, StaysController.bookStayPackage);
router.get('/bookings/me', authenticateToken, StaysController.getMyBookings);
router.post('/bookings/:bookingId/cancel', authenticateToken, StaysController.cancelMyBooking);

export default router;
