import { Router } from 'express';
import { FlightsController } from './flights.controller.js';

const router = Router();

router.get('/search', FlightsController.searchFlights);
router.post('/book', FlightsController.bookFlight);

export default router;
