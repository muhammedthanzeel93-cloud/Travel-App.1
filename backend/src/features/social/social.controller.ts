import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { User } from '../auth/user.model.js';
import { DirectMessage, Post, Reel, Story } from './social.model.js';

const mediaUrlIsValid = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
};

const getActor = (req: AuthenticatedRequest) => req.user;

export class SocialController {
  public static async getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const posts = await Post.find({}).populate('userId', 'name username avatarUrl isVerified').sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, count: posts.length, posts: posts.map((post: any) => ({
        _id: post._id.toString(),
        user: {
          name: post.userId?.name || post.userId?.username || 'Community Explorer',
          avatar: post.userId?.avatarUrl || '', handle: '@' + (post.userId?.username || 'traveler')
        },
        images: post.images || [], caption: post.caption || '', locationName: post.locationName || '',
        likesCount: post.likesCount || 0, isLiked: Boolean(req.user && post.likes.some((id: any) => id.toString() === req.user?.id)),
        commentsCount: post.commentsCount || 0,
        comments: (post.comments || []).map((comment: any) => ({
          userName: comment.userName || 'Community Explorer', userAvatar: comment.userAvatar || '',
          text: comment.text, createdAt: comment.createdAt
        })), createdAt: post.createdAt
      })) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load the travel feed.' });
    }
  }

  public static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getActor(req);
      const { images, caption, locationName = '', city = '' } = req.body || {};
      if (!user || !Array.isArray(images) || images.length < 1 || images.length > 10 || !images.every(mediaUrlIsValid) || typeof caption !== 'string' || !caption.trim() || caption.length > 5000) {
        res.status(400).json({ success: false, message: 'Provide one to ten valid image URLs and a caption up to 5000 characters.' });
        return;
      }
      const post = await Post.create({
        userId: user.id, images, caption: caption.trim(),
        locationName: typeof locationName === 'string' ? locationName.trim().slice(0, 160) : '',
        city: typeof city === 'string' ? city.trim().slice(0, 120) : ''
      });
      res.status(201).json({ success: true, postId: post._id.toString() });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to create post.' });
    }
  }

  public static async toggleLikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const postId = req.params.postId;
      if (!userId || !mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'Valid post and account are required.' });
        return;
      }
      const unlike = await Post.updateOne({ _id: postId, likes: userId }, { $pull: { likes: userId }, $inc: { likesCount: -1 } });
      if (!unlike.matchedCount) {
        await Post.updateOne({ _id: postId, likes: { $ne: userId } }, { $addToSet: { likes: userId }, $inc: { likesCount: 1 } });
      }
      const post = await Post.findById(postId).select('likes likesCount');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const isLiked = post.likes.some((id) => id.toString() === userId);
      res.status(200).json({ success: true, postId, isLiked, newLikesCount: post.likesCount });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update like.' });
    }
  }

  public static async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const postId = req.params.postId;
      const text = req.body?.text;
      if (!userId || !mongoose.isValidObjectId(postId) || typeof text !== 'string' || !text.trim() || text.length > 2000) {
        res.status(400).json({ success: false, message: 'A valid post and comment up to 2000 characters are required.' });
        return;
      }
      const user = await User.findById(userId).select('name username avatarUrl');
      if (!user) {
        res.status(401).json({ success: false, message: 'Account is unavailable.' });
        return;
      }
      const post = await Post.findByIdAndUpdate(postId, {
        $push: { comments: { userId, userName: user.name || user.username, userAvatar: user.avatarUrl || '', text: text.trim() } },
        $inc: { commentsCount: 1 }
      }, { new: true }).select('commentsCount');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      res.status(201).json({ success: true, commentsCount: post.commentsCount });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to add comment.' });
    }
  }

  public static async toggleSavePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const postId = req.params.postId;
      if (!userId || !mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'Valid post and account are required.' });
        return;
      }
      const removed = await Post.updateOne({ _id: postId, savedBy: userId }, { $pull: { savedBy: userId } });
      if (!removed.matchedCount) await Post.updateOne({ _id: postId }, { $addToSet: { savedBy: userId } });
      const post = await Post.findById(postId).select('savedBy');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      res.status(200).json({ success: true, isSaved: post.savedBy.some((id) => id.toString() === userId) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update saved post.' });
    }
  }

  public static async getReels(_req: Request, res: Response): Promise<void> {
    try {
      const reels = await Reel.find({}).populate('userId', 'name username avatarUrl').sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, count: reels.length, reels: reels.map((reel: any) => ({
        _id: reel._id.toString(), videoUrl: reel.videoUrl, thumbnailUrl: reel.thumbnailUrl,
        caption: reel.caption, user: { name: reel.userId?.name || reel.userId?.username || 'Explorer', handle: '@' + (reel.userId?.username || 'traveler'), avatar: reel.userId?.avatarUrl || '' },
        audioTrack: reel.audioTrackName, location: reel.locationName, likesCount: reel.likesCount,
        commentsCount: reel.commentsCount, sharesCount: reel.sharesCount
      })) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load reels.' });
    }
  }

  public static async createReel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const { videoUrl, thumbnailUrl, caption, audioTrackName = '', locationName = '' } = req.body || {};
      if (!userId || !mediaUrlIsValid(videoUrl) || !mediaUrlIsValid(thumbnailUrl) || typeof caption !== 'string' || !caption.trim() || caption.length > 5000) {
        res.status(400).json({ success: false, message: 'Valid media URLs and a caption up to 5000 characters are required.' });
        return;
      }
      const reel = await Reel.create({ userId, videoUrl, thumbnailUrl, caption: caption.trim(), audioTrackName: String(audioTrackName).slice(0, 160), locationName: String(locationName).slice(0, 160) });
      res.status(201).json({ success: true, reelId: reel._id.toString() });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to create reel.' });
    }
  }

  public static async getStories(_req: Request, res: Response): Promise<void> {
    try {
      const stories = await Story.find({ expiresAt: { $gt: new Date() } }).populate('userId', 'name username avatarUrl').sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, stories: stories.map((story: any) => ({
        _id: story._id.toString(), user: { name: story.userId?.name || story.userId?.username || 'Explorer', avatar: story.userId?.avatarUrl || '', hasUnseenStory: true },
        mediaUrl: story.mediaUrl, poll: story.pollSticker, qaPrompt: story.qaSticker?.prompt, expiresAt: story.expiresAt
      })) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load stories.' });
    }
  }

  public static async createStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const { mediaUrl, mediaType = 'IMAGE', caption, locationName } = req.body || {};
      if (!userId || !mediaUrlIsValid(mediaUrl) || !['IMAGE', 'VIDEO'].includes(mediaType) || (caption && (typeof caption !== 'string' || caption.length > 2000))) {
        res.status(400).json({ success: false, message: 'Valid story media and optional caption are required.' });
        return;
      }
      const story = await Story.create({ userId, mediaUrl, mediaType, caption, locationName: typeof locationName === 'string' ? locationName.slice(0, 160) : undefined });
      res.status(201).json({ success: true, storyId: story._id.toString(), expiresAt: story.expiresAt });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to create story.' });
    }
  }

  public static async voteStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const storyId = req.params.storyId;
      const choice = req.body?.choice;
      if (!userId || !mongoose.isValidObjectId(storyId) || !['A', 'B'].includes(choice)) {
        res.status(400).json({ success: false, message: 'A valid story and poll choice are required.' });
        return;
      }
      const path = choice === 'A' ? 'pollSticker.optionA.votes' : 'pollSticker.optionB.votes';
      const result = await Story.updateOne({ _id: storyId, expiresAt: { $gt: new Date() }, 'pollSticker.question': { $exists: true }, 'pollSticker.votedUserIds.userId': { $ne: userId } }, {
        $inc: { [path]: 1 }, $push: { 'pollSticker.votedUserIds': { userId, choice } }
      });
      if (!result.modifiedCount) {
        res.status(409).json({ success: false, message: 'Poll is unavailable or you have already voted.' });
        return;
      }
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to record poll vote.' });
    }
  }

  public static async answerStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      const storyId = req.params.storyId;
      const responseText = req.body?.response;
      if (!userId || !mongoose.isValidObjectId(storyId) || typeof responseText !== 'string' || !responseText.trim() || responseText.length > 2000) {
        res.status(400).json({ success: false, message: 'A valid response up to 2000 characters is required.' });
        return;
      }
      const story = await Story.findOneAndUpdate({ _id: storyId, expiresAt: { $gt: new Date() }, 'qaSticker.prompt': { $exists: true } }, {
        $push: { 'qaSticker.responses': { userId, responseText: responseText.trim() } }
      }, { new: true }).select('_id');
      if (!story) {
        res.status(404).json({ success: false, message: 'Question sticker not found.' });
        return;
      }
      res.status(201).json({ success: true });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to submit story response.' });
    }
  }

  public static async getDirectMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = getActor(req)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Sign in required.' });
        return;
      }
      const messages = await DirectMessage.find({ $or: [{ senderId: userId }, { recipientId: userId }] })
        .populate('senderId', 'name username avatarUrl').sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, messages: messages.map((message: any) => ({
        _id: message._id.toString(), senderId: message.senderId?._id?.toString(),
        sender: { name: message.senderId?.name || message.senderId?.username || 'Traveler', avatar: message.senderId?.avatarUrl || '' },
        messageType: message.messageType, text: message.text, audioVoiceNote: message.audioVoiceNote,
        stayShare: message.stayShare, isRead: message.isRead, createdAt: message.createdAt
      })) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load messages.' });
    }
  }

  public static async sendDirectMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const senderId = getActor(req)?.id;
      const recipientId = String(req.body?.recipientId || '');
      const text = req.body?.text;
      if (!senderId || !mongoose.isValidObjectId(recipientId) || recipientId === senderId || typeof text !== 'string' || !text.trim() || text.length > 5000) {
        res.status(400).json({ success: false, message: 'A recipient and message up to 5000 characters are required.' });
        return;
      }
      if (!(await User.exists({ _id: recipientId, status: 'ACTIVE' }))) {
        res.status(404).json({ success: false, message: 'Recipient not found.' });
        return;
      }
      const message = await DirectMessage.create({ senderId, recipientId, messageType: 'TEXT', text: text.trim() });
      res.status(201).json({ success: true, messageId: message._id.toString() });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to send message.' });
    }
  }
}
