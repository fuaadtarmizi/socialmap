import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
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

const rowToPlace = (row: any): SavedPlace => ({
  id: row.id,
  userId: row.user_id,
  username: row.username,
  avatar: row.avatar || null,
  name: row.name || '',
  description: row.description || '',
  address: row.address || '',
  lat: row.lat,
  lng: row.lng,
  images: row.images || [],
  likedBy: row.liked_by || [],
  comments: [],
  viewedBy: [],
});

export const usePosts = ({
  user,
  token,
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

  // Load posts + realtime subscription
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load posts:', error); return; }
        setSavedPlaces((data || []).map(rowToPlace));
      });

    // Realtime: new post from any user appears instantly
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Realtime INSERT:', payload.new);
          const newPlace = rowToPlace(payload.new);
          setSavedPlaces(prev => {
            if (prev.find(p => p.id === newPlace.id)) return prev;
            return [newPlace, ...prev];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('Realtime subscribed to posts');
        if (status === 'CHANNEL_ERROR') console.error('Realtime channel error');
      });

    return () => { supabase.removeChannel(channel); };
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

    // Update DOM in open popup
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
    if (!user) {
      alert("You must be logged in to save a place.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          username: user.username || user.email || 'user',
          avatar: '',
          name: formAddress,
          description: formDescription,
          address: formAddress,
          lat: previewCoords.lat,
          lng: previewCoords.lng,
          images: formImages,
          liked_by: [],
          views: 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Post insert error:', error);
        alert('Failed to save: ' + error.message);
        return;
      }

      console.log('Post inserted:', data);
      setSavedPlaces(prev => [rowToPlace(data), ...prev]);
      setFormAddress('');
      setFormDescription('');
      setFormImages([]);
      setPreviewCoords(null);
      setIsFormOpen(false);
      alert("Place saved successfully!");
    } catch (err) {
      console.error('Save place error:', err);
      alert("Network error. Please try again.");
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
    const { error } = await supabase.from('posts').delete().eq('id', placeId);
    if (error) {
      console.error('Failed to delete post:', error);
      setSavedPlaces(prev => {
        const deleted = savedPlacesRef.current.find(p => p.id === placeId);
        return deleted ? [deleted, ...prev] : prev;
      });
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
