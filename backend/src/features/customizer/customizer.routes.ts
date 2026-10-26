import { Router } from 'express';
import { CustomizerController } from './customizer.controller.js';

const router = Router();

router.get('/dubai-10-day', CustomizerController.getDubai10DayItinerary);
router.post('/save', CustomizerController.saveCustomItinerary);

export default router;
