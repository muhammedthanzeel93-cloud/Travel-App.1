import { Router } from 'express';
import { SocialController } from './social.controller.js';

const router = Router();

router.get('/feed', SocialController.getFeed);
router.post('/posts/:postId/like', SocialController.toggleLikePost);
router.get('/reels', SocialController.getReels);
router.get('/stories', SocialController.getStories);
router.get('/messages', SocialController.getDirectMessages);

export default router;
