'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { playChime } from '@/lib/soundAlert';
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
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
  Send,
  Building,
  User,
  Sparkles,
  Layers,
  Filter
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
  isLiked: boolean;
  repostsCount: number;
  isReposted: boolean;
  averageRating: number;
  ratingsCount: number;
  userRating: number;
  isAdminPost: boolean;
  commentsCount: number;
  createdAt: string;
}

interface CommentItem {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt?: string;
}

export default function AdminPhotosPage() {
  const [activeTab, setActiveTab] = useState<'admin_studio' | 'user_posts'>('admin_studio');
  const [adminPosts, setAdminPosts] = useState<SocialPost[]>([]);
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states for Admin Studio
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter for User Posts
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');

  // Deletion modal
  const [deleteTargetPost, setDeleteTargetPost] = useState<SocialPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active comments drawer/modal
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentDraft, setNewCommentDraft] = useState('');

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

  // Publish Post as Admin
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
          city: city.trim(),
          initialRating: selectedRating
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish post.');
      }

      showNotification('Admin photo post published successfully!', 'success');
      setUploadedImages([]);
      setCaption('');
      setLocationName('');
      setCity('');
      setSelectedRating(5);
      await fetchAllPosts(false);
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish post.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (post: SocialPost) => {
    try {
      const desired = !post.isLiked;
      const res = await fetch(`/api/social/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ liked: desired })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updater = (list: SocialPost[]) =>
          list.map((p) =>
            p._id === post._id
              ? { ...p, isLiked: data.isLiked, likesCount: data.newLikesCount }
              : p
          );
        setAdminPosts(updater);
        setUserPosts(updater);
      }
    } catch {
      showNotification('Unable to update like.', 'error');
    }
  };

  // Toggle Repost
  const handleToggleRepost = async (post: SocialPost) => {
    try {
      const desired = !post.isReposted;
      const res = await fetch(`/api/social/posts/${post._id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reposted: desired })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(
          desired ? 'Post reposted to travel feed!' : 'Post removed from reposts.',
          'success'
        );
        const updater = (list: SocialPost[]) =>
          list.map((p) =>
            p._id === post._id
              ? { ...p, isReposted: data.isReposted, repostsCount: data.newRepostsCount }
              : p
          );
        setAdminPosts(updater);
        setUserPosts(updater);
      }
    } catch {
      showNotification('Unable to update repost status.', 'error');
    }
  };

  // Rate Post
  const handleRatePost = async (post: SocialPost, rating: number) => {
    try {
      const res = await fetch(`/api/social/posts/${post._id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Rated ${rating} ★ successfully!`, 'success');
        const updater = (list: SocialPost[]) =>
          list.map((p) =>
            p._id === post._id
              ? {
                  ...p,
                  userRating: data.userRating,
                  averageRating: data.averageRating,
                  ratingsCount: data.ratingsCount
                }
              : p
          );
        setAdminPosts(updater);
        setUserPosts(updater);
      }
    } catch {
      showNotification('Unable to submit rating.', 'error');
    }
  };

  // Open Comments
  const handleOpenComments = async (postId: string) => {
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, { credentials: 'include' });
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

  // Submit Comment
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCommentsPostId || !newCommentDraft.trim()) return;

    try {
      const res = await fetch(`/api/social/posts/${activeCommentsPostId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newCommentDraft.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCommentDraft('');
        await handleOpenComments(activeCommentsPostId);
        const updater = (list: SocialPost[]) =>
          list.map((p) =>
            p._id === activeCommentsPostId
              ? { ...p, commentsCount: data.commentsCount ?? p.commentsCount + 1 }
              : p
          );
        setAdminPosts(updater);
        setUserPosts(updater);
      }
    } catch {
      showNotification('Failed to post comment.', 'error');
    }
  };

  // Confirm Delete Post
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
            Part 1: Admin Photo Studio to upload destination photos with location and ratings • Part 2: Community User Posts directory
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
          <span>Part 1: Admin Photo Studio (Upload & Publish)</span>
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
          {/* Post Creation Studio Card */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Official Admin Photo Post</h2>
                <p className="text-xs text-slate-400">
                  Upload destination photos, specify location tags, configure ratings, and allow user interactions.
                </p>
              </div>
            </div>

            <form onSubmit={handlePublishAdminPost} className="space-y-5">
              {/* Image Upload Section */}
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

              {/* Location & Rating row */}
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

                {/* Initial Rating setting */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Admin Destination Rating
                  </label>
                  <div className="flex items-center gap-1.5 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoverRating ?? selectedRating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setSelectedRating(starVal)}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-amber-400 ml-2">
                      {selectedRating}.0 ★
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || uploadedImages.length === 0 || !caption.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isSubmitting ? 'Publishing Post…' : 'Publish Admin Photo Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Admin's Published Posts Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Admin Published Posts</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-amber-400 font-extrabold">
                  {adminPosts.length}
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                Admins and travelers can rate, like, comment, and repost these
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading published admin posts…
              </div>
            ) : adminPosts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-[#0b0f19] border border-slate-800 rounded-2xl">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No admin posts published yet. Upload your first post using the studio above!
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

                      {/* Caption & Star Rating */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-3">
                          {post.caption}
                        </p>

                        {/* Interactive Star Rating Selector */}
                        <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-400 mr-1.5">
                              Rate:
                            </span>
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => void handleRatePost(post, starVal)}
                                className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                                title={`Give ${starVal} Stars`}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    (post.userRating || Math.round(post.averageRating)) >= starVal
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <div className="text-xs font-bold text-amber-400">
                            ★ {post.averageRating > 0 ? post.averageRating.toFixed(1) : 'No ratings'}{' '}
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({post.ratingsCount})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Actions Bar */}
                    <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like */}
                        <button
                          onClick={() => void handleToggleLike(post)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            post.isLiked
                              ? 'text-rose-500 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.isLiked ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span>{post.likesCount}</span>
                        </button>

                        {/* Comments */}
                        <button
                          onClick={() => void handleOpenComments(post._id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount}</span>
                        </button>

                        {/* Repost */}
                        <button
                          onClick={() => void handleToggleRepost(post)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            post.isReposted
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                          title={post.isReposted ? 'Undo repost' : 'Repost'}
                        >
                          <Repeat className="w-4 h-4" />
                          <span>{post.repostsCount}</span>
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

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>
                            {post.averageRating > 0 ? post.averageRating.toFixed(1) : 'Unrated'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({post.ratingsCount})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-3.5 py-2.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => void handleToggleLike(post)}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                          post.isLiked ? 'text-rose-500 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            post.isLiked ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => void handleOpenComments(post._id)}
                        className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.commentsCount}</span>
                      </button>

                      <button
                        onClick={() => void handleToggleRepost(post)}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                          post.isReposted ? 'text-emerald-400 font-bold' : 'hover:text-emerald-400'
                        }`}
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>{post.repostsCount}</span>
                      </button>
                    </div>

                    {/* Admin Rate */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void handleRatePost(post, s)}
                          className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                          title={`Rate ${s} stars`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              (post.userRating || Math.round(post.averageRating)) >= s
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMMENTS MODAL / DRAWER */}
      {activeCommentsPostId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400" /> Comments & Discussion
              </h3>
              <button
                onClick={() => setActiveCommentsPostId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
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
                  No comments yet. Start the conversation below!
                </div>
              ) : (
                commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">{c.userName}</span>
                      {c.createdAt && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={newCommentDraft}
                onChange={(e) => setNewCommentDraft(e.target.value)}
                placeholder="Write a comment as admin..."
                maxLength={2000}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!newCommentDraft.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
    </div>
  );
}
