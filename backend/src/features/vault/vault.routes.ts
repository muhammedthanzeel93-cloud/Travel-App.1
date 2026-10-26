import { Router } from 'express';
import { VaultController } from './vault.controller.js';

const router = Router();

router.get('/my-passes', VaultController.getOfflineVaultPasses);

export default router;
