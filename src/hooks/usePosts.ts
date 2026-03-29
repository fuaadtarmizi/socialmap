import React, { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, deletePost } from '../lib/api';
import { SavedPlace, Comment, formatCount } from '../components/PostingCard';
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

  // Load posts on mount
  useEffect(() => {
    if (!user) return;
    getPosts()
      .then((posts: any[]) => setSavedPlaces(posts.map(apiToPlace)))
      .catch((err: any) => console.error('Failed to load posts:', err));
  }, [user]);

  const handleLike = async (placeId: string) => {
    if (!user) return;
    const userId = user.id;

    let newLikedBy: string[] = [];
    let wasLiked = false;
    setSavedPlaces(prev => prev.map(p => {
      if (p.id !== placeId) return p;
      const idx = p.likedBy.indexOf(userId);
      wasLiked = idx !== -1;
      newLikedBy = idx === -1 ? [...p.likedBy, userId] : p.likedBy.filter(id => id !== userId);
      return { ...p, likedBy: newLikedBy };
    }));
    if (!wasLiked) {
      const place = savedPlacesRef.current.find(p => p.id === placeId);
      const postOwner = place?.username || 'someone';
      pushActivity({
        type: 'like',
        user: postOwner,
        avatar: place?.avatar || null,
        content: `liked "${place?.name || 'a post'}"`,
      });
    }

    const likeCountEl = document.getElementById(`like-count-${placeId}`);
    const likeIconEl = document.getElementById(`like-icon-${placeId}`);
    const place = savedPlacesRef.current.find(p => p.id === placeId);
    const alreadyLiked = place?.likedBy.includes(userId) ?? false;
    if (likeCountEl) likeCountEl.textContent = formatCount(newLikedBy.length || (place ? place.likedBy.length + (alreadyLiked ? -1 : 1) : 0));
    if (likeIconEl) {
      const willBeLiked = !alreadyLiked;
      likeIconEl.setAttribute('fill', willBeLiked ? '#ff3366' : 'none');
      likeIconEl.setAttribute('stroke', willBeLiked ? '#ff3366' : 'white');
    }

    if (!tokenRef.current) return;
    try {
      const res = await fetch(`/api/posts/${placeId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPlaces(prev => prev.map(p =>
          p.id === placeId ? { ...p, likedBy: data.likedBy } : p
        ));
        if (likeCountEl) likeCountEl.textContent = formatCount(data.likedBy.length);
        if (likeIconEl) {
          likeIconEl.setAttribute('fill', data.liked ? '#ff3366' : 'none');
          likeIconEl.setAttribute('stroke', data.liked ? '#ff3366' : 'white');
        }
      }
    } catch (err) { console.error("Failed to sync like", err); }
  };

  const handleAddComment = async (placeId: string, text: string) => {
    if (!user || !text.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    const commentedPlace = savedPlacesRef.current.find(p => p.id === placeId);
    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    pushActivity({
      type: 'reply',
      user: commentedPlace?.username || 'someone',
      avatar: commentedPlace?.avatar || null,
      content: `replied to "${commentedPlace?.name || 'a post'}": "${newComment.text}"`,
    });
    if (tokenRef.current) {
      try {
        await fetch(`/api/posts/${placeId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ text: newComment.text })
        });
      } catch (err) { console.error("Failed to sync comment", err); }
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
