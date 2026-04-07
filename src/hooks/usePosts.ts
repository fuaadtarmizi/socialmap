import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPosts, createPost, deletePost, addComment, likePost } from '../lib/api';
import { SavedPlace, Comment } from '../components/PostingCard';
import { AuthUser } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ActivityPayload {
  type: 'follow' | 'like' | 'reply' | 'repost';
  user: string;
  avatar: string;
  content: string;
}

interface UsePostsParams {
  user: AuthUser | null;
  token: string | null;
  avatarUrl: string | null;
  pushActivity: (item: ActivityPayload) => void;
  previewCoords: { lat: number; lng: number } | null;
  formAddress: string;
  formDescription: string;
  formImages: string[];
  setFormAddress: (v: string) => void;
  setFormDescription: (v: string) => void;
  setFormImages: React.Dispatch<React.SetStateAction<string[]>>;
  setPreviewCoords: (v: { lat: number; lng: number } | null) => void;
  setIsFormOpen: (v: boolean) => void;
}

const parseImages = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

const apiToPlace = (p: any): SavedPlace => {
  try {
    return {
      id: p.id,
      userId: p.userId ?? p.user_id ?? '',
      username: p.username ?? '',
      avatar: p.avatar || null,
      name: p.name || '',
      description: p.description || '',
      address: p.address || '',
      lat: Number(p.lat) || 0,
      lng: Number(p.lng) || 0,
      images: parseImages(p.images),
      likedBy: Array.isArray(p.likedBy) ? p.likedBy : Array.isArray(p.liked_by) ? p.liked_by : [],
      comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
        id: c.id,
        userId: c.userId ?? c.user_id ?? '',
        username: c.username ?? '',
        text: c.text ?? '',
        createdAt: c.createdAt ?? c.created_at ?? '',
      })) : [],
      viewedBy: new Array(Math.max(0, Number(p.views) || 0)).fill(''),
    };
  } catch (e) {
    console.error('apiToPlace failed for post', p?.id, e);
    return null as any;
  }
};

export const usePosts = ({
  user,
  token,
  avatarUrl,
  pushActivity,
  previewCoords,
  formAddress,
  formDescription,
  formImages,
  setFormAddress,
  setFormDescription,
  setFormImages,
  setPreviewCoords,
  setIsFormOpen,
}: UsePostsParams) => {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const savedPlacesRef = useRef<SavedPlace[]>([]);
  const tokenRef = useRef<string | null>(token);
  const socketRef = useRef<Socket | null>(null);
  // Track which like/comment events we sent ourselves so we don't double-apply
  const pendingLikeRef = useRef<Set<string>>(new Set());
  const pendingCommentRef = useRef<Set<string>>(new Set());

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { savedPlacesRef.current = savedPlaces; }, [savedPlaces]);

  // Initial fetch + real-time socket
  useEffect(() => {
    getPosts()
      .then((posts: any[]) => setSavedPlaces(posts.map(apiToPlace).filter(Boolean)))
      .catch((err: any) => console.error('Failed to load posts:', err));

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Re-fetch on reconnect (not first connect) to catch missed events while offline
    socket.on('reconnect', () => {
      getPosts()
        .then((posts: any[]) => {
          const mapped = posts.map(apiToPlace).filter(Boolean);
          if (mapped.length > 0) setSavedPlaces(mapped);
        })
        .catch(() => {});
    });

    socket.on('post:created', (post: any) => {
      setSavedPlaces(prev => {
        if (prev.find(p => p.id === post.id)) return prev; // already added optimistically
        return [apiToPlace(post), ...prev];
      });
    });

    socket.on('post:liked', ({ postId, likedBy }: { postId: string; likedBy: string[] }) => {
      if (pendingLikeRef.current.has(postId)) return; // our own action, already handled optimistically
      setSavedPlaces(prev => prev.map(p => p.id === postId ? { ...p, likedBy } : p));
      const countEl = document.getElementById(`like-count-${postId}`);
      if (countEl) countEl.textContent = String(likedBy.length);
    });

    socket.on('post:commented', ({ postId, comment }: { postId: string; comment: Comment }) => {
      if (pendingCommentRef.current.has(postId)) return; // our own action, already handled optimistically
      setSavedPlaces(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      ));
    });

    socket.on('post:viewed', ({ postId, views }: { postId: string; views: number }) => {
      setSavedPlaces(prev => prev.map(p =>
        p.id === postId ? { ...p, viewedBy: new Array(views).fill('') } : p
      ));
    });

    socket.on('post:deleted', ({ postId }: { postId: string }) => {
      setSavedPlaces(prev => prev.filter(p => p.id !== postId));
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  const handleLike = async (placeId: string) => {
    if (!user || !tokenRef.current) return;
    const userId = user.id;

    const place = savedPlacesRef.current.find(p => p.id === placeId);
    const wasLiked = place?.likedBy.includes(userId) ?? false;
    const newLikedBy = wasLiked
      ? (place?.likedBy ?? []).filter(id => id !== userId)
      : [...(place?.likedBy ?? []), userId];

    // Optimistic update
    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, likedBy: newLikedBy } : p
    ));
    const countEl = document.getElementById(`like-count-${placeId}`);
    if (countEl) countEl.textContent = String(newLikedBy.length);

    // Suppress the socket echo for this action
    pendingLikeRef.current.add(placeId);
    try {
      const data = await likePost(tokenRef.current, placeId);
      const finalLikedBy = Array.isArray(data.likedBy) ? data.likedBy : newLikedBy;
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId ? { ...p, likedBy: finalLikedBy } : p
      ));
      if (countEl) countEl.textContent = String(finalLikedBy.length);
      if (!wasLiked) {
        pushActivity({
          type: 'like',
          user: place?.username || 'someone',
          avatar: place?.avatar || null,
          content: `liked "${place?.name || 'a post'}"`,
        });
      }
    } catch (err) {
      console.error('Failed to sync like', err);
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId ? { ...p, likedBy: place?.likedBy ?? [] } : p
      ));
      if (countEl) countEl.textContent = String(place?.likedBy.length ?? 0);
    } finally {
      pendingLikeRef.current.delete(placeId);
    }
  };

  const handleAddComment = async (placeId: string, text: string) => {
    if (!user || !text.trim() || !tokenRef.current) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      userId: user.id,
      username: user.username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, comments: [...p.comments, optimistic] } : p
    ));

    pendingCommentRef.current.add(placeId);
    try {
      const saved = await addComment(tokenRef.current, placeId, text.trim());
      // Replace temp comment with real one from server
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId
          ? { ...p, comments: p.comments.map(c => c.id === tempId ? { ...optimistic, id: saved.id ?? tempId } : c) }
          : p
      ));
      const commentedPlace = savedPlacesRef.current.find(p => p.id === placeId);
      pushActivity({
        type: 'reply',
        user: commentedPlace?.username || 'someone',
        avatar: commentedPlace?.avatar || null,
        content: `replied to "${commentedPlace?.name || 'a post'}": "${text.trim()}"`,
      });
    } catch (err) {
      console.error('Failed to post comment', err);
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId ? { ...p, comments: p.comments.filter(c => c.id !== tempId) } : p
      ));
    } finally {
      pendingCommentRef.current.delete(placeId);
    }
  };

  const handleSavePlace = async () => {
    if (!previewCoords) {
      alert("Please locate the address first.");
      return;
    }
    if (!user || !token) {
      alert("You must be logged in to save a place.");
      return;
    }
    try {
      const post = await createPost(token, {
        name: formAddress,
        description: formDescription,
        address: formAddress,
        lat: previewCoords.lat,
        lng: previewCoords.lng,
        images: formImages,
      });
      // Add locally — socket 'post:created' will be ignored for this post (already in state)
      setSavedPlaces(prev => [apiToPlace(post), ...prev]);
      setFormAddress('');
      setFormDescription('');
      setFormImages([]);
      setPreviewCoords(null);
      setIsFormOpen(false);
      alert("Place saved successfully!");
    } catch (err: any) {
      console.error('Save place error:', err);
      alert(err.message || "Network error. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 3 - formImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImages(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFormImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePlace = async (placeId: string) => {
    setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
    if (!tokenRef.current) return;
    try {
      await deletePost(tokenRef.current, placeId);
      // socket 'post:deleted' will no-op since it's already removed
    } catch (err) {
      console.error('Failed to delete post:', err);
      const deleted = savedPlacesRef.current.find(p => p.id === placeId);
      if (deleted) setSavedPlaces(prev => [deleted, ...prev]);
    }
  };

  return {
    savedPlaces,
    setSavedPlaces,
    savedPlacesRef,
    handleLike,
    handleAddComment,
    handleSavePlace,
    handleImageUpload,
    removeFormImage,
    handleDeletePlace,
  };
};
