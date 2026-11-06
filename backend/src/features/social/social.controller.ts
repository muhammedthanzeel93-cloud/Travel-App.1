import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { User } from '../auth/user.model.js';
import { DirectMessage, Post, PostComment, PostRating, PostReaction, PostView, Reel, Story, StoryResponse } from './social.model.js';

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
  if (typeof value !== 'string') return false;
  if (value.startsWith('data:image/')) return value.length < 8_000_000;
  if (value.length > 2048) return false;
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
      const type = typeof req.query.type === 'string' ? req.query.type.toLowerCase() : 'all';
      if (req.query.cursor && !cursor) {
        res.status(400).json({ success: false, message: 'Invalid feed cursor.' });
        return;
      }
      const filter: any = {};
      if (type === 'admin') {
        filter.isAdminPost = true;
      } else if (type === 'users' || type === 'user') {
        filter.isAdminPost = { $ne: true };
      }
      if (cursor) filter.$or = [
        { createdAt: { $lt: cursor.date } },
        { createdAt: cursor.date, _id: { $lt: cursor.id } }
      ];
      const queried = await Post.find(filter)
        .select('userId images caption locationName city commentsCount likesCount repostsCount viewsCount ratingSum ratingsCount averageRating isAdminPost createdAt')
        .populate('userId', 'name username avatarUrl role isVerified')
        .sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
      const hasMore = queried.length > limit;
      const posts = queried.slice(0, limit);
      const postIds = posts.map((post: any) => post._id);

      // Record unique views for displayed posts when browsed by registered non-admin travelers
      if (type !== 'admin' && req.user && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && postIds.length > 0) {
        const viewerId = new mongoose.Types.ObjectId(req.user.id);
        const viewOps = postIds.map((pid: any) => ({
          updateOne: {
            filter: { postId: pid, userId: viewerId },
            update: { $setOnInsert: { postId: pid, userId: viewerId, createdAt: new Date() } },
            upsert: true
          }
        }));
        PostView.bulkWrite(viewOps, { ordered: false })
          .then((res) => {
            if (res.upsertedCount > 0) {
              const insertedKeys = Object.values(res.upsertedIds);
              PostView.find({ _id: { $in: insertedKeys } }).select('postId').lean()
                .then((newViews) => {
                  const newPostIds = newViews.map((nv: any) => nv.postId);
                  if (newPostIds.length > 0) {
                    Post.updateMany({ _id: { $in: newPostIds } }, { $inc: { viewsCount: 1 } }).catch(() => {});
                  }
                }).catch(() => {});
            }
          })
          .catch(() => {});
      }

      const [reactionCounts, repostCounts, viewCounts, userReactions, userRatings] = await Promise.all([
        PostReaction.aggregate([{ $match: { postId: { $in: postIds }, type: 'LIKE' } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
        PostReaction.aggregate([{ $match: { postId: { $in: postIds }, type: 'REPOST' } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
        PostView.aggregate([{ $match: { postId: { $in: postIds } } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
        req.user ? PostReaction.find({ postId: { $in: postIds }, userId: req.user.id }).select('postId type').lean() : Promise.resolve([]),
        req.user ? PostRating.find({ postId: { $in: postIds }, userId: req.user.id }).select('postId rating').lean() : Promise.resolve([])
      ]);

      const likeCountMap = new Map(reactionCounts.map((item: any) => [item._id.toString(), item.count]));
      const repostCountMap = new Map(repostCounts.map((item: any) => [item._id.toString(), item.count]));
      const viewCountMap = new Map(viewCounts.map((item: any) => [item._id.toString(), item.count]));
      const likedSet = new Set(userReactions.filter((r: any) => r.type === 'LIKE').map((item: any) => item.postId.toString()));
      const repostedSet = new Set(userReactions.filter((r: any) => r.type === 'REPOST').map((item: any) => item.postId.toString()));
      const ratingMap = new Map(userRatings.map((item: any) => [item.postId.toString(), item.rating]));

      const lastPost: any = posts[posts.length - 1];
      res.status(200).json({
        success: true,
        count: posts.length,
        nextCursor: hasMore && lastPost ? encodeCursor(lastPost.createdAt, lastPost._id) : null,
        posts: posts.map((post: any) => {
          const pid = post._id.toString();
          return {
            _id: pid,
            user: {
              id: post.userId?._id?.toString() || '',
              name: post.userId?.name || post.userId?.username || (post.isAdminPost ? 'Admin Operations Desk' : 'Community Explorer'),
              avatar: post.userId?.avatarUrl || '',
              handle: '@' + (post.userId?.username || 'traveler'),
              role: post.userId?.role || (post.isAdminPost ? 'SUPER_ADMIN' : 'USER'),
              isVerified: Boolean(post.userId?.isVerified)
            },
            images: post.images || [],
            caption: post.caption || '',
            locationName: post.locationName || '',
            city: post.city || '',
            likesCount: likeCountMap.get(pid) ?? (post.likesCount || 0),
            isLiked: likedSet.has(pid),
            repostsCount: repostCountMap.get(pid) ?? (post.repostsCount || 0),
            isReposted: repostedSet.has(pid),
            viewsCount: viewCountMap.get(pid) ?? 0,
            averageRating: post.averageRating || 0,
            ratingsCount: post.ratingsCount || 0,
            userRating: ratingMap.get(pid) || 0,
            isAdminPost: Boolean(post.isAdminPost),
            commentsCount: post.commentsCount || 0,
            comments: [],
            createdAt: post.createdAt
          };
        })
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load the travel feed.' });
    }
  }

  public static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getActor(req);
      const { images, caption, locationName = '', city = '', initialRating } = req.body || {};
      if (!user || !Array.isArray(images) || images.length < 1 || images.length > 10 || !images.every(mediaUrlIsValid) || typeof caption !== 'string' || !caption.trim() || caption.length > 5000) {
        res.status(400).json({ success: false, message: 'Provide one to ten valid image URLs/uploads and a caption up to 5000 characters.' });
        return;
      }
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const cleanLocation = typeof locationName === 'string' ? locationName.trim().slice(0, 160) : '';
      const cleanCity = typeof city === 'string' ? city.trim().slice(0, 120) : '';

      const post = await Post.create({
        userId: user.id,
        images,
        caption: caption.trim(),
        locationName: cleanLocation,
        city: cleanCity,
        isAdminPost: isAdmin
      });

      if (typeof initialRating === 'number' && initialRating >= 1 && initialRating <= 5) {
        const rounded = Math.round(initialRating);
        await PostRating.create({ postId: post._id, userId: user.id, rating: rounded });
        post.ratingSum = rounded;
        post.ratingsCount = 1;
        post.averageRating = rounded;
        await post.save();
      }

      res.status(201).json({ success: true, postId: post._id.toString(), post });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to create post.' });
    }
  }

  public static async toggleLikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const userId = actor?.id;
      const postId = req.params.postId;
      if (actor?.role === 'SUPER_ADMIN' || actor?.role === 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admins have read-only access and cannot like posts.' });
        return;
      }
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
      const queried = await PostComment.find(filter)
        .populate('userId', 'name username avatarUrl role email')
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean();
      const hasMore = queried.length > limit;
      const comments = queried.slice(0, limit);
      const last = comments[comments.length - 1];
      res.status(200).json({
        success: true,
        comments: comments.map((comment: any) => ({
          id: comment._id.toString(),
          userName: comment.userName || comment.userId?.name || 'Traveler',
          userHandle: comment.userId?.username ? `@${comment.userId.username}` : '',
          userAvatar: comment.userAvatar || comment.userId?.avatarUrl || '',
          userRole: comment.userId?.role || 'USER',
          userEmail: comment.userId?.email || '',
          text: comment.text,
          createdAt: comment.createdAt
        })),
        nextCursor: hasMore && last ? encodeCursor(last.createdAt, last._id) : null
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load comments.' });
    }
  }

  public static async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const userId = actor?.id;
      const postId = req.params.postId;
      const text = req.body?.text;
      if (actor?.role === 'SUPER_ADMIN' || actor?.role === 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admins have read-only access and cannot comment on posts.' });
        return;
      }
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

  public static async toggleRepost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const userId = actor?.id;
      const postId = req.params.postId;
      if (actor?.role === 'SUPER_ADMIN' || actor?.role === 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admins have read-only access and cannot repost.' });
        return;
      }
      if (!userId || !mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'Valid post and account are required.' });
        return;
      }
      const reposted = req.body?.reposted;
      if (typeof reposted !== 'boolean') {
        res.status(400).json({ success: false, message: 'A reposted boolean is required.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const filter = { postId: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId), type: 'REPOST' as const };
      if (reposted) {
        try {
          await PostReaction.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
        } catch (error: any) {
          if (error?.code !== 11000) throw error;
        }
      } else {
        await PostReaction.deleteOne(filter);
      }
      const newRepostsCount = await PostReaction.countDocuments({ postId, type: 'REPOST' });
      post.repostsCount = newRepostsCount;
      await post.save();
      res.status(200).json({ success: true, postId, isReposted: reposted, newRepostsCount });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update repost.' });
    }
  }

  public static async ratePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const actor = getActor(req);
      const userId = actor?.id;
      const postId = req.params.postId;
      const rating = Number(req.body?.rating);
      if (actor?.role === 'SUPER_ADMIN' || actor?.role === 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admins have read-only access and cannot rate posts.' });
        return;
      }
      if (!userId || !mongoose.isValidObjectId(postId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, message: 'A valid rating between 1 and 5 is required.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      await PostRating.findOneAndUpdate(
        { postId: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId) },
        { rating },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const stats = await PostRating.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(postId) } },
        { $group: { _id: null, sum: { $sum: '$rating' }, count: { $sum: 1 } } }
      ]);
      const sum = stats[0]?.sum || 0;
      const count = stats[0]?.count || 0;
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      post.ratingSum = sum;
      post.ratingsCount = count;
      post.averageRating = avg;
      await post.save();

      res.status(200).json({
        success: true,
        postId,
        userRating: rating,
        averageRating: avg,
        ratingsCount: count
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to record rating.' });
    }
  }

  public static async getPostLikes(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'A valid post ID is required.' });
        return;
      }
      const reactions = await PostReaction.find({ postId, type: 'LIKE' })
        .populate('userId', 'name username avatarUrl role email')
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json({
        success: true,
        count: reactions.length,
        users: reactions.map((r: any) => ({
          id: r.userId?._id?.toString() || '',
          name: r.userId?.name || r.userId?.username || 'Traveler',
          username: r.userId?.username || 'traveler',
          avatarUrl: r.userId?.avatarUrl || '',
          role: r.userId?.role || 'USER',
          email: r.userId?.email || '',
          likedAt: r.createdAt
        }))
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load post likes.' });
    }
  }

  public static async getPostReposts(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'A valid post ID is required.' });
        return;
      }
      const reactions = await PostReaction.find({ postId, type: 'REPOST' })
        .populate('userId', 'name username avatarUrl role email')
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json({
        success: true,
        count: reactions.length,
        users: reactions.map((r: any) => ({
          id: r.userId?._id?.toString() || '',
          name: r.userId?.name || r.userId?.username || 'Traveler',
          username: r.userId?.username || 'traveler',
          avatarUrl: r.userId?.avatarUrl || '',
          role: r.userId?.role || 'USER',
          email: r.userId?.email || '',
          repostedAt: r.createdAt
        }))
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load post reposts.' });
    }
  }

  public static async getPostRatings(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'A valid post ID is required.' });
        return;
      }
      const ratings = await PostRating.find({ postId })
        .populate('userId', 'name username avatarUrl role email')
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      const post = await Post.findById(postId).select('averageRating ratingsCount ratingSum viewsCount');

      res.status(200).json({
        success: true,
        count: ratings.length,
        averageRating: post?.averageRating || 0,
        ratingsCount: post?.ratingsCount || ratings.length,
        ratings: ratings.map((r: any) => ({
          id: r._id?.toString() || '',
          rating: r.rating,
          user: {
            id: r.userId?._id?.toString() || '',
            name: r.userId?.name || r.userId?.username || 'Traveler',
            username: r.userId?.username || 'traveler',
            avatarUrl: r.userId?.avatarUrl || '',
            role: r.userId?.role || 'USER',
            email: r.userId?.email || ''
          },
          ratedAt: r.updatedAt || r.createdAt
        }))
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load post ratings and reviews.' });
    }
  }

  public static async recordPostView(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'Valid post ID is required.' });
        return;
      }

      // Identify viewer: either from verified token (req.user), body userId, username, or email
      const actor = getActor(req);
      let viewerId = actor?.id;
      let viewerRole = actor?.role;

      if (!viewerId && req.body?.userId && mongoose.isValidObjectId(req.body.userId)) {
        const dbUser = await User.findById(req.body.userId).select('role status');
        if (dbUser && dbUser.status !== 'BLOCKED') {
          viewerId = dbUser._id.toString();
          viewerRole = dbUser.role;
        }
      }

      if (!viewerId && (req.body?.username || req.body?.email)) {
        const query: any[] = [];
        if (req.body?.username) query.push({ username: req.body.username.toLowerCase() });
        if (req.body?.email) query.push({ email: req.body.email.toLowerCase() });
        const dbUser = await User.findOne({ $or: query }).select('_id role status');
        if (dbUser && dbUser.status !== 'BLOCKED') {
          viewerId = dbUser._id.toString();
          viewerRole = dbUser.role;
        }
      }

      if (!viewerId) {
        res.status(401).json({ success: false, message: 'Registered user authentication required to count post views.' });
        return;
      }

      const postObjectId = new mongoose.Types.ObjectId(postId);
      const post = await Post.findById(postObjectId).select('viewsCount');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }

      // Exclude Admin and Super Admin from view counts and tracking
      if (viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN') {
        const totalViews = await PostView.countDocuments({ postId: postObjectId });
        res.status(200).json({
          success: true,
          postId,
          viewsCount: totalViews,
          counted: false,
          reason: 'Admin views are excluded from view counts'
        });
        return;
      }

      // Unique view tracking: only ONE view per registered user per post!
      const filter = {
        postId: postObjectId,
        userId: new mongoose.Types.ObjectId(viewerId)
      };

      let newlyRecorded = false;
      try {
        await PostView.create(filter);
        newlyRecorded = true;
      } catch (err: any) {
        if (err?.code !== 11000) {
          throw err;
        }
        // Duplicate key: this registered user has already viewed this post
        newlyRecorded = false;
      }

      // Views count strictly equals real registered viewers count
      const realViewsCount = await PostView.countDocuments({ postId: postObjectId });
      await Post.updateOne({ _id: postObjectId }, { $set: { viewsCount: realViewsCount } }).catch(() => {});

      res.status(200).json({
        success: true,
        postId,
        viewsCount: realViewsCount,
        counted: newlyRecorded
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to record post view.' });
    }
  }

  public static async getPostViews(req: Request, res: Response): Promise<void> {
    try {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'A valid post ID is required.' });
        return;
      }

      const postObjectId = new mongoose.Types.ObjectId(postId);
      const post = await Post.findById(postObjectId).select('userId viewsCount createdAt');
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }

      // Sync existing viewers from post author and past interactions if PostView is empty
      const existingViewCount = await PostView.countDocuments({ postId: postObjectId });
      if (existingViewCount === 0) {
        const candidateUserIds = new Set<string>();
        if (post.userId) candidateUserIds.add(post.userId.toString());

        const [reactions, comments, ratings] = await Promise.all([
          PostReaction.find({ postId: postObjectId }).select('userId').lean(),
          PostComment.find({ postId: postObjectId }).select('userId').lean(),
          PostRating.find({ postId: postObjectId }).select('userId').lean()
        ]);
        reactions.forEach((r: any) => r.userId && candidateUserIds.add(r.userId.toString()));
        comments.forEach((c: any) => c.userId && candidateUserIds.add(c.userId.toString()));
        ratings.forEach((rt: any) => rt.userId && candidateUserIds.add(rt.userId.toString()));

        if (candidateUserIds.size > 0) {
          const validUsers = await User.find({
            _id: { $in: Array.from(candidateUserIds).filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id)) },
            role: { $nin: ['ADMIN', 'SUPER_ADMIN'] }
          }).select('_id');

          const backfillOps = validUsers.map((u) => ({
            updateOne: {
              filter: { postId: postObjectId, userId: u._id },
              update: { $setOnInsert: { postId: postObjectId, userId: u._id, createdAt: post.createdAt || new Date() } },
              upsert: true
            }
          }));
          if (backfillOps.length > 0) {
            await PostView.bulkWrite(backfillOps, { ordered: false }).catch(() => {});
          }
        }
      }

      const views = await PostView.find({ postId: postObjectId })
        .populate('userId', 'name username avatarUrl role email status')
        .sort({ createdAt: -1 })
        .lean();

      // Non-admin registered platform users (USER, TRAVELER, HOTEL_HOST, etc.)
      const viewers = views
        .filter((v: any) => v.userId && v.userId.role !== 'ADMIN' && v.userId.role !== 'SUPER_ADMIN')
        .map((v: any) => ({
          id: v.userId._id?.toString() || '',
          name: v.userId.name || v.userId.username || 'Traveler',
          username: v.userId.username || 'traveler',
          avatarUrl: v.userId.avatarUrl || '',
          role: v.userId.role || 'USER',
          email: v.userId.email || '',
          viewedAt: v.createdAt
        }));

      // Synchronize post viewsCount to match actual viewer count (strictly no arbitrary/default numbers)
      await Post.updateOne({ _id: postObjectId }, { $set: { viewsCount: viewers.length } }).catch(() => {});

      res.status(200).json({
        success: true,
        count: viewers.length,
        viewsCount: viewers.length,
        users: viewers
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load post viewers.' });
    }
  }

  public static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getActor(req);
      const postId = req.params.postId;
      if (!user || !mongoose.isValidObjectId(postId)) {
        res.status(400).json({ success: false, message: 'Valid post ID and account are required.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Post not found.' });
        return;
      }
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const isOwner = post.userId?.toString() === user.id;
      if (!isAdmin && !isOwner) {
        res.status(403).json({ success: false, message: 'You are not authorized to delete this post.' });
        return;
      }
      await Promise.all([
        Post.deleteOne({ _id: postId }),
        PostComment.deleteMany({ postId }),
        PostReaction.deleteMany({ postId }),
        PostRating.deleteMany({ postId }),
        PostView.deleteMany({ postId })
      ]);
      res.status(200).json({ success: true, message: 'Post deleted successfully.', postId });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to delete post.' });
    }
  }
}
