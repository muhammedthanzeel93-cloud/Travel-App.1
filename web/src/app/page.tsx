'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  Mic,
  Play,
  Pause,
  Sparkles,
  MapPin,
  Compass,
  Flame,
  Users,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
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
      caption: 'Golden hour at the top of Burj Khalifa! 🌅 Words cannot describe the amber glow setting across the Arabian Gulf. Double-tap to like and share with fellow travelers! ✨ #TravelDiary #SunsetMagic #VisitDubai',
      likesCount: 1420,
      isLiked: true,
      commentsCount: 38,
      comments: [
        { name: 'Rahul Nair', text: 'Incredible golden tones! Did you catch the 17:30 sunset slot?' },
        { name: 'Fatima Zahra', text: 'Breathtaking view! Adding this to my must-visit travel bucket list.' }
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
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Discover &amp; Share Real-World Travel Stories</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Travel Buddy •{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
              Global Explorer Social Feed
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Welcome to Travel Buddy! Connect with a worldwide community of explorers, share swipeable multi-photo travel memories, discover 24-hour interactive stories, and engage with traveler audio discussions.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              Explore Social Feed &amp; Reels
            </Link>

            <a
              href="#featured-feed"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Browse Stories
            </a>
          </div>
        </div>

        {/* Live Metrics Ticker */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div>
            <span className="block text-2xl font-black text-amber-400">12.5k+</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-amber-400" /> Active Explorers
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-white">48k+</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Camera className="w-3 h-3 text-rose-400" /> Photo Stories Shared
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-rose-400">180k+</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Heart className="w-3 h-3 text-rose-400" /> Likes &amp; Interactions
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400">95+</span>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Compass className="w-3 h-3 text-emerald-400" /> Destinations Featured
            </span>
          </div>
        </div>
      </div>

      {/* Featured Community Feed Section */}
      <div id="featured-feed" className="max-w-2xl mx-auto space-y-6">
        {/* 24-Hour Stories Bar with Poll Sticker */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>24-Hour Travel Stories &amp; Polls</span>
          </span>

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
              <span className="text-xs font-bold text-white block">Aisha&apos;s Live Story Poll</span>
              <p className="text-[11px] text-slate-400">&quot;Which adventure should I do tomorrow morning?&quot;</p>

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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Direct Voice Note from Traveler Rahul</span>
              <span className="text-[11px] text-slate-400">&quot;Hey Aisha, does the view look best at golden hour?&quot;</span>
            </div>
          </div>

          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold transition-all shadow-md"
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Feed Posts */}
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

        {/* Explore More CTA */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <h3 className="font-extrabold text-white text-base">Want to discover more stories &amp; reels?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Check out full-screen Travel Reels, connect with global creators, and share your favorite trip highlights.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
          >
            <span>Open Travel Feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
