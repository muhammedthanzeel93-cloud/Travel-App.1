'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Users,
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Calendar,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Ban,
  UserCheck,
  UserX,
  Sparkles,
  Building,
  Crown,
  Compass,
  ArrowRight
} from 'lucide-react';
import { playChime } from '@/lib/soundAlert';

export interface UserProfileData {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: 'ACTIVE' | 'BLOCKED';
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
    lastActiveAt?: string | null;
    followersCount: number;
    followingCount: number;
    followers: Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl?: string;
      role?: string;
      email?: string;
      status?: string;
    }>;
    following: Array<{
      id: string;
      name: string;
      username: string;
      avatarUrl?: string;
      role?: string;
      email?: string;
      status?: string;
    }>;
  };
  stats: {
    postsCount: number;
    commentsCount: number;
    totalLikesReceived: number;
    totalViewsReceived: number;
  };
  posts: Array<{
    id: string;
    images: string[];
    caption: string;
    locationName?: string;
    city?: string;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    averageRating: number;
    ratingsCount: number;
    isAdminPost: boolean;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    postId: string;
    postCaption?: string;
    postImage?: string;
    postLocation?: string;
    text: string;
    createdAt?: string;
  }>;
}

interface AdminUserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onStatusChanged?: (userId: string, newStatus: 'ACTIVE' | 'BLOCKED') => void;
}

export default function AdminUserProfileModal({
  userId,
  onClose,
  onStatusChanged
}: AdminUserProfileModalProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'followers' | 'following'>('posts');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessingBlock, setIsProcessingBlock] = useState(false);

  // Sync internal state if prop changes
  useEffect(() => {
    setCurrentUserId(userId);
  }, [userId]);

  // Fetch complete profile bundle
  const loadProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/users/${id}/full-profile`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.profile) {
        setProfile(data.profile);
      } else {
        throw new Error(data.message || 'Failed to load user profile dossier.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to user profile service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      void loadProfile(currentUserId);
    } else {
      setProfile(null);
    }
  }, [currentUserId, loadProfile]);

  if (!userId && !currentUserId) return null;

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      playChime('success', true);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleToggleBlock = async () => {
    if (!profile) return;
    if (profile.user.role === 'SUPER_ADMIN') {
      alert('Cannot block Super Admin account.');
      return;
    }

    setIsProcessingBlock(true);
    try {
      const res = await fetch('/api/auth/users/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: profile.user.id, username: profile.user.username })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newStatus = data.status as 'ACTIVE' | 'BLOCKED';
        setProfile((prev) =>
          prev ? { ...prev, user: { ...prev.user, status: newStatus } } : null
        );
        onStatusChanged?.(profile.user.id, newStatus);
        playChime(newStatus === 'BLOCKED' ? 'warning' : 'success', true);
      } else {
        alert(data.message || 'Failed to update user status.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    } finally {
      setIsProcessingBlock(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          icon: Crown,
          label: 'SUPER ADMIN',
          cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'ADMIN':
        return {
          icon: Shield,
          label: 'ADMIN',
          cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25'
        };
      case 'HOTEL_HOST':
      case 'HOTEL':
        return {
          icon: Building,
          label: 'HOTEL PARTNER',
          cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'TRAVELER':
        return {
          icon: Compass,
          label: 'TRAVELER',
          cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      default:
        return {
          icon: User,
          label: 'REGISTERED USER',
          cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] animate-in fade-in duration-150">
      <div className="bg-[#0b0f19] border border-amber-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] my-auto">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>User Profile Dossier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                  Admin Inspection
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Full user records: details, followers, following, published posts, and platform comments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUserId && (
              <button
                type="button"
                onClick={() => void loadProfile(currentUserId)}
                disabled={loading}
                title="Refresh Profile"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close Profile"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] p-4 sm:p-6 space-y-5">
          {loading && !profile ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs font-semibold">Loading complete user profile and activity…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-2">
              <p className="font-bold text-sm">Failed to load user profile</p>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={() => currentUserId && void loadProfile(currentUserId)}
                className="mt-2 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white border border-slate-700 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : profile ? (
            <>
              {/* User Hero Profile Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {profile.user.avatarUrl ? (
                      <img
                        src={profile.user.avatarUrl}
                        alt={profile.user.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md shadow-amber-500/10 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-md shrink-0">
                        {profile.user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-white truncate">
                          {profile.user.name}
                        </h3>
                        {(() => {
                          const badge = getRoleBadge(profile.user.role);
                          const IconComp = badge.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.cls}`}
                            >
                              <IconComp className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs font-mono text-amber-400 mt-0.5">
                        @{profile.user.username}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {profile.user.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <UserX className="w-3 h-3" />
                            <span>BLOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <UserCheck className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Joined {new Date(profile.user.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Action: Block / Unblock Button */}
                  {profile.user.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={handleToggleBlock}
                      disabled={isProcessingBlock}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                        profile.user.status === 'BLOCKED'
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isProcessingBlock ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : profile.user.status === 'BLOCKED' ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {profile.user.status === 'BLOCKED' ? 'Unblock Account' : 'Block Account'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Biography */}
                {profile.user.bio && (
                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    &quot;{profile.user.bio}&quot;
                  </p>
                )}

                {/* Contact Pills: Email and Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-300 truncate font-mono text-[11px]">
                        {profile.user.email || 'No email provided'}
                      </span>
                    </div>
                    {profile.user.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.user.email, 'email')}
                        className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-300 truncate font-mono text-[11px]">
                        {profile.user.phone || 'No phone provided'}
                      </span>
                    </div>
                    {profile.user.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.user.phone, 'phone')}
                        className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Quick Stat Pills (Also function as Tab switchers) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeTab === 'posts'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">Published Posts</div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {profile.stats.postsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {profile.stats.totalLikesReceived} likes • {profile.stats.totalViewsReceived} views
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeTab === 'comments'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">Platform Comments</div>
                  <div className="text-xl font-black text-white mt-1">
                    {profile.stats.commentsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">On community destinations</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('followers')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeTab === 'followers'
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">Followers</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {profile.user.followersCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Community travelers</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeTab === 'following'
                      ? 'bg-blue-500/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">Following</div>
                  <div className="text-xl font-black text-blue-400 mt-1">
                    {profile.user.followingCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Followed accounts</div>
                </button>
              </div>

              {/* Sub-section Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center ${
                    activeTab === 'posts'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Posts ({profile.posts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center ${
                    activeTab === 'comments'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Comments ({profile.comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('followers')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center ${
                    activeTab === 'followers'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Followers ({profile.user.followers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center ${
                    activeTab === 'following'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Following ({profile.user.following.length})
                </button>
              </div>

              {/* TAB 1: USER'S PUBLISHED POSTS */}
              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {profile.posts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-1">
                      <p className="font-semibold text-slate-400">No photo posts published yet.</p>
                      <p className="text-[11px]">When this user publishes travel stories, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {profile.posts.map((post) => (
                        <div
                          key={post.id}
                          className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2.5 flex flex-col justify-between"
                        >
                          <div>
                            {post.images.length > 0 && (
                              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-2">
                                <img
                                  src={post.images[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {post.images.length > 1 && (
                                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-white backdrop-blur-sm border border-slate-700">
                                    +{post.images.length - 1} photos
                                  </span>
                                )}
                              </div>
                            )}

                            {(post.locationName || post.city) && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 truncate">
                                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">
                                  {[post.locationName, post.city].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-slate-200 line-clamp-2 mt-1">
                              {post.caption}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                                <Eye className="w-3 h-3" /> {post.viewsCount || 0}
                              </span>
                              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                                <Heart className="w-3 h-3" /> {post.likesCount || 0}
                              </span>
                              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                <MessageCircle className="w-3 h-3" /> {post.commentsCount || 0}
                              </span>
                            </div>

                            {post.averageRating > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {post.averageRating.toFixed(1)} ★
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: USER'S PLATFORM COMMENTS */}
              {activeTab === 'comments' && (
                <div className="space-y-2.5">
                  {profile.comments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-1">
                      <p className="font-semibold text-slate-400">No comments posted by this user.</p>
                      <p className="text-[11px]">When this user comments on any post, the discussion appears here.</p>
                    </div>
                  ) : (
                    profile.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2"
                      >
                        {/* Target Post Context */}
                        <div className="flex items-center gap-2.5 p-2 bg-slate-900/70 rounded-lg border border-slate-800/70 text-xs">
                          {comment.postImage ? (
                            <img
                              src={comment.postImage}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {comment.postLocation && (
                              <div className="text-[10px] font-bold text-amber-400 truncate">
                                {comment.postLocation}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 truncate">
                              &quot;{comment.postCaption || 'Travel destination post'}&quot;
                            </div>
                          </div>
                        </div>

                        {/* Comment Content */}
                        <div className="pl-1">
                          <p className="text-xs text-white font-medium">
                            {comment.text}
                          </p>
                          {comment.createdAt && (
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(comment.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}{' '}
                              •{' '}
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: FOLLOWERS LIST */}
              {activeTab === 'followers' && (
                <div className="space-y-2">
                  {profile.user.followers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-1">
                      <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="font-semibold text-slate-400">No followers yet.</p>
                      <p className="text-[11px]">When other platform users follow @{profile.user.username}, they will appear here.</p>
                    </div>
                  ) : (
                    profile.user.followers.map((f, i) => (
                      <div
                        key={`${f.id}-${i}`}
                        className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {f.avatarUrl ? (
                            <img
                              src={f.avatarUrl}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {f.name?.[0] || 'T'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              {f.name}
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                {f.role || 'USER'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">@{f.username}</div>
                            {f.email && (
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                {f.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentUserId(f.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Inspect this follower profile"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: FOLLOWING LIST */}
              {activeTab === 'following' && (
                <div className="space-y-2">
                  {profile.user.following.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-1">
                      <Compass className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="font-semibold text-slate-400">Not following anyone yet.</p>
                      <p className="text-[11px]">When @{profile.user.username} follows travelers or hotels, they will appear here.</p>
                    </div>
                  ) : (
                    profile.user.following.map((fl, i) => (
                      <div
                        key={`${fl.id}-${i}`}
                        className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-blue-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {fl.avatarUrl ? (
                            <img
                              src={fl.avatarUrl}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {fl.name?.[0] || 'T'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              {fl.name}
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                {fl.role || 'USER'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">@{fl.username}</div>
                            {fl.email && (
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                {fl.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentUserId(fl.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Inspect this followed user profile"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 text-blue-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            Admins have complete platform inspection authority.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
