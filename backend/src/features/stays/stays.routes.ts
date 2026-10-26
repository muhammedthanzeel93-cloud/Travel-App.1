import { Router } from 'express';
import { StaysController } from './stays.controller.js';

const router = Router();

router.get('/hotels', StaysController.getHotels);
router.post('/book', StaysController.bookStayPackage);

export default router;
