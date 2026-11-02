import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { config } from '../core/config/index.js';
import { PostComment, PostReaction, StoryResponse } from '../features/social/social.model.js';

type LegacyPost = {
  _id: mongoose.Types.ObjectId;
  comments?: Array<Record<string, any>>;
  commentsCount?: number;
  likes?: mongoose.Types.ObjectId[];
  savedBy?: mongoose.Types.ObjectId[];
};

type LegacyStory = {
  _id: mongoose.Types.ObjectId;
  expiresAt: Date;
  pollSticker?: {
    votedUserIds?: Array<{ userId: mongoose.Types.ObjectId; choice: 'A' | 'B' }>;
    optionA?: { votes?: number };
    optionB?: { votes?: number };
  };
  qaSticker?: { responses?: Array<Record<string, any>> };
  qaResponseCount?: number;
};

function stableObjectId(seed: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(createHash('sha256').update(seed).digest().subarray(0, 12));
}

async function migrate() {
  const apply = process.argv.includes('--apply');
  if (apply && process.env.ALLOW_SOCIAL_CONTENT_MIGRATION !== 'true') {
    throw new Error('Set ALLOW_SOCIAL_CONTENT_MIGRATION=true after taking a database backup to apply writes.');
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([PostComment.init(), PostReaction.init(), StoryResponse.init()]);

  const postsCollection = mongoose.connection.collection('posts');
  const storiesCollection = mongoose.connection.collection('stories');
  const postCursor = postsCollection.find({}) as unknown as AsyncIterable<LegacyPost>;

  let postsProcessed = 0;
  let commentsCopied = 0;
  let reactionsCopied = 0;
  for await (const post of postCursor) {
    const comments = post.comments || [];
    const likeIds = [...new Set((post.likes || []).map((id) => id.toString()))];
    const saveIds = [...new Set((post.savedBy || []).map((id) => id.toString()))];
    if (apply) {
      for (const [index, comment] of comments.entries()) {
        const id = comment._id && mongoose.isValidObjectId(comment._id)
          ? new mongoose.Types.ObjectId(comment._id)
          : stableObjectId(`post-comment:${post._id}:${index}`);
        await PostComment.collection.updateOne({ _id: id }, { $setOnInsert: {
          _id: id, postId: post._id, userId: comment.userId, userName: String(comment.userName || 'Community Explorer').slice(0, 100),
          userAvatar: String(comment.userAvatar || '').slice(0, 2048), text: String(comment.text || '').slice(0, 2000),
          createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date()
        } }, { upsert: true });
      }
      for (const userId of likeIds) await PostReaction.collection.updateOne(
        { postId: post._id, userId: new mongoose.Types.ObjectId(userId), type: 'LIKE' },
        { $setOnInsert: { postId: post._id, userId: new mongoose.Types.ObjectId(userId), type: 'LIKE', createdAt: new Date() } },
        { upsert: true }
      );
      for (const userId of saveIds) await PostReaction.collection.updateOne(
        { postId: post._id, userId: new mongoose.Types.ObjectId(userId), type: 'SAVE' },
        { $setOnInsert: { postId: post._id, userId: new mongoose.Types.ObjectId(userId), type: 'SAVE', createdAt: new Date() } },
        { upsert: true }
      );
      const countUpdate = Array.isArray(post.comments) ? comments.length : (post.commentsCount ?? 0);
      await postsCollection.updateOne({ _id: post._id }, {
        $set: { commentsCount: countUpdate },
        $unset: { comments: '', likes: '', savedBy: '', likesCount: '' }
      });
    }
    postsProcessed++;
    commentsCopied += comments.length;
    reactionsCopied += likeIds.length + saveIds.length;
  }

  const storyCursor = storiesCollection.find({}) as unknown as AsyncIterable<LegacyStory>;

  let storiesProcessed = 0;
  let storyResponsesCopied = 0;
  for await (const story of storyCursor) {
    const votes = story.pollSticker?.votedUserIds || [];
    const answers = story.qaSticker?.responses || [];
    if (apply) {
      for (const vote of votes) {
        const userId = new mongoose.Types.ObjectId(vote.userId);
        await StoryResponse.collection.updateOne(
          { storyId: story._id, userId, kind: 'POLL_VOTE' },
          { $setOnInsert: {
            storyId: story._id, userId, kind: 'POLL_VOTE', choice: vote.choice,
            sourceKey: `poll:${story._id}:${userId}`, expiresAt: new Date(story.expiresAt), createdAt: new Date()
          } }, { upsert: true }
        );
      }
      for (const [index, answer] of answers.entries()) {
        const sourceId = answer._id && mongoose.isValidObjectId(answer._id)
          ? String(answer._id)
          : stableObjectId(`story-answer:${story._id}:${index}`).toString();
        const userId = new mongoose.Types.ObjectId(answer.userId);
        await StoryResponse.collection.updateOne({ sourceKey: `qa:${story._id}:${sourceId}` }, { $setOnInsert: {
          storyId: story._id, userId, kind: 'QA_ANSWER', responseText: String(answer.responseText || '').slice(0, 2000),
          sourceKey: `qa:${story._id}:${sourceId}`, expiresAt: new Date(story.expiresAt),
          createdAt: answer.createdAt ? new Date(answer.createdAt) : new Date()
        } }, { upsert: true });
      }
      await storiesCollection.updateOne({ _id: story._id }, {
        $set: { qaResponseCount: Array.isArray(story.qaSticker?.responses) ? answers.length : (story.qaResponseCount ?? 0) },
        $unset: { 'pollSticker.votedUserIds': '', 'qaSticker.responses': '' }
      });
    }
    storiesProcessed++;
    storyResponsesCopied += votes.length + answers.length;
  }

  console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', postsProcessed, commentsCopied, reactionsCopied, storiesProcessed, storyResponsesCopied }));
}

migrate().catch((error) => {
  console.error('[SOCIAL MIGRATION]', error instanceof Error ? error.message : 'Migration failed.');
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});
