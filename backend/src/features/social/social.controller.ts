import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { User } from '../auth/user.model.js';
import { DirectMessage, Post, PostComment, PostReaction, Reel, Story, StoryResponse } from './social.model.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 30;
const MAX_COMMENTS_PER_POST = 1000;
const MAX_QA_RESPONSES_PER_STORY = 5000;

function pageSizeFrom(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
}

function encodeCursor(date: Date, id: mongoose.Types.ObjectId): string {
  return Buffer.from(`${date.toISOString()}|${id.toString()}`).toString('base64url');
}

function decodeCursor(value: unknown): { date: Date; id: mongoose.Types.ObjectId } | null {
  if (typeof value !== 'string' || value.length > 128) return null;
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const separator = decoded.lastIndexOf('|');
    const date = new Date(decoded.slice(0, separator));
    const id = decoded.slice(separator + 1);
    if (separator < 0 || Number.isNaN(date.getTime()) || !mongoose.isValidObjectId(id)) return null;
    return { date, id: new mongoose.Types.ObjectId(id) };
  } catch { return null; }
}

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
      const limit = pageSizeFrom(req.query.limit);
      const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;
      if (req.query.cursor && !cursor) {
        res.status(400).json({ success: false, message: 'Invalid feed cursor.' });
        return;
      }
      const filter: any = {};
      if (cursor) filter.$or = [
        { createdAt: { $lt: cursor.date } },
        { createdAt: cursor.date, _id: { $lt: cursor.id } }
      ];
      const queried = await Post.find(filter)
        .select('userId images caption locationName commentsCount createdAt')
        .populate('userId', 'name username avatarUrl isVerified')
        .sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
      const hasMore = queried.length > limit;
      const posts = queried.slice(0, limit);
      const postIds = posts.map((post: any) => post._id);
      const [reactionCounts, likedIds] = await Promise.all([
        PostReaction.aggregate([{ $match: { postId: { $in: postIds }, type: 'LIKE' } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
        req.user ? PostReaction.find({ postId: { $in: postIds }, userId: req.user.id, type: 'LIKE' }).select('postId').lean() : Promise.resolve([])
      ]);
      const counts = new Map(reactionCounts.map((item: any) => [item._id.toString(), item.count]));
      const liked = new Set(likedIds.map((item: any) => item.postId.toString()));
      const lastPost: any = posts[posts.length - 1];
      res.status(200).json({ success: true, count: posts.length, nextCursor: hasMore && lastPost ? encodeCursor(lastPost.createdAt, lastPost._id) : null, posts: posts.map((post: any) => ({
        _id: post._id.toString(),
        user: {
          name: post.userId?.name || post.userId?.username || 'Community Explorer',
          avatar: post.userId?.avatarUrl || '', handle: '@' + (post.userId?.username || 'traveler')
        },
        images: post.images || [], caption: post.caption || '', locationName: post.locationName || '',
        likesCount: counts.get(post._id.toString()) || 0, isLiked: liked.has(post._id.toString()),
        commentsCount: post.commentsCount || 0, comments: [], createdAt: post.createdAt
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
      const liked = req.body?.liked;
      if (typeof liked !== 'boolean') {
        res.status(400).json({ success: false, message: 'A liked boolean is required.' });
        return;
      }
      const post = await Post.exists({ _id: postId });
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const filter = { postId: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId), type: 'LIKE' as const };
      if (liked) {
        try {
          await PostReaction.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
        } catch (error: any) {
          if (error?.code !== 11000) throw error;
        }
      } else {
        await PostReaction.deleteOne(filter);
      }
      const newLikesCount = await PostReaction.countDocuments({ postId, type: 'LIKE' });
      res.status(200).json({ success: true, postId, isLiked: liked, newLikesCount });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update like.' });
    }
  }

  public static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'A valid post ID is required.' });
        return;
      }
      const limit = pageSizeFrom(req.query.limit);
      const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;
      if (req.query.cursor && !cursor) {
        res.status(400).json({ success: false, message: 'Invalid comments cursor.' });
        return;
      }
      const postExists = await Post.exists({ _id: postId });
      if (!postExists) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const filter: any = { postId };
      if (cursor) filter.$or = [
        { createdAt: { $lt: cursor.date } },
        { createdAt: cursor.date, _id: { $lt: cursor.id } }
      ];
      const queried = await PostComment.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
      const hasMore = queried.length > limit;
      const comments = queried.slice(0, limit);
      const last = comments[comments.length - 1];
      res.status(200).json({
        success: true,
        comments: comments.map((comment: any) => ({
          id: comment._id.toString(), userName: comment.userName, userAvatar: comment.userAvatar,
          text: comment.text, createdAt: comment.createdAt
        })),
        nextCursor: hasMore && last ? encodeCursor(last.createdAt, last._id) : null
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load comments.' });
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
      const reservation = await Post.updateOne({ _id: postId, commentsCount: { $lt: MAX_COMMENTS_PER_POST } }, { $inc: { commentsCount: 1 } });
      if (!reservation.matchedCount) {
        const exists = await Post.exists({ _id: postId });
        if (!exists) {
          res.status(404).json({ success: false, message: 'Post not found.' });
          return;
        }
        res.status(409).json({ success: false, message: 'This post has reached its comment limit.' });
        return;
      }
      try {
        await PostComment.create({ postId, userId, userName: user.name || user.username, userAvatar: user.avatarUrl || '', text: text.trim() });
      } catch (error) {
        await Post.updateOne({ _id: postId, commentsCount: { $gt: 0 } }, { $inc: { commentsCount: -1 } });
        throw error;
      }
      const post = await Post.findById(postId).select('commentsCount').lean();
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
      const saved = req.body?.saved;
      if (typeof saved !== 'boolean') {
        res.status(400).json({ success: false, message: 'A saved boolean is required.' });
        return;
      }
      const post = await Post.findById(postId).select('_id');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const filter = { postId: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId), type: 'SAVE' as const };
      if (saved) {
        try { await PostReaction.updateOne(filter, { $setOnInsert: filter }, { upsert: true }); }
        catch (error: any) { if (error?.code !== 11000) throw error; }
      } else await PostReaction.deleteOne(filter);
      res.status(200).json({ success: true, isSaved: saved });
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
        mediaUrl: story.mediaUrl,
        poll: story.pollSticker ? {
          question: story.pollSticker.question,
          optionA: { text: story.pollSticker.optionA?.text || '', votes: story.pollSticker.optionA?.votes || 0 },
          optionB: { text: story.pollSticker.optionB?.text || '', votes: story.pollSticker.optionB?.votes || 0 }
        } : undefined,
        qaPrompt: story.qaSticker?.prompt, expiresAt: story.expiresAt
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
      const story = await Story.findOne({ _id: storyId, expiresAt: { $gt: new Date() }, 'pollSticker.question': { $exists: true } }).select('expiresAt');
      if (!story) {
        res.status(409).json({ success: false, message: 'Poll is unavailable or you have already voted.' });
        return;
      }
      try {
        await StoryResponse.create({ storyId, userId, kind: 'POLL_VOTE', choice, sourceKey: `poll:${storyId}:${userId}`, expiresAt: story.expiresAt });
      } catch (error: any) {
        if (error?.code === 11000) {
          res.status(409).json({ success: false, message: 'Poll is unavailable or you have already voted.' });
          return;
        }
        throw error;
      }
      const path = choice === 'A' ? 'pollSticker.optionA.votes' : 'pollSticker.optionB.votes';
      const updated = await Story.updateOne({ _id: storyId, expiresAt: { $gt: new Date() }, 'pollSticker.question': { $exists: true } }, { $inc: { [path]: 1 } });
      if (!updated.modifiedCount) {
        await StoryResponse.deleteOne({ storyId, userId, kind: 'POLL_VOTE' }).catch(() => undefined);
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
      const story = await Story.findOneAndUpdate({ _id: storyId, expiresAt: { $gt: new Date() }, 'qaSticker.prompt': { $exists: true }, qaResponseCount: { $lt: MAX_QA_RESPONSES_PER_STORY } }, {
        $inc: { qaResponseCount: 1 }
      }, { new: true }).select('expiresAt');
      if (!story) {
        res.status(404).json({ success: false, message: 'Question sticker not found.' });
        return;
      }
      try {
        await StoryResponse.create({
          storyId, userId, kind: 'QA_ANSWER', responseText: responseText.trim(),
          sourceKey: `qa:${new mongoose.Types.ObjectId().toString()}`, expiresAt: story.expiresAt
        });
      } catch {
        await Story.updateOne({ _id: storyId, qaResponseCount: { $gt: 0 } }, { $inc: { qaResponseCount: -1 } });
        res.status(500).json({ success: false, message: 'Unable to submit story response.' });
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
