'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bookmark, Heart, MapPin, MessageCircle, Send, ImagePlus, RefreshCw } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';
import { getUserSession } from '@/features/auth/userAuth';

interface FeedComment {
  userName: string;
  text: string;
  createdAt?: string;
}

interface FeedPost {
  _id: string;
  user: { name: string; handle: string; avatar: string };
  images: string[];
  caption: string;
  locationName?: string;
  likesCount: number;
  isLiked: boolean;
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
  const [imageUrls, setImageUrls] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const user = getUserSession();

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
        method: 'POST', body: JSON.stringify({ images, caption })
      });
      setCaption('');
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
          <textarea value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} required
            placeholder="Image URL (one per line)" className="w-full min-h-16 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Uploads are not enabled; use accessible image URLs.</span>
            <button disabled={busy || !user} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold disabled:opacity-50">
              {busy ? 'Publishing…' : user ? 'Publish' : 'Sign in to publish'}
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
        <article key={post._id} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <header className="p-4 flex items-center gap-3">
            {post.user.avatar && <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
            <div><div className="text-sm font-bold text-white">{post.user.name}</div><div className="text-xs text-slate-400">{post.user.handle}</div></div>
          </header>
          {post.images[0] && <img src={post.images[0]} alt={post.caption} className="w-full max-h-[640px] object-cover bg-slate-950" />}
          <div className="p-4 space-y-3">
            {post.locationName && <div className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" />{post.locationName}</div>}
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{post.caption}</p>
            <div className="flex items-center gap-4">
              <button onClick={() => void toggleLike(post)} className="inline-flex gap-1.5 items-center text-sm text-slate-200"><Heart className={post.isLiked ? 'w-5 h-5 fill-rose-500 text-rose-500' : 'w-5 h-5'} />{post.likesCount}</button>
              <span className="inline-flex gap-1.5 items-center text-sm text-slate-400"><MessageCircle className="w-5 h-5" />{post.commentsCount}</span>
              <button onClick={() => void toggleSave(post._id)} aria-label={savedPosts[post._id] ? 'Unsave post' : 'Save post'} className="ml-auto text-slate-400"><Bookmark className={savedPosts[post._id] ? 'w-5 h-5 fill-amber-400 text-amber-400' : 'w-5 h-5'} /></button>
            </div>
            <div className="space-y-2 border-t border-slate-800 pt-3">
              {commentsByPost[post._id]?.map((comment, index) => <p key={`${comment.createdAt || ''}-${index}`} className="text-xs text-slate-300"><strong>{comment.userName}</strong> {comment.text}</p>)}
              {post.commentsCount > 0 && !commentsByPost[post._id] && <button onClick={() => void loadComments(post._id)} disabled={loadingComments[post._id]} className="text-xs text-amber-400">{loadingComments[post._id] ? 'Loading comments…' : `View ${post.commentsCount} comments`}</button>}
              {commentCursors[post._id] && <button onClick={() => void loadComments(post._id, commentCursors[post._id] || undefined)} disabled={loadingComments[post._id]} className="text-xs text-amber-400">Load more comments</button>}
              <form onSubmit={(event) => void addComment(event, post._id)} className="flex gap-2">
                <input value={commentDrafts[post._id] || ''} onChange={(e) => setCommentDrafts((current) => ({ ...current, [post._id]: e.target.value }))}
                  maxLength={2000} placeholder={user ? 'Add a comment…' : 'Sign in to comment'} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                <button disabled={!user} aria-label="Send comment" className="text-amber-400 disabled:opacity-40"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        </article>
      ))}
      {!loading && feedCursor && <button onClick={() => void loadFeed(feedCursor)} className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm text-amber-400">Load more posts</button>}
    </div>
  );
}
