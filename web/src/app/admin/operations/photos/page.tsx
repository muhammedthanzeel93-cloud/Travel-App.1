'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { playChime } from '@/lib/soundAlert';
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  MapPin,
  Star,
  Heart,
  Repeat,
  MessageCircle,
  Trash2,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowLeft,
  X,
  Building,
  User,
  Sparkles,
  Layers,
  Filter,
  Users,
  Eye,
  Info
} from 'lucide-react';

interface FeedUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
}

interface SocialPost {
  _id: string;
  user: FeedUser;
  images: string[];
  caption: string;
  locationName?: string;
  city?: string;
  likesCount: number;
  repostsCount: number;
  viewsCount: number;
  averageRating: number;
  ratingsCount: number;
  isAdminPost: boolean;
  commentsCount: number;
  createdAt: string;
}

interface CommentItem {
  id: string;
  userName: string;
  userHandle?: string;
  userAvatar?: string;
  userRole?: string;
  userEmail?: string;
  text: string;
  createdAt?: string;
}

interface ReactionUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role?: string;
  email?: string;
  likedAt?: string;
  repostedAt?: string;
  viewedAt?: string;
}

interface RatingReviewItem {
  id: string;
  rating: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    role?: string;
    email?: string;
  };
  ratedAt?: string;
}

export default function AdminPhotosPage() {
  const [activeTab, setActiveTab] = useState<'admin_studio' | 'user_posts'>('admin_studio');
  const [adminPosts, setAdminPosts] = useState<SocialPost[]>([]);
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toggle state for Create Official Admin Photo Post Popup Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for Admin Studio
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter for User Posts
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');

  // Deletion modal
  const [deleteTargetPost, setDeleteTargetPost] = useState<SocialPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read-only Modals: Likers, Reposters, Comments
  const [activeLikesPost, setActiveLikesPost] = useState<SocialPost | null>(null);
  const [likesList, setLikesList] = useState<ReactionUser[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const [activeRepostsPost, setActiveRepostsPost] = useState<SocialPost | null>(null);
  const [repostsList, setRepostsList] = useState<ReactionUser[]>([]);
  const [loadingReposts, setLoadingReposts] = useState(false);

  const [activeCommentsPost, setActiveCommentsPost] = useState<SocialPost | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [activeRatingsPost, setActiveRatingsPost] = useState<SocialPost | null>(null);
  const [ratingsList, setRatingsList] = useState<RatingReviewItem[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const [activeViewsPost, setActiveViewsPost] = useState<SocialPost | null>(null);
  const [viewsList, setViewsList] = useState<ReactionUser[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    playChime(type === 'success' ? 'success' : 'warning', soundEnabled);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch feeds
  const fetchAllPosts = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [adminRes, usersRes] = await Promise.all([
        fetch('/api/social/feed?type=admin&limit=30', { credentials: 'include' }),
        fetch('/api/social/feed?type=users&limit=30', { credentials: 'include' })
      ]);

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        setAdminPosts(adminData.posts || []);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserPosts(usersData.posts || []);
      }
    } catch (err: any) {
      console.error('Failed to load posts:', err);
      showNotification('Failed to fetch posts feed.', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllPosts();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true' || params.get('create') === 'true') {
        setIsCreateModalOpen(true);
      }
    }
  }, []);

  // Handle local file uploads
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showNotification('Only image files are supported.', 'error');
        return;
      }
      if (file.size > 7 * 1024 * 1024) {
        showNotification(`File ${file.name} is larger than 7MB.`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setUploadedImages((prev) => [...prev, result].slice(0, 10));
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrlImage = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      showNotification('Please enter a valid HTTP/HTTPS image URL.', 'error');
      return;
    }
    setUploadedImages((prev) => [...prev, trimmed].slice(0, 10));
    setManualImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Publish Post as Admin (Unrated initially; rated exclusively by users)
  const handlePublishAdminPost = async (e: FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      showNotification('Please upload or provide at least one photo.', 'error');
      return;
    }
    if (!caption.trim()) {
      showNotification('Please enter a caption or description for this photo.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          images: uploadedImages,
          caption: caption.trim(),
          locationName: locationName.trim(),
          city: city.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish post.');
      }

      showNotification('Admin photo post published! Travelers can now view, rate, like, and repost.', 'success');
      setUploadedImages([]);
      setCaption('');
      setLocationName('');
      setCity('');
      setIsCreateModalOpen(false);
      await fetchAllPosts(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish post.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Likers Modal
  const handleOpenLikesModal = async (post: SocialPost) => {
    setActiveLikesPost(post);
    setLoadingLikes(true);
    try {
      const res = await fetch(`/api/social/posts/${post._id}/likes`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLikesList(data.users || []);
      }
    } catch {
      showNotification('Unable to load likes list.', 'error');
    } finally {
      setLoadingLikes(false);
    }
  };

  // Open Reposters Modal
  const handleOpenRepostsModal = async (post: SocialPost) => {
    setActiveRepostsPost(post);
    setLoadingReposts(true);
    try {
      const res = await fetch(`/api/social/posts/${post._id}/reposts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRepostsList(data.users || []);
      }
    } catch {
      showNotification('Unable to load reposts list.', 'error');
    } finally {
      setLoadingReposts(false);
    }
  };

  // Open Comments Modal (View Only)
  const handleOpenCommentsModal = async (post: SocialPost) => {
    setActiveCommentsPost(post);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/${post._id}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data.comments || []);
      }
    } catch {
      showNotification('Unable to load comments.', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  // Open Reviews & Star Ratings Modal (View who rated)
  const handleOpenRatingsModal = async (post: SocialPost) => {
    setActiveRatingsPost(post);
    setLoadingRatings(true);
    try {
      const res = await fetch(`/api/social/posts/${post._id}/ratings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRatingsList(data.ratings || []);
      }
    } catch {
      showNotification('Unable to load traveler reviews and ratings.', 'error');
    } finally {
      setLoadingRatings(false);
    }
  };

  // Open Views Modal (View who viewed this post)
  const handleOpenViewsModal = async (post: SocialPost) => {
    setActiveViewsPost(post);
    setLoadingViews(true);
    setViewsList([]);
    try {
      const res = await fetch(`/api/social/posts/${post._id}/views`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        setViewsList(users);
        const actualCount = typeof data.count === 'number' ? data.count : users.length;
        setActiveViewsPost((prev) => prev ? { ...prev, viewsCount: actualCount } : null);
        setAdminPosts((prev) => prev.map((p) => p._id === post._id ? { ...p, viewsCount: actualCount } : p));
        setUserPosts((prev) => prev.map((p) => p._id === post._id ? { ...p, viewsCount: actualCount } : p));
      }
    } catch {
      showNotification('Unable to load travelers who viewed this post.', 'error');
    } finally {
      setLoadingViews(false);
    }
  };

  // Confirm Delete Post (Admin Moderation)
  const handleExecuteDelete = async () => {
    if (!deleteTargetPost) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/social/posts/${deleteTargetPost._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Post deleted successfully.', 'success');
        setAdminPosts((prev) => prev.filter((p) => p._id !== deleteTargetPost._id));
        setUserPosts((prev) => prev.filter((p) => p._id !== deleteTargetPost._id));
        setDeleteTargetPost(null);
      } else {
        throw new Error(data.message || 'Failed to delete post.');
      }
    } catch (err: any) {
      showNotification(err.message || 'Unable to delete post.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter user posts
  const filteredUserPosts = userPosts.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      post.user.name.toLowerCase().includes(q) ||
      post.user.handle.toLowerCase().includes(q) ||
      (post.caption && post.caption.toLowerCase().includes(q)) ||
      (post.locationName && post.locationName.toLowerCase().includes(q)) ||
      (post.city && post.city.toLowerCase().includes(q));

    const matchesCity = filterCity === 'ALL' || post.city === filterCity;
    return matchesQuery && matchesCity;
  });

  const uniqueCities = Array.from(
    new Set(userPosts.map((p) => p.city).filter((c): c is string => Boolean(c && c.trim())))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link
              href="/admin/operations"
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">Post Photos</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Photo Studio & Community Posts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Operations Desk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Publish official destination photos and review community travelers&apos; posts with full view-only inspection for likes, reposts, comments, and star ratings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? 'Chime ON' : 'Muted'}
          </button>
          <button
            onClick={() => void fetchAllPosts()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Two-Part Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#090d16] border border-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('admin_studio')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'admin_studio'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Part 1: Admin Photo Studio (Upload & Manage)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'admin_studio'
                ? 'bg-slate-950 text-amber-400'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {adminPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('user_posts')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'user_posts'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Part 2: Community User Posts (Directory)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'user_posts'
                ? 'bg-slate-950 text-amber-400'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {userPosts.length}
          </span>
        </button>
      </div>

      {/* PART 1: ADMIN PHOTO POST STUDIO */}
      {activeTab === 'admin_studio' && (
        <div className="space-y-6">
          {/* Section Header with + Create Official Photo Post Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Admin Published Posts</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-amber-400 font-extrabold">
                    {adminPosts.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official travel destinations published by administrators • Travelers can view, like, comment, and rate
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <ImagePlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Official Photo Post</span>
            </button>
          </div>

          {/* Admin's Published Posts Stream */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading published admin posts…
              </div>
            ) : adminPosts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl space-y-3">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm">No admin posts published yet.</p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>+ Create Your First Post</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {adminPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      {/* Header */}
                      <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black text-xs">
                            A
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {post.user.name}
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                OFFICIAL
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setDeleteTargetPost(post)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Photo Image Display */}
                      {post.images.length > 0 && (
                        <div className="relative bg-slate-950 w-full h-64 overflow-hidden">
                          <img
                            src={post.images[0]}
                            alt={post.caption}
                            className="w-full h-full object-cover"
                          />
                          {post.images.length > 1 && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-950/80 text-white backdrop-blur-sm border border-slate-700">
                              +{post.images.length - 1} photos
                            </span>
                          )}
                          {(post.locationName || post.city) && (
                            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950/85 text-amber-400 backdrop-blur-sm border border-amber-500/30 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              {[post.locationName, post.city].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caption & Star Rating Display (Read-only) */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-3">
                          {post.caption}
                        </p>

                        {/* Interactive Star Rating Display (Click to inspect reviewer ratings) */}
                        <button
                          type="button"
                          onClick={() => void handleOpenRatingsModal(post)}
                          className="w-full flex items-center justify-between p-2.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
                          title="Click to view all travelers who rated this post"
                        >
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starVal) => {
                              const isFilled = Math.round(post.averageRating) >= starVal;
                              return (
                                <Star
                                  key={starVal}
                                  className={`w-3.5 h-3.5 ${
                                    isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                                  }`}
                                />
                              );
                            })}
                            <span className="text-xs font-bold text-amber-400 ml-1.5">
                              {post.averageRating > 0 ? `${post.averageRating.toFixed(1)} ★` : 'No ratings yet'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 group-hover:text-amber-400 font-medium underline decoration-slate-700 underline-offset-2 transition-colors">
                            {post.ratingsCount} {post.ratingsCount === 1 ? 'review' : 'reviews'} →
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Engagement Actions Bar (Click to inspect likers, comments, reposters, views) */}
                    <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Views Count (Click to inspect travelers who viewed) */}
                        <button
                          type="button"
                          onClick={() => void handleOpenViewsModal(post)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group"
                          title="Click to view registered travelers who viewed this post"
                        >
                          <Eye className="w-4 h-4 text-cyan-400/80 group-hover:text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span className="text-white font-bold group-hover:text-cyan-300">{post.viewsCount || 0}</span>
                          <span className="text-[11px] text-slate-500 group-hover:text-slate-300 underline decoration-slate-800 underline-offset-2">
                            Views
                          </span>
                        </button>

                        {/* View Likes */}
                        <button
                          onClick={() => void handleOpenLikesModal(post)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer group"
                          title="Click to view travelers who liked this post"
                        >
                          <Heart className="w-4 h-4 text-rose-500/80 group-hover:text-rose-400" />
                          <span className="text-white font-bold">{post.likesCount}</span>
                          <span className="text-[11px] text-slate-500 group-hover:text-slate-300">Likes</span>
                        </button>

                        {/* View Comments */}
                        <button
                          onClick={() => void handleOpenCommentsModal(post)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer group"
                          title="Click to view comments"
                        >
                          <MessageCircle className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400" />
                          <span className="text-white font-bold">{post.commentsCount}</span>
                          <span className="text-[11px] text-slate-500 group-hover:text-slate-300">Comments</span>
                        </button>

                        {/* View Reposts */}
                        <button
                          onClick={() => void handleOpenRepostsModal(post)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer group"
                          title="Click to view travelers who reposted this post"
                        >
                          <Repeat className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-400" />
                          <span className="text-white font-bold">{post.repostsCount}</span>
                          <span className="text-[11px] text-slate-500 group-hover:text-slate-300">Reposts</span>
                        </button>
                      </div>

                      <span className="text-[11px] font-bold text-amber-500/80">ADMIN POST</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PART 2: COMMUNITY USER POSTS DIRECTORY */}
      {activeTab === 'user_posts' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by traveler name, handle, caption, location..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Cities ({userPosts.length})</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Posts Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
              Loading community user posts…
            </div>
          ) : filteredUserPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              No user posts matching your query. All posts submitted by registered travelers will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUserPosts.map((post) => (
                <div
                  key={post._id}
                  className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* User Profile Header */}
                    <div className="p-3.5 flex items-center justify-between border-b border-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        {post.user.avatar ? (
                          <img
                            src={post.user.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {post.user.name}
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {post.user.role || 'USER'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{post.user.handle}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteTargetPost(post)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Moderate / Delete User Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image */}
                    {post.images.length > 0 && (
                      <div className="relative bg-slate-950 w-full h-56 overflow-hidden">
                        <img
                          src={post.images[0]}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                        />
                        {post.images.length > 1 && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-white backdrop-blur-sm border border-slate-700">
                            +{post.images.length - 1} photos
                          </span>
                        )}
                        {(post.locationName || post.city) && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-950/85 text-amber-400 backdrop-blur-sm border border-amber-500/30 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {[post.locationName, post.city].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Caption & Rating */}
                    <div className="p-3.5 space-y-2.5">
                      <p className="text-xs text-slate-300 line-clamp-3">{post.caption}</p>

                      {/* Read-only Star Rating for Community Posts (Click to view reviewers) */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => void handleOpenRatingsModal(post)}
                          className="flex items-center gap-1.5 text-amber-400 font-bold hover:text-amber-300 transition-colors group cursor-pointer text-left"
                          title="Click to view all travelers who rated this post"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>
                            {post.averageRating > 0 ? `${post.averageRating.toFixed(1)} ★` : 'Unrated'}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-amber-400 font-medium underline decoration-slate-700 underline-offset-2 transition-colors">
                            ({post.ratingsCount} {post.ratingsCount === 1 ? 'review' : 'reviews'}) →
                          </span>
                        </button>
                        <span className="text-[10px] text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (Click to inspect likers, comments, reposters, views) */}
                  <div className="px-3.5 py-2.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      {/* Total Views (Click to inspect travelers who viewed) */}
                      <button
                        type="button"
                        onClick={() => void handleOpenViewsModal(post)}
                        className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer group"
                        title="Click to view registered travelers who viewed this post"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400/80 group-hover:text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-300 font-semibold group-hover:text-cyan-300">{post.viewsCount || 0}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Views</span>
                      </button>

                      {/* View Likes */}
                      <button
                        onClick={() => void handleOpenLikesModal(post)}
                        className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer group"
                        title="Click to view travelers who liked this post"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500/80 group-hover:text-rose-400" />
                        <span className="text-slate-300 font-semibold">{post.likesCount}</span>
                      </button>

                      {/* View Comments */}
                      <button
                        onClick={() => void handleOpenCommentsModal(post)}
                        className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer group"
                        title="Click to view comments"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400" />
                        <span className="text-slate-300 font-semibold">{post.commentsCount}</span>
                      </button>

                      {/* View Reposts */}
                      <button
                        onClick={() => void handleOpenRepostsModal(post)}
                        className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer group"
                        title="Click to view travelers who reposted this post"
                      >
                        <Repeat className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-400" />
                        <span className="text-slate-300 font-semibold">{post.repostsCount}</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" /> View Only
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIKERS MODAL (Who liked this post) */}
      {activeLikesPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Travelers Who Liked</h3>
                  <p className="text-[11px] text-slate-400">
                    Total {likesList.length} {likesList.length === 1 ? 'traveler' : 'travelers'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLikesPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingLikes ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                  Loading likes…
                </div>
              ) : likesList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No travelers have liked this post yet.
                </div>
              ) : (
                likesList.map((u, i) => (
                  <div
                    key={`${u.id}-${i}`}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs">
                          {u.name?.[0] || 'T'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {u.name}
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {u.role || 'USER'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">@{u.username}</div>
                        {u.email && (
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {u.email}
                          </div>
                        )}
                      </div>
                    </div>
                    {u.likedAt && (
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(u.likedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPOSTERS MODAL (Who reposted this post) */}
      {activeRepostsPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Travelers Who Reposted</h3>
                  <p className="text-[11px] text-slate-400">
                    Total {repostsList.length} {repostsList.length === 1 ? 'repost' : 'reposts'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRepostsPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingReposts ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                  Loading reposts…
                </div>
              ) : repostsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No travelers have reposted this post yet.
                </div>
              ) : (
                repostsList.map((u, i) => (
                  <div
                    key={`${u.id}-${i}`}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          {u.name?.[0] || 'T'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {u.name}
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {u.role || 'USER'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">@{u.username}</div>
                        {u.email && (
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {u.email}
                          </div>
                        )}
                      </div>
                    </div>
                    {u.repostedAt && (
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(u.repostedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL / DRAWER (View-Only for Admins) */}
      {activeCommentsPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Traveler Comments & Discussions</h3>
                  <p className="text-[11px] text-slate-400">
                    Total {commentsList.length} {commentsList.length === 1 ? 'comment' : 'comments'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingComments ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                  Loading comments…
                </div>
              ) : commentsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No comments published on this post yet.
                </div>
              ) : (
                commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {c.userAvatar ? (
                          <img
                            src={c.userAvatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                            {c.userName?.[0] || 'T'}
                          </div>
                        )}
                        <span className="font-bold text-amber-400">{c.userName}</span>
                        {c.userRole && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {c.userRole}
                          </span>
                        )}
                        {c.userHandle && (
                          <span className="text-[11px] text-slate-500">{c.userHandle}</span>
                        )}
                      </div>
                      {c.createdAt && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    {c.userEmail && (
                      <div className="text-[10px] text-slate-500 font-mono pl-8">{c.userEmail}</div>
                    )}
                    <p className="text-xs text-slate-200 pl-8">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Read-Only Notice for Admins (No comment submission) */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Admins have read-only access. Comments are submitted by community travelers.</span>
            </div>
          </div>
        </div>
      )}

      {/* POST VIEWERS MODAL (Who viewed this post) */}
      {activeViewsPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Post Viewers Directory</h3>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-cyan-400 font-bold">{viewsList.length}</span> registered {viewsList.length === 1 ? 'traveler' : 'travelers'} viewed this post
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveViewsPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingViews ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                  Loading post viewers…
                </div>
              ) : viewsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                  <Eye className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No registered travelers have viewed this post yet.</p>
                  <p className="text-[11px] text-slate-500">
                    When registered platform travelers browse this photo, their profiles and timestamps will appear here.
                  </p>
                </div>
              ) : (
                viewsList.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                          {item.name?.[0] || 'T'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          {item.name}
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                            {item.role || 'USER'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">@{item.username}</div>
                        {item.email && (
                          <div className="text-[10px] text-slate-500 truncate font-mono">
                            {item.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        VIEWED
                      </span>
                      {item.viewedAt && (
                        <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                          {new Date(item.viewedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          {new Date(item.viewedAt).toLocaleTimeString([], {
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

            {/* Read-Only Notice for Admins */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Admins excluded. View counts increment once per registered platform traveler.</span>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS & RATINGS MODAL (Who rated this post) */}
      {activeRatingsPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Traveler Reviews & Star Ratings</h3>
                  <p className="text-[11px] text-slate-400">
                    {ratingsList.length} {ratingsList.length === 1 ? 'review' : 'reviews'} • Average{' '}
                    <span className="text-amber-400 font-bold">
                      {activeRatingsPost.averageRating > 0 ? `${activeRatingsPost.averageRating.toFixed(1)} ★` : '0 ★'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRatingsPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingRatings ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                  Loading traveler reviews…
                </div>
              ) : ratingsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                  <Star className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No reviews submitted yet.</p>
                  <p className="text-[11px] text-slate-500">
                    When registered community travelers rate this destination, their feedback and ratings will appear here.
                  </p>
                </div>
              ) : (
                ratingsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.user?.avatarUrl ? (
                        <img
                          src={item.user.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                          {item.user?.name?.[0] || 'T'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          {item.user?.name || 'Traveler'}
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            {item.user?.role || 'USER'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          @{item.user?.username || 'traveler'}
                        </div>
                        {item.user?.email && (
                          <div className="text-[10px] text-slate-500 truncate font-mono">
                            {item.user.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating} ★</span>
                      </div>
                      {item.ratedAt && (
                        <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                          {new Date(item.ratedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Read-Only Notice for Admins */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Admins have read-only inspection access. Star ratings are submitted by verified travelers.</span>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Admin Moderation) */}
      {deleteTargetPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Photo Post?</h3>
                <p className="text-xs text-slate-400">
                  {deleteTargetPost.isAdminPost
                    ? 'This will remove the official admin post from the feed.'
                    : `This will moderate and remove @${deleteTargetPost.user.handle}'s post.`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 line-clamp-2">
              &quot;{deleteTargetPost.caption}&quot;
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetPost(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE OFFICIAL ADMIN PHOTO POST POPUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-amber-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Create Official Admin Photo Post
                  </h2>
                  <p className="text-xs text-slate-400">
                    Upload destination photos with location tags and details. Community travelers will rate, like, and repost.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handlePublishAdminPost} className="p-5 overflow-y-auto space-y-5">
              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Photo Upload (Multiple Images Supported)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Drag/Drop or Browse */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-900/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-amber-400 transition-colors mb-2" />
                    <span className="text-xs font-semibold text-white group-hover:text-amber-400">
                      Click to choose photos from device
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">PNG, JPG, WEBP up to 7MB</span>
                  </div>

                  {/* Web Image URL Alternative */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-400" /> Or paste image web URL
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Add direct image links (https://...)
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        type="url"
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddUrlImage}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 rounded-lg transition-colors cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Uploaded Images Preview Strip */}
                {uploadedImages.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                      Selected Photos ({uploadedImages.length}/10):
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {uploadedImages.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 group bg-slate-950"
                        >
                          <img
                            src={src}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Caption / Description Details */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Post Caption & Destination Details
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe this destination, travel tips, history, best time to visit, ticket costs..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Location & Traveler Rating row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location / Landmark
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Athirappilly Waterfalls"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" /> District / City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Thrissur, Kerala"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Star Rating Info (Read-only for Admins; rated exclusively by users) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Community Traveler Rating
                  </label>
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 text-slate-700" />
                      ))}
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">Unrated</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      User Rated Only
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadedImages.length === 0 || !caption.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isSubmitting ? 'Publishing Post…' : 'Publish Admin Photo Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
