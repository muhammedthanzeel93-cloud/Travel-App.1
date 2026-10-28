import { Request, Response } from 'express';
import { Post, Reel, Story, DirectMessage } from './social.model.js';

export class SocialController {
  public static async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const mockPosts = [
        {
          _id: 'post_1',
          user: {
            name: 'Aisha Al-Falasi',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            handle: '@aisha_dubai'
          },
          images: [
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80'
          ],
          caption: 'Golden hour at the top of Burj Khalifa! 🌅 Words cannot describe the sunset casting its amber glow over the Arabian Gulf. Swipe to see the night views! ✨ #DubaiDiary #BurjKhalifa #VisitDubai',
          locationName: 'Burj Khalifa, Dubai',
          likesCount: 1420,
          isLiked: true,
          commentsCount: 38,
          comments: [
            {
              userName: 'Rahul Nair',
              userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
              text: 'Incredible shots! Did you take the sunset slot at 17:30?',
              createdAt: '2 hours ago'
            },
            {
              userName: 'Fatima Zahra',
              userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
              text: 'Pure magic ✨ Adding this to my 10-day Dubai roadmap!',
              createdAt: '1 hour ago'
            }
          ],
          createdAt: new Date()
        },
        {
          _id: 'post_2',
          user: {
            name: 'Kozhikode Wanderer',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            handle: '@clt_wanderlust'
          },
          images: [
            'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80'
          ],
          caption: 'Dune bashing at Lahbab Desert 🏜️ followed by an unforgettable Arabian dinner under millions of stars. The hospitality was top-notch! ⛺🐪',
          locationName: 'Lahbab Red Dunes, Dubai',
          likesCount: 890,
          isLiked: false,
          commentsCount: 19,
          comments: [
            {
              userName: 'Sara Khan',
              userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
              text: 'The red sand is so photogenic! Did you try sandboarding?',
              createdAt: '3 hours ago'
            }
          ],
          createdAt: new Date()
        }
      ];

      res.status(200).json({ success: true, count: mockPosts.length, posts: mockPosts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async toggleLikePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { isLiked } = req.body;

      res.status(200).json({
        success: true,
        postId,
        isLiked: !isLiked,
        newLikesCount: isLiked ? 1419 : 1421,
        message: isLiked ? 'Post unliked' : 'Post liked with double-tap heart ❤️'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getReels(req: Request, res: Response): Promise<void> {
    try {
      const mockReels = [
        {
          _id: 'reel_1',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dubai-city-buildings-and-skyscrapers-at-dusk-42171-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
          caption: 'Dusk over Downtown Dubai skyline 🌆 Fly Emirates from Calicut to DXB! #DubaiReels #Wanderlust',
          user: {
            name: 'Aisha Travels',
            handle: '@aisha_dubai',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
          },
          audioTrack: 'Original Sound - Dubai Sunset Chill Beats 🎵',
          location: 'Dubai Marina & Downtown',
          likesCount: 8430,
          commentsCount: 154,
          sharesCount: 620
        },
        {
          _id: 'reel_2',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-speed-boat-cruising-through-the-waters-of-dubai-42172-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80',
          caption: 'Cruising past the Palm Jumeirah on a private yacht 🛥️🌊 The water is crystal clear!',
          user: {
            name: 'Rahul Nair',
            handle: '@rahul_adventures',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80'
          },
          audioTrack: 'Arabian Deep House Mix 🎵',
          location: 'Palm Jumeirah, Dubai',
          likesCount: 12400,
          commentsCount: 310,
          sharesCount: 940
        }
      ];

      res.status(200).json({ success: true, count: mockReels.length, reels: mockReels });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getStories(req: Request, res: Response): Promise<void> {
    try {
      const mockStories = [
        {
          _id: 'story_1',
          user: {
            name: 'Aisha Al-Falasi',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            hasUnseenStory: true
          },
          mediaUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
          poll: {
            question: 'Skydiving over Palm Jumeirah or Desert Safari?',
            optionA: { text: '🪂 Skydive Palm', votes: 68 },
            optionB: { text: '🏜️ Desert Dune', votes: 32 }
          },
          expiresInHours: 18
        },
        {
          _id: 'story_2',
          user: {
            name: 'Kozhikode Wanderer',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
            hasUnseenStory: true
          },
          mediaUrl: 'https://images.unsplash.com/photo-1658826723326-1b777a8342ca?auto=format&fit=crop&w=800&q=80',
          qaPrompt: 'Ask me anything about the Dubai 10-day tourist visa rules! 🇦🇪',
          expiresInHours: 11
        }
      ];

      res.status(200).json({ success: true, stories: mockStories });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getDirectMessages(req: Request, res: Response): Promise<void> {
    try {
      const mockDms = [
        {
          _id: 'dm_1',
          sender: {
            name: 'Aisha Al-Falasi',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
          },
          messageType: 'AUDIO_VOICE_NOTE',
          audioVoiceNote: {
            durationSeconds: 14,
            waveFormData: [12, 28, 45, 80, 95, 60, 42, 70, 88, 30, 15, 65, 90, 40],
            audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg'
          },
          createdAt: '10:45 AM'
        },
        {
          _id: 'dm_2',
          sender: {
            name: 'Rahul Nair',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80'
          },
          messageType: 'STAY_SHARE',
          stayShare: {
            stayType: 'RESORT',
            pnr: 'BK8902',
            summary: 'Rainforest Eco Luxury Villa � Confirmed Stay'
          },
          createdAt: '11:15 AM'
        }
      ];

      res.status(200).json({ success: true, messages: mockDms });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}


