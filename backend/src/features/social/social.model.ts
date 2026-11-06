import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  images: string[];
  caption: string;
  locationName: string;
  city: string;
  commentsCount: number;
  likesCount: number;
  repostsCount: number;
  viewsCount: number;
  ratingSum: number;
  ratingsCount: number;
  averageRating: number;
  isAdminPost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostRating extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostView extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IPostComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export type PostReactionType = 'LIKE' | 'SAVE' | 'REPOST';

export interface IPostReaction extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: PostReactionType;
  createdAt: Date;
}

export type StoryResponseKind = 'POLL_VOTE' | 'QA_ANSWER';

export interface IStoryResponse extends Document {
  storyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kind: StoryResponseKind;
  choice?: 'A' | 'B';
  responseText?: string;
  sourceKey: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IReel extends Document {
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  audioTrackName: string;
  locationName: string;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string;
  locationName?: string;
  pollSticker?: {
    question: string;
    optionA: { text: string; votes: number };
    optionB: { text: string; votes: number };
  };
  qaSticker?: {
    prompt: string;
  };
  qaResponseCount: number;
  expiresAt: Date;
  viewers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IDirectMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  messageType: 'TEXT' | 'AUDIO_VOICE_NOTE' | 'STAY_SHARE';
  text?: string;
  audioVoiceNote?: {
    audioUrl: string;
    durationSeconds: number;
    waveFormData?: number[];
  };
  stayShare?: { stayType: string; pnr: string; summary: string };
  isRead: boolean;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String, required: true }],
    caption: { type: String, required: true },
    locationName: { type: String, default: '' },
    city: { type: String, default: '' },
    commentsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isAdminPost: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const ReelSchema = new Schema<IReel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, required: true },
    audioTrackName: { type: String, default: '' },
    locationName: { type: String, default: '' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const StorySchema = new Schema<IStory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' },
    caption: String,
    locationName: String,
    pollSticker: {
      question: String,
      optionA: { text: String, votes: { type: Number, default: 0 } },
      optionB: { text: String, votes: { type: Number, default: 0 } }
    },
    qaSticker: {
      prompt: String
    },
    qaResponseCount: { type: Number, default: 0, min: 0 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageType: {
      type: String,
      enum: ['TEXT', 'AUDIO_VOICE_NOTE', 'STAY_SHARE'],
      default: 'TEXT'
    },
    text: String,
    audioVoiceNote: {
      audioUrl: String,
      durationSeconds: Number,
      waveFormData: [Number]
    },
    stayShare: { stayType: String, pnr: String, summary: String },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1, _id: -1 });
PostSchema.index({ isAdminPost: 1, createdAt: -1 });
ReelSchema.index({ createdAt: -1 });
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PostCommentSchema = new Schema<IPostComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true, maxlength: 100 },
  userAvatar: { type: String, default: '', maxlength: 2048 },
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now, required: true }
}, { versionKey: false });
PostCommentSchema.index({ postId: 1, createdAt: -1, _id: -1 });

const PostReactionSchema = new Schema<IPostReaction>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['LIKE', 'SAVE', 'REPOST'], required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
PostReactionSchema.index({ postId: 1, userId: 1, type: 1 }, { unique: true });
PostReactionSchema.index({ postId: 1, type: 1 });
PostReactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

const PostRatingSchema = new Schema<IPostRating>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true, versionKey: false });
PostRatingSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostRatingSchema.index({ postId: 1, rating: 1 });

const PostViewSchema = new Schema<IPostView>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
PostViewSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostViewSchema.index({ postId: 1, createdAt: -1 });

const StoryResponseSchema = new Schema<IStoryResponse>({
  storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['POLL_VOTE', 'QA_ANSWER'], required: true },
  choice: { type: String, enum: ['A', 'B'] },
  responseText: { type: String, maxlength: 2000 },
  sourceKey: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
StoryResponseSchema.index({ storyId: 1, userId: 1 }, { unique: true, partialFilterExpression: { kind: 'POLL_VOTE' } });
StoryResponseSchema.index({ storyId: 1, kind: 1, createdAt: -1, _id: -1 });
StoryResponseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

DirectMessageSchema.index({ senderId: 1, createdAt: -1 });
DirectMessageSchema.index({ recipientId: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
export const PostComment = mongoose.model<IPostComment>('PostComment', PostCommentSchema);
export const PostReaction = mongoose.model<IPostReaction>('PostReaction', PostReactionSchema);
export const PostRating = mongoose.model<IPostRating>('PostRating', PostRatingSchema);
export const PostView = mongoose.model<IPostView>('PostView', PostViewSchema);
export const StoryResponse = mongoose.model<IStoryResponse>('StoryResponse', StoryResponseSchema);
export const Reel = mongoose.model<IReel>('Reel', ReelSchema);
export const Story = mongoose.model<IStory>('Story', StorySchema);
export const DirectMessage = mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
