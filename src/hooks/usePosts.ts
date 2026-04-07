import React, { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, deletePost, addComment, likePost } from '../lib/api';
import { SavedPlace, Comment } from '../components/PostingCard';
import { AuthUser } from './useAuth';

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

const apiToPlace = (p: any): SavedPlace => ({
  id: p.id,
  userId: p.userId,
  username: p.username,
  avatar: p.avatar || null,
  name: p.name || '',
  description: p.description || '',
  address: p.address || '',
  lat: p.lat,
  lng: p.lng,
  images: p.images || [],
  likedBy: p.likedBy || [],
  comments: (p.comments || []).map((c: any) => ({
    id: c.id,
    userId: c.userId,
    username: c.username,
    text: c.text,
    createdAt: c.createdAt,
  })),
  viewedBy: [],
});

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

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { savedPlacesRef.current = savedPlaces; }, [savedPlaces]);

  // Load posts on mount and poll every 30s so all users see live like/comment counts
  useEffect(() => {
    const fetchPosts = () =>
      getPosts()
        .then((posts: any[]) => setSavedPlaces(posts.map(apiToPlace)))
        .catch((err: any) => console.error('Failed to load posts:', err));

    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = async (placeId: string) => {
    if (!user || !tokenRef.current) return;
    const userId = user.id;

    const place = savedPlacesRef.current.find(p => p.id === placeId);
    const wasLiked = place?.likedBy.includes(userId) ?? false;
    const newLikedBy = wasLiked
      ? (place?.likedBy ?? []).filter(id => id !== userId)
      : [...(place?.likedBy ?? []), userId];

    // Optimistic update — React state + DOM span in map popup for like count
    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, likedBy: newLikedBy } : p
    ));
    const countEl = document.getElementById(`like-count-${placeId}`);
    if (countEl) countEl.textContent = String(newLikedBy.length);

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
      // Rollback
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId ? { ...p, likedBy: place?.likedBy ?? [] } : p
      ));
      if (countEl) countEl.textContent = String(place?.likedBy.length ?? 0);
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

    // Optimistic update
    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, comments: [...p.comments, optimistic] } : p
    ));

    try {
      const saved = await addComment(tokenRef.current, placeId, text.trim());
      // Replace temp comment with real server comment
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
      // Rollback optimistic update on failure
      setSavedPlaces(prev => prev.map(p =>
        p.id === placeId ? { ...p, comments: p.comments.filter(c => c.id !== tempId) } : p
      ));
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
