import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
  replies?: {
    userId: mongoose.Types.ObjectId;
    userName: string;
    text: string;
    createdAt: Date;
  }[];
}

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  images: string[];
  caption: string;
  locationName: string;
  city: string;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  comments: IComment[];
  commentsCount: number;
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
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
    votedUserIds: { userId: mongoose.Types.ObjectId; choice: 'A' | 'B' }[];
  };
  qaSticker?: {
    prompt: string;
    responses: { userId: mongoose.Types.ObjectId; responseText: string }[];
  };
  expiresAt: Date;
  viewers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IDirectMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  messageType: 'TEXT' | 'AUDIO_VOICE_NOTE' | 'TICKET_SHARE' | 'STAY_SHARE';
  text?: string;
  audioVoiceNote?: {
    audioUrl: string;
    durationSeconds: number;
    waveFormData?: number[];
  };
  ticketShare?: {
    ticketType: 'FLIGHT' | 'TRAIN';
    pnr: string;
    summary: string;
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
    locationName: { type: String, default: 'Burj Khalifa, Dubai' },
    city: { type: String, default: 'Dubai' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: String,
        userAvatar: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
        likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        replies: [
          {
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            userName: String,
            text: String,
            createdAt: { type: Date, default: Date.now }
          }
        ]
      }
    ],
    commentsCount: { type: Number, default: 0 },
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const ReelSchema = new Schema<IReel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, required: true },
    audioTrackName: { type: String, default: 'Original Audio - Desert Sunset Beats' },
    locationName: { type: String, default: 'Dubai Desert Safari' },
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
      optionB: { text: String, votes: { type: Number, default: 0 } },
      votedUserIds: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          choice: { type: String, enum: ['A', 'B'] }
        }
      ]
    },
    qaSticker: {
      prompt: String,
      responses: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          responseText: String
        }
      ]
    },
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
      enum: ['TEXT', 'AUDIO_VOICE_NOTE', 'TICKET_SHARE', 'STAY_SHARE'],
      default: 'TEXT'
    },
    text: String,
    audioVoiceNote: {
      audioUrl: String,
      durationSeconds: Number,
      waveFormData: [Number]
    },
    ticketShare: {
      ticketType: { type: String, enum: ['FLIGHT', 'TRAIN'] },
      pnr: String,
      summary: String
    },
    stayShare: { stayType: String, pnr: String, summary: String },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Post = mongoose.model<IPost>('Post', PostSchema);
export const Reel = mongoose.model<IReel>('Reel', ReelSchema);
export const Story = mongoose.model<IStory>('Story', StorySchema);
export const DirectMessage = mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
