import { Router } from 'express';
import { SocialController } from './social.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/feed', optionalAuthenticateToken, SocialController.getFeed);
router.get('/posts/:postId/comments', SocialController.getComments);
router.get('/posts/:postId/likes', SocialController.getPostLikes);
router.get('/posts/:postId/reposts', SocialController.getPostReposts);
router.get('/posts/:postId/ratings', SocialController.getPostRatings);
router.post('/posts/:postId/view', SocialController.recordPostView);
router.post('/posts', authenticateToken, SocialController.createPost);
router.post('/posts/:postId/like', authenticateToken, SocialController.toggleLikePost);
router.post('/posts/:postId/repost', authenticateToken, SocialController.toggleRepost);
router.post('/posts/:postId/rate', authenticateToken, SocialController.ratePost);
router.delete('/posts/:postId', authenticateToken, SocialController.deletePost);
router.post('/posts/:postId/comments', authenticateToken, SocialController.addComment);
router.post('/posts/:postId/save', authenticateToken, SocialController.toggleSavePost);
router.get('/reels', SocialController.getReels);
router.post('/reels', authenticateToken, SocialController.createReel);
router.get('/stories', SocialController.getStories);
router.post('/stories', authenticateToken, SocialController.createStory);
router.post('/stories/:storyId/vote', authenticateToken, SocialController.voteStory);
router.post('/stories/:storyId/answers', authenticateToken, SocialController.answerStory);
router.get('/messages', authenticateToken, SocialController.getDirectMessages);
router.post('/messages', authenticateToken, SocialController.sendDirectMessage);

export default router;
