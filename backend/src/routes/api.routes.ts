import { Router } from 'express';
import adminRoutes from '../features/admin-operations/adminOperations.routes.js';
import flightsRoutes from '../features/flights/flights.routes.js';
import trainsRoutes from '../features/trains/trains.routes.js';
import vaultRoutes from '../features/vault/vault.routes.js';
import customizerRoutes from '../features/customizer/customizer.routes.js';
import socialRoutes from '../features/social/social.routes.js';
import staysRoutes from '../features/stays/stays.routes.js';

const router = Router();

// Feature-Based Route Slices
router.use('/admin', adminRoutes);
router.use('/ticketing/flights', flightsRoutes);
router.use('/ticketing/trains', trainsRoutes);
router.use('/vault', vaultRoutes);
router.use('/customizer', customizerRoutes);
router.use('/social', socialRoutes);
router.use('/stays', staysRoutes);

export default router;
