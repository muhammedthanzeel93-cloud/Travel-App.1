'use client';

import { useState } from 'react';
import { Camera, Heart, MessageCircle, Bookmark, Share2, Send, Mic, Play, Pause, Sparkles, MapPin, Volume2 } from 'lucide-react';

export default function TravelSocialFeedPage() {
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const [pollVote, setPollVote] = useState<'A' | 'B' | null>('A');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: 'post_1',
      user: {
        name: 'Aisha Al-Falasi',
        handle: '@aisha_dubai',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      },
      location: 'Burj Khalifa (Level 148), Dubai',
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=80'
      ],
      currentImageIdx: 0,
      caption: 'Golden hour at the top of Burj Khalifa! 🌅 Words cannot describe the amber glow setting across the Arabian Gulf. Double-tap to like and save to your Dubai 10-day roadmap! ✨ #DubaiDiary #BurjKhalifa #VisitDubai',
      likesCount: 1420,
      isLiked: true,
      commentsCount: 38,
      comments: [
        { name: 'Rahul Nair', text: 'Incredible golden tones! Did you catch the 17:30 sunset slot?' },
        { name: 'Fatima Zahra', text: 'Breathtaking view! Added directly to Day 1 of my itinerary.' }
      ]
    },
    {
      id: 'post_2',
      user: {
        name: 'Kozhikode Wanderer',
        handle: '@clt_wanderlust',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      },
      location: 'Lahbab Red Dunes, Dubai Desert',
      images: [
        'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=80'
      ],
      currentImageIdx: 0,
      caption: 'Dune bashing thrills followed by stargazing in the Arabian Desert 🏜️⛺ The hospitality was unmatched! #DesertSafari #DubaiTravel',
      likesCount: 890,
      isLiked: false,
      commentsCount: 19,
      comments: [
        { name: 'Sara Khan', text: 'Looks epic! Sandboarding on the red dunes is so addictive.' }
      ]
    }
  ]);

  const handleDoubleTap = (postId: string) => {
    setDoubleTapPostId(postId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: true,
            likesCount: p.isLiked ? p.likesCount : p.likesCount + 1
          };
        }
        return p;
      })
    );
    setTimeout(() => setDoubleTapPostId(null), 800);
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 24-Hour Stories Bar with Poll Sticker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>24-Hour Travel Stories &amp; Polls</span>
        </span>

        {/* Story Circle & Poll Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Aisha"
                className="w-full h-full rounded-full object-cover border-2 border-slate-950"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <span className="text-xs font-bold text-white block">Aisha's Live Story Poll</span>
            <p className="text-[11px] text-slate-400">"Which adventure should I do tomorrow morning?"</p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPollVote('A')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                  pollVote === 'A'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                🪂 Palm Skydive (68%)
              </button>
              <button
                onClick={() => setPollVote('B')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                  pollVote === 'B'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                🏜️ Desert Safari (32%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Voice Note DM Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Direct Voice Note from Traveler Rahul</span>
            <span className="text-[11px] text-slate-400">"Hey Aisha, does the red line metro go straight to the frame?"</span>
          </div>
        </div>

        <button
          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.user.avatar} alt={post.user.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <span className="font-extrabold text-white text-xs block">{post.user.name}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> {post.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Image Carousel with Double-Tap Heart Animation */}
            <div
              className="relative aspect-square cursor-pointer overflow-hidden bg-black select-none"
              onDoubleClick={() => handleDoubleTap(post.id)}
            >
              <img
                src={post.images[post.currentImageIdx]}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {/* Heart Pulse Overlay */}
              {doubleTapPostId === post.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-heart-pulse drop-shadow-2xl" />
                </div>
              )}

              {/* Multi-Image Indicator Pill */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                {post.currentImageIdx + 1}/{post.images.length}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleToggleLike(post.id)} className="transition-transform active:scale-125">
                    <Heart
                      className={`w-6 h-6 ${post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-300 hover:text-white'}`}
                    />
                  </button>
                  <button className="text-slate-300 hover:text-white">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button className="text-slate-300 hover:text-white">
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <button className="text-slate-300 hover:text-white">
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              {/* Likes Count */}
              <span className="block text-xs font-bold text-white">
                {post.likesCount.toLocaleString()} likes
              </span>

              {/* Caption */}
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-extrabold text-white mr-1.5">{post.user.handle}</span>
                {post.caption}
              </p>

              {/* Comments Preview */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                {post.comments.map((c, i) => (
                  <div key={i} className="text-slate-400 text-[11px]">
                    <strong className="text-slate-200 mr-1.5">{c.name}</strong>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
