import { Router } from 'express';
import { TrainsController } from './trains.controller.js';

const router = Router();

router.get('/search', TrainsController.searchTrains);
router.post('/book', TrainsController.bookTrain);

export default router;
