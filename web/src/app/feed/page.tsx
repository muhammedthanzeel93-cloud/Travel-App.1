'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, Heart, MapPin, MessageCircle, Send, ImagePlus, RefreshCw, Star, Repeat, Sparkles, Eye } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';
import { getUserSession, subscribeToUserSession, UserSession } from '@/features/auth/userAuth';

interface FeedComment {
  userName: string;
  text: string;
  createdAt?: string;
}

interface FeedPost {
  _id: string;
  user: { name: string; handle: string; avatar: string; role?: string };
  images: string[];
  caption: string;
  locationName?: string;
  city?: string;
  likesCount: number;
  isLiked: boolean;
  repostsCount: number;
  isReposted: boolean;
  viewsCount?: number;
  averageRating: number;
  ratingsCount: number;
  userRating: number;
  isAdminPost?: boolean;
  commentsCount: number;
  comments: FeedComment[];
}

interface CommentPage {
  success: boolean;
  comments: FeedComment[];
  nextCursor: string | null;
}

export default function TravelSocialFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [commentCursors, setCommentCursors] = useState<Record<string, string | null>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const viewedPostIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
    setUser(getUserSession());
    const unsubscribe = subscribeToUserSession((session) => {
      setUser(session);
    });
    return unsubscribe;
  }, []);

  // Record unique post view when registered non-admin travelers browse feed posts
  useEffect(() => {
    if (!user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || posts.length === 0) return;
    posts.forEach((p) => {
      if (!viewedPostIdsRef.current.has(p._id)) {
        viewedPostIdsRef.current.add(p._id);
        void fetchFromApi(`/social/posts/${p._id}/view`, {
          method: 'POST',
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            email: user.email
          })
        }).catch(() => {});
      }
    });
  }, [posts, user]);

  const loadFeed = useCallback(async (cursor?: string) => {
    if (!cursor) setLoading(true);
    setError(null);
    try {
      const query = cursor ? `?limit=20&cursor=${encodeURIComponent(cursor)}` : '?limit=20';
      const data = await fetchFromApi<{ posts: FeedPost[]; nextCursor: string | null }>(`/social/feed${query}`);
      setPosts((current) => cursor ? [...current, ...(data.posts || [])] : (data.posts || []));
      setFeedCursor(data.nextCursor || null);
    } catch (err: any) {
      setError(err.message || 'Unable to load the feed.');
    } finally {
      if (!cursor) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  const createPost = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const images = imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
      await fetchFromApi('/social/posts', {
        method: 'POST', body: JSON.stringify({ images, caption, locationName })
      });
      setCaption('');
      setLocationName('');
      setImageUrls('');
      await loadFeed();
    } catch (err: any) {
      setError(err.message || 'Unable to publish post. Sign in and try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async (post: FeedPost) => {
    try {
      const desired = !post.isLiked;
      const result = await fetchFromApi<{ isLiked: boolean; newLikesCount: number }>(`/social/posts/${post._id}/like`, {
        method: 'POST', body: JSON.stringify({ liked: desired })
      });
      setPosts((current) => current.map((item) => item._id === post._id
        ? { ...item, isLiked: result.isLiked, likesCount: result.newLikesCount }
        : item));
    } catch (err: any) {
      setError(err.message || 'Sign in to like this post.');
    }
  };

  const toggleRepost = async (post: FeedPost) => {
    try {
      const desired = !post.isReposted;
      const result = await fetchFromApi<{ isReposted: boolean; newRepostsCount: number }>(`/social/posts/${post._id}/repost`, {
        method: 'POST', body: JSON.stringify({ reposted: desired })
      });
      setPosts((current) => current.map((item) => item._id === post._id
        ? { ...item, isReposted: result.isReposted, repostsCount: result.newRepostsCount }
        : item));
    } catch (err: any) {
      setError(err.message || 'Sign in to repost.');
    }
  };

  const ratePost = async (post: FeedPost, rating: number) => {
    try {
      const result = await fetchFromApi<{ userRating: number; averageRating: number; ratingsCount: number }>(`/social/posts/${post._id}/rate`, {
        method: 'POST', body: JSON.stringify({ rating })
      });
      setPosts((current) => current.map((item) => item._id === post._id
        ? { ...item, userRating: result.userRating, averageRating: result.averageRating, ratingsCount: result.ratingsCount }
        : item));
    } catch (err: any) {
      setError(err.message || 'Sign in to rate this post.');
    }
  };

  const toggleSave = async (postId: string) => {
    const desired = !savedPosts[postId];
    try {
      await fetchFromApi(`/social/posts/${postId}/save`, { method: 'POST', body: JSON.stringify({ saved: desired }) });
      setSavedPosts((current) => ({ ...current, [postId]: desired }));
    } catch (err: any) {
      setError(err.message || 'Sign in to save this post.');
    }
  };

  const loadComments = async (postId: string, cursor?: string) => {
    setLoadingComments((current) => ({ ...current, [postId]: true }));
    try {
      const query = cursor ? `?limit=20&cursor=${encodeURIComponent(cursor)}` : '?limit=20';
      const data = await fetchFromApi<CommentPage>(`/social/posts/${postId}/comments${query}`);
      setCommentsByPost((current) => ({
        ...current,
        [postId]: cursor ? [...(current[postId] || []), ...data.comments] : data.comments
      }));
      setCommentCursors((current) => ({ ...current, [postId]: data.nextCursor }));
    } catch (err: any) {
      setError(err.message || 'Unable to load comments.');
    } finally {
      setLoadingComments((current) => ({ ...current, [postId]: false }));
    }
  };

  const addComment = async (event: FormEvent, postId: string) => {
    event.preventDefault();
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try {
      await fetchFromApi(`/social/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      await loadComments(postId);
      setPosts((current) => current.map((post) => post._id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post));
    } catch (err: any) {
      setError(err.message || 'Sign in to comment.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-bold">
          <ImagePlus className="w-5 h-5 text-amber-400" /> Share a travel post
        </div>
        <form onSubmit={createPost} className="space-y-3">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={5000} required
            placeholder="Write a caption…" className="w-full min-h-24 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
          <input value={locationName} onChange={(e) => setLocationName(e.target.value)} maxLength={160}
            placeholder="Location / Destination (optional)" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white" />
          <textarea value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} required
            placeholder="Image URL (one per line)" className="w-full min-h-16 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Add direct image URLs to feature your journey.</span>
            <button disabled={busy || !isMounted || !user} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold disabled:opacity-50">
              {busy ? 'Publishing…' : isMounted && user ? 'Publish' : 'Sign in to publish'}
            </button>
          </div>
        </form>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Community travel feed</span>
        <button onClick={() => void loadFeed()} className="inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {loading ? <div className="p-10 text-center text-slate-400">Loading posts…</div> : posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">No travel posts have been published yet.</div>
      ) : posts.map((post) => (
        <article key={post._id} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
          <header className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.user.avatar ? (
                <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {post.isAdminPost ? 'A' : (post.user.name?.[0] || 'U')}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {post.user.name}
                  {post.isAdminPost && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> OFFICIAL
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{post.user.handle}</div>
              </div>
            </div>
            {post.averageRating > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{post.averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500 font-normal">({post.ratingsCount})</span>
              </div>
            )}
          </header>

          {post.images[0] && <img src={post.images[0]} alt={post.caption} className="w-full max-h-[640px] object-cover bg-slate-950" />}

          <div className="p-4 space-y-3">
            {(post.locationName || post.city) && (
              <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {[post.locationName, post.city].filter(Boolean).join(', ')}
              </div>
            )}
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{post.caption}</p>

            {/* Interactive Star Rating Selector for Feed Visitors */}
            <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Rate this spot:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => void ratePost(post, star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    title={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        (post.userRating || Math.round(post.averageRating)) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Engagement buttons: Like, Comment, Repost, Views, Save */}
            <div className="flex items-center gap-4 pt-1">
              <button onClick={() => void toggleLike(post)} className="inline-flex gap-1.5 items-center text-sm text-slate-200 hover:text-rose-400 cursor-pointer">
                <Heart className={post.isLiked ? 'w-5 h-5 fill-rose-500 text-rose-500' : 'w-5 h-5'} />
                <span>{post.likesCount}</span>
              </button>
              <span className="inline-flex gap-1.5 items-center text-sm text-slate-400">
                <MessageCircle className="w-5 h-5" />
                <span>{post.commentsCount}</span>
              </span>
              <button
                onClick={() => void toggleRepost(post)}
                className={`inline-flex gap-1.5 items-center text-sm transition-colors cursor-pointer ${
                  post.isReposted ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-emerald-400'
                }`}
                title={post.isReposted ? 'Undo repost' : 'Repost to feed'}
              >
                <Repeat className="w-5 h-5" />
                <span>{post.repostsCount}</span>
              </button>
              <span className="inline-flex gap-1.5 items-center text-sm text-slate-400" title="Views">
                <Eye className="w-5 h-5 text-cyan-400/70" />
                <span>{post.viewsCount || 0}</span>
              </span>
              <button onClick={() => void toggleSave(post._id)} aria-label={savedPosts[post._id] ? 'Unsave post' : 'Save post'} className="ml-auto text-slate-400 hover:text-amber-400 cursor-pointer">
                <Bookmark className={savedPosts[post._id] ? 'w-5 h-5 fill-amber-400 text-amber-400' : 'w-5 h-5'} />
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              {commentsByPost[post._id]?.map((comment, index) => (
                <p key={`${comment.createdAt || ''}-${index}`} className="text-xs text-slate-300">
                  <strong className="text-amber-400">{comment.userName}</strong> {comment.text}
                </p>
              ))}
              {post.commentsCount > 0 && !commentsByPost[post._id] && (
                <button onClick={() => void loadComments(post._id)} disabled={loadingComments[post._id]} className="text-xs text-amber-400 cursor-pointer">
                  {loadingComments[post._id] ? 'Loading comments…' : `View ${post.commentsCount} comments`}
                </button>
              )}
              {commentCursors[post._id] && (
                <button onClick={() => void loadComments(post._id, commentCursors[post._id] || undefined)} disabled={loadingComments[post._id]} className="text-xs text-amber-400 cursor-pointer">
                  Load more comments
                </button>
              )}
              <form onSubmit={(event) => void addComment(event, post._id)} className="flex gap-2">
                <input value={commentDrafts[post._id] || ''} onChange={(e) => setCommentDrafts((current) => ({ ...current, [post._id]: e.target.value }))}
                  maxLength={2000} placeholder={isMounted && user ? 'Add a comment…' : 'Sign in to comment'} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                <button disabled={!isMounted || !user} aria-label="Send comment" className="text-amber-400 disabled:opacity-40 cursor-pointer"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        </article>
      ))}
      {!loading && feedCursor && <button onClick={() => void loadFeed(feedCursor)} className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm text-amber-400">Load more posts</button>}
    </div>
  );
}
