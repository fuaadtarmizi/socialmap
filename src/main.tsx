
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FormSection } from './components/FormSection';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Login } from './api/Login';
import { Signup } from './api/Signup';
import { Home, Send, Plus, Bell, User, MoreHorizontal, Pin, Heart, MessageCircle, Repeat, Share, MapPin } from 'lucide-react';

/**
 * Lumina Maps - Enhanced with Image Support
 * Users can now add 3 images to each place they save.
 */

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface SavedPlace {
  id: string;
  lat: number;
  lng: number;
  name: string;
  description: string;
  address: string;
  images: string[];
  likedBy: string[];
  comments: Comment[];
  viewedBy: string[];
  username?: string;
  avatar?: string;
}

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const CATEGORIES = [
  { id: 'news', label: 'Breaking News', icon: '📍', color: '#ef4444', type: 'pin' },
  { id: 'traffic', label: 'Traffic', icon: '🚦', color: '#f59e0b', type: 'circle' },
  { id: 'flood', label: 'Flood', icon: '🌧️', color: '#3b82f6', type: 'circle' },
  { id: 'crime', label: 'Crime', icon: '🚔', color: '#1e293b', type: 'pin' },
];

const generateDefaultPlaces = (): SavedPlace[] => [];

interface ActivityItem {
  id: string;
  type: 'follow' | 'like' | 'reply' | 'repost';
  user: string;
  avatar: string;
  time: Date;
  content: string;
}

const formatActivityTime = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};


function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAPTILER_STYLE = 'https://api.maptiler.com/maps/streets-v4/style.json?key=uClWUmJSFRqvN0ScbvIw';

const App = () => {
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lumina_token'));
  const [authLoading, setAuthLoading] = useState(true);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Form State
  const [formAddress, setFormAddress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [username, setUsername] = useState('WanderlustLara');
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(generateDefaultPlaces());
  const [locating, setLocating] = useState(false);
  
  // Discovery State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [pointedPlaceId, setPointedPlaceId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [userFollowers, setUserFollowers] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState('All');

  const pushActivity = (item: Omit<ActivityItem, 'id' | 'time'>) => {
    setActivities(prev => [{ ...item, id: Date.now().toString(), time: new Date() }, ...prev]);
  };

  const handleFollow = (targetUsername: string) => {
    const isFollowing = followingSet.has(targetUsername);
    setFollowingSet(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetUsername) : next.add(targetUsername);
      return next;
    });
    setUserFollowers(prev => ({
      ...prev,
      [targetUsername]: (prev[targetUsername] ?? 74) + (isFollowing ? -1 : 1),
    }));
    if (!isFollowing) {
      pushActivity({
        type: 'follow',
        user: targetUsername,
        avatar: `https://i.pravatar.cc/150?u=${targetUsername}`,
        content: 'started following you',
      });
    }
  };
  
  const mapRef = useRef<maplibregl.Map | null>(null);
  const savedMarkersRef = useRef<maplibregl.Marker[]>([]);
  const savedPlacesRef = useRef<SavedPlace[]>([]);
  const discoveryMarkersRef = useRef<maplibregl.Marker[]>([]);
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<string | null>(token);
  useEffect(() => { tokenRef.current = token; }, [token]);
  const [commentingOnPlace, setCommentingOnPlace] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const handleLike = async (placeId: string) => {
    if (!user) return;
    const userId = user.id;

    // Optimistic local toggle — works immediately for any post (own or others)
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
        avatar: place?.avatar || `https://i.pravatar.cc/150?u=${postOwner}`,
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

    // Sync with server (if post exists there); silently ignore 404 for local-only posts
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
      // 404 = local-only post, optimistic update already applied — no action needed
    } catch (err) { console.error("Failed to sync like", err); }
  };

  const handleAddComment = async (placeId: string) => {
    if (!user || !commentInput.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: commentInput.trim(),
      createdAt: new Date().toISOString(),
    };
    // Optimistic local update — works for any post
    const commentedPlace = savedPlacesRef.current.find(p => p.id === placeId);
    setSavedPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    setCommentInput('');
    pushActivity({
      type: 'reply',
      user: commentedPlace?.username || 'someone',
      avatar: commentedPlace?.avatar || `https://i.pravatar.cc/150?u=${commentedPlace?.username}`,
      content: `replied to "${commentedPlace?.name || 'a post'}": "${newComment.text}"`,
    });
    // Sync with server (ignore 404 for local-only posts)
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

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('lumina_token');
          setToken(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  // Initialize Map
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (user && !mapRef.current && mapContainer) {
      const initialLat = 3.4083;
      const initialLng = 101.5556;

      mapRef.current = new maplibregl.Map({
        container: mapContainer,
        style: MAPTILER_STYLE,
        center: [initialLng, initialLat],
        zoom: 13,
        attributionControl: false,
      });

      mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

      mapRef.current.on('move', () => {
        if (!savedPlacesRef.current?.length) return;
        const center = mapRef.current!.getCenter();
        let closestId: string | null = null;
        let minDistance = Infinity;

        savedPlacesRef.current.forEach((place) => {
          const dist = haversineDistance(center.lat, center.lng, place.lat, place.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = place.id;
          }
        });

        if (closestId && minDistance < 300) {
          setPointedPlaceId(closestId);
          const place = savedPlacesRef.current.find((p) => p.id === closestId);
          if (place) {
            const point = mapRef.current!.project([place.lng, place.lat]);
            setCardPos({ x: point.x, y: point.y });
            // Record view — 1 per unique user
            const viewerId = user?.id || 'guest';
            if (!place.viewedBy.includes(viewerId)) {
              setSavedPlaces(prev => prev.map(p =>
                p.id === closestId ? { ...p, viewedBy: [...p.viewedBy, viewerId] } : p
              ));
            }
          }
        } else {
          setPointedPlaceId(null);
          setCardPos(null);
        }
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude });
            mapRef.current!.flyTo({ center: [longitude, latitude], zoom: 14 });

            const userEl = document.createElement('div');
            userEl.style.cssText = 'width:16px;height:16px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)';
            new maplibregl.Marker({ element: userEl })
              .setLngLat([longitude, latitude])
              .setPopup(new maplibregl.Popup().setHTML('<p style="padding:4px;margin:0">Your Location</p>'))
              .addTo(mapRef.current!);
          },
          (err) => console.warn("Geolocation denied", err)
        );
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [user]);

  // Update Preview Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }

    if (previewCoords) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="avatar-pin-container" style="animation: bounce 10s infinite alternate; transform-origin: bottom center;">
          <img src="https://i.pravatar.cc/150?u=${user?.username || 'guest'}" class="avatar-pin-img" style="border-color: #ea4335" />
          <div class="avatar-pin-tip" style="background-color: #ea4335"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
        .setLngLat([previewCoords.lng, previewCoords.lat])
        .addTo(mapRef.current);

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        setPreviewCoords({ lat: lngLat.lat, lng: lngLat.lng });
        const newAddress = await reverseGeocode(lngLat.lat, lngLat.lng);
        setFormAddress(newAddress);
      });

      previewMarkerRef.current = marker;
    }
  }, [previewCoords, user]);

  // Update Saved Markers
  useEffect(() => {
    if (!mapRef.current) return;
    savedPlacesRef.current = savedPlaces;

    savedMarkersRef.current.forEach(m => m.remove());
    savedMarkersRef.current = [];

    savedPlaces.forEach(place => {
      const isPointed = place.id === pointedPlaceId;

      const el = document.createElement('div');
      el.innerHTML = `
        <div class="avatar-pin-container" style="transition: all 0.3s ease; transform: ${isPointed ? 'scale(1.2)' : 'scale(1)'}; animation: ${isPointed ? 'pin-bounce 0.8s infinite' : 'none'}">
          <img src="${place.avatar || `https://i.pravatar.cc/150?u=${place.username}`}" class="avatar-pin-img" style="border-color: ${isPointed ? '#3b82f6' : 'white'}" />
          <div class="avatar-pin-tip" style="background-color: ${isPointed ? '#3b82f6' : 'white'}"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(mapRef.current!);

      const mainImage = place.images.length > 0 ? place.images[0] : null;
      const secondaryImages = place.images.slice(1, 3);

      const cardHtml = `
        <div class="threads-card">
          <div class="threads-left">
            <div class="avatar-container">
              <img src="${place.avatar || `https://i.pravatar.cc/150?u=${place.username}`}" class="threads-avatar" />
              
            </div>
            <div class="threads-line"></div>
          </div>
          
          <div class="threads-right">
            <div class="threads-header">
              <div class="threads-user-info">
                <span class="threads-username">${place.username || 'WanderlustLara'}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6" class="verified-badge"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 5.9-5.9 1.4 1.4-7.3 7.3z"/></svg>
                <span class="threads-time">5h</span>
              </div>
              <button class="threads-follow-btn">Follow</button>
            </div>

            <div class="threads-content">
              <div class="threads-desc">${place.description}</div>
              <div class="threads-translate">Translate</div>
            </div>

            ${mainImage ? `
            <div class="threads-media">
              <img src="${mainImage}" class="threads-main-img" referrerPolicy="no-referrer" />
            </div>
            ` : ''}

            <div class="threads-actions">
              <div class="threads-action-item" onclick="handleLikePost('${place.id}')" style="cursor:pointer;">
                <svg id="like-icon-${place.id}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span id="like-count-${place.id}">${formatCount(place.likedBy.length)}</span>
              </div>
              <div class="threads-action-item" onclick="handleOpenComments('${place.id}')" style="cursor:pointer;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                <span id="comment-count-${place.id}">${formatCount(place.comments.length)}</span>
              </div>
              <div class="threads-action-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span>${formatCount(place.viewedBy.length)}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ className: 'sm-popup', offset: [0, -50], closeButton: true, maxWidth: '380px' })
        .setHTML(cardHtml);
      marker.setPopup(popup);

      let pinned = false;
      el.addEventListener('mouseenter', () => { if (!popup.isOpen()) marker.togglePopup(); });
      el.addEventListener('mouseleave', () => { if (popup.isOpen() && !pinned) marker.togglePopup(); });
      el.addEventListener('click', () => { pinned = true; });
      popup.on('close', () => { pinned = false; });

      savedMarkersRef.current.push(marker);
    });
  }, [savedPlaces, pointedPlaceId]);

  const geocodePlace = async (title: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(title)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (e) {
      console.error("Reverse geocoding error:", e);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleDiscovery = async (category: typeof CATEGORIES[0]) => {
    if (discovering) return;
    setActiveCategory(category.id);
    setDiscovering(true);
    discoveryMarkersRef.current.forEach(m => m.remove());
    discoveryMarkersRef.current = [];

    try {
      // Discovery requires an AI service — not available
    } catch (error) {
      console.error("Discovery failed:", error);
    } finally {
      setDiscovering(false);
    }
  };

  (window as any).handleAutoFill = (title: string) => {
    setFormAddress(title);
    handleLocateFromTitle(title);
  };

  const handleLocateFromTitle = async (title: string) => {
    setLocating(true);
    const coords = await geocodePlace(title);
    if (coords) {
      setPreviewCoords(coords);
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
    }
    setLocating(false);
  };

  const handleLocate = async () => {
    if (!formAddress.trim()) return;
    setLocating(true);
    const coords = await geocodePlace(formAddress);
    if (coords) {
      setPreviewCoords(coords);
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
    } else {
      alert("Could not find address. Try being more specific.");
    }
    setLocating(false);
  };

  const handleRemovePin = () => {
    setPreviewCoords(null);
    setFormAddress('');
    setFormDescription('');
    setFormImages([]);
    discoveryMarkersRef.current.forEach(m => m.remove());
    discoveryMarkersRef.current = [];
    setActiveCategory(null);
    setIsFormOpen(false);
  };

  const handleSavePlace = () => {
    if (!previewCoords) {
      alert("Please locate the address first.");
      return;
    }

    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      lat: previewCoords.lat,
      lng: previewCoords.lng,
      name: formAddress, // Use address as name since headline is removed
      description: formDescription,
      address: formAddress,
      images: formImages,
      likedBy: [],
      comments: [],
      viewedBy: [],
      username: username,
      avatar: `https://i.pravatar.cc/150?u=${username}`
    };

    setSavedPlaces([...savedPlaces, newPlace]);
    
    setFormAddress('');
    setFormDescription('');
    setFormImages([]);
    setUsername('WanderlustLara');
    setPreviewCoords(null);
    setIsFormOpen(false);
    alert("Place saved successfully!");
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

  const handleAuthSuccess = (userData: { id: string; username: string; email: string }, newToken: string) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('lumina_token');
    setToken(null);
    setUser(null);
  };

  // Expose handlers to window so map popup HTML buttons can call them
  useEffect(() => {
    (window as any).handleLikePost = (placeId: string) => handleLike(placeId);
    (window as any).handleOpenComments = (placeId: string) => setCommentingOnPlace(placeId);
  });

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#101010] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'signup') {
      return <Signup onSignup={handleAuthSuccess} onGoLogin={() => setAuthPage('login')} />;
    }
    return <Login onLogin={handleAuthSuccess} onGoSignup={() => setAuthPage('signup')} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
      <div id="map" className="absolute inset-0 z-0"></div>

      {/* ACTIVITY PAGE OVERLAY */}
      {activeTab === 'activity' && (
        <div className="absolute inset-0 z-50 bg-[#101010] flex flex-col animate-in fade-in duration-300 pb-20">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#101010]/80 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-white">Activity</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-white/5">
              {['All', 'Follows', 'Replies', 'Reposts'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-4 py-1.5 rounded-lg border text-sm font-semibold transition-all whitespace-nowrap
                    ${activityFilter === filter
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white border-white/20 hover:bg-white/5'}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="divide-y divide-white/5">
              {(() => {
                const filtered = activities.filter(item =>
                  activityFilter === 'All' ||
                  (activityFilter === 'Follows' && item.type === 'follow') ||
                  (activityFilter === 'Replies' && item.type === 'reply') ||
                  (activityFilter === 'Reposts' && item.type === 'repost')
                );
                if (filtered.length === 0) return (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" className="opacity-20">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                    <p className="text-white/20 text-sm">No activity yet</p>
                  </div>
                );
                return filtered.map((item) => (
                  <div key={item.id} className="p-4 flex gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <img src={item.avatar} className="w-10 h-10 rounded-full object-cover" />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#101010]
                        ${item.type === 'follow' ? 'bg-indigo-500' :
                          item.type === 'like' ? 'bg-pink-500' :
                          item.type === 'reply' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {item.type === 'follow' && <User size={10} fill="white" color="white" />}
                        {item.type === 'like' && <svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>}
                        {item.type === 'reply' && <svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>}
                        {item.type === 'repost' && <svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white text-sm">{item.user}</span>
                        <span className="text-white/40 text-sm">{formatActivityTime(item.time)}</span>
                      </div>
                      <p className="text-white/60 text-sm mt-0.5 leading-snug">{item.content}</p>
                    </div>
                    {item.type === 'follow' && (
                      <button
                        onClick={() => handleFollow(item.user)}
                        className={`h-8 px-4 rounded-lg border text-sm font-bold transition-colors ${
                          followingSet.has(item.user)
                            ? 'border-white/10 text-white/30'
                            : 'border-white/20 text-white hover:bg-white/5'
                        }`}
                      >
                        {followingSet.has(item.user) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ));
              })()}
            </div>
            <div className="h-24"></div> {/* Bottom spacing */}
          </div>
        </div>
      )}

      {/* INBOX PAGE OVERLAY */}
      {activeTab === 'inbox' && <Chat currentUsername={username} />}

      {/* PROFILE PAGE OVERLAY */}
      {activeTab === 'profile' && <Profile user={user} onLogout={handleLogout} followerCount={userFollowers[user?.username || ''] ?? 74} />}

      {/* FLOATING CARD FOR POINTED PLACE */}
      {pointedPlaceId && cardPos && !isFormOpen && activeTab === 'near' && (
        <div 
          className="fixed z-30 w-[320px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: cardPos.x, 
            top: cardPos.y - 40, 
            transform: 'translate(-50%, -100%)',
            transition: 'left 0.1s ease-out, top 0.1s ease-out'
          }}
        >
          <div className="bg-[#101010] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            {(() => {
              const place = savedPlaces.find(p => p.id === pointedPlaceId);
              if (!place) return null;
              const mainImage = place.images.length > 0 ? place.images[0] : null;
              return (
                <>
                <div className="threads-card" style={{ borderRadius: 0 }}>
                  <div className="threads-left">
                    <div className="avatar-container">
                      <img
                        src={place.avatar || `https://i.pravatar.cc/150?u=${place.username}`}
                        className="threads-avatar cursor-pointer"
                        onClick={() => setActiveTab('profile')}
                      />
                    </div>
                    <div className="threads-line"></div>
                  </div>
                  
                  <div className="threads-right">
                    <div className="threads-header">
                      <div className="threads-user-info">
                        <span className="threads-username">{place.username || 'WanderlustLara'}</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6" className="verified-badge"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 5.9-5.9 1.4 1.4-7.3 7.3z"/></svg>
                        <span className="threads-time">5h</span>
                      </div>
                      <button
                        className="threads-follow-btn"
                        onClick={() => handleFollow(place.username || '')}
                        style={followingSet.has(place.username || '') ? { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)' } : {}}
                      >
                        {followingSet.has(place.username || '') ? 'Following' : 'Follow'}
                      </button>
                    </div>

                    <div className="threads-content">
                      <div className="threads-desc">{place.description}</div>
                    </div>

                    {mainImage && (
                      <div className="threads-media">
                        <img src={mainImage} className="threads-main-img" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    {/* FLOATING CARD FOR POINTED PLACE */}
                    <div className="threads-actions">
                      <div
                        className="threads-action-item"
                        onClick={() => handleLike(place.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20"
                          fill={place.likedBy.includes(user?.id || '') ? '#ff3366' : 'none'}
                          stroke={place.likedBy.includes(user?.id || '') ? '#ff3366' : 'white'}
                          strokeWidth="2">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>{formatCount(place.likedBy.length)}</span>
                      </div>
                      <div
                        className="threads-action-item"
                        onClick={() => setCommentingOnPlace(commentingOnPlace === place.id ? null : place.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                          stroke={commentingOnPlace === place.id ? '#60a5fa' : 'white'}
                          strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                        </svg>
                        <span>{formatCount(place.comments.length)}</span>
                      </div>
                      <div className="threads-action-item">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        <span>{formatCount(place.viewedBy.length)}</span>
                      </div>
                    </div>

                  </div>
                </div>
                {/* INLINE COMMENT SECTION — aligned with post avatar */}
                {commentingOnPlace === place.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px 12px 16px' }}>
                    {/* Existing comments */}
                    <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
                      className="no-scrollbar">
                      {place.comments.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                          No comments yet. Be the first!
                        </p>
                      ) : (
                        place.comments.map(c => (
                          <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <img src={`https://i.pravatar.cc/150?u=${c.username}`}
                              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>{c.username} </span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{c.text}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Input row */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img src={`https://i.pravatar.cc/150?u=${user?.username}`}
                        style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <input
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(place.id)}
                        placeholder="Add a comment..."
                        autoFocus
                        style={{
                          flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, padding: '6px 10px', color: 'white', fontSize: 12, outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(place.id)}
                        disabled={!commentInput.trim()}
                        style={{
                          background: commentInput.trim() ? 'white' : 'rgba(255,255,255,0.15)',
                          color: commentInput.trim() ? 'black' : 'rgba(255,255,255,0.3)',
                          border: 'none', borderRadius: 8, padding: '6px 12px',
                          fontSize: 11, fontWeight: 700, cursor: commentInput.trim() ? 'pointer' : 'default'
                        }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* BOTTOM UI CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-none">
      </div>

      {/* STATIC BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none flex justify-center px-2 sm:px-4">
        <div className="relative w-full rounded-t-md bg-black backdrop-blur-xl border border-black  px-6 py-2  pointer-events-auto flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('near')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'near' ? 'text-white scale-110' : 'text-slate-500'}`}
          >
            <Home size={25} strokeWidth={activeTab === 'near' ? 2.5 : 2} />
          </button>
          
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inbox' ? 'text-white scale-110' : 'text-slate-500'}`}
          >
            <MessageCircle size={25} strokeWidth={activeTab === 'inbox' ? 2.5 : 2} />
          </button>

        
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-9 h-9 bg-[#444446] rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform border-2 border-blue-400/30"
          >
            <Plus size={25} strokeWidth={3} />
          </button>
        

          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'activity' ? 'text-white scale-110' : 'text-slate-500'}`}
          >
            <Bell size={25} strokeWidth={activeTab === 'activity' ? 2.5 : 2} />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-white scale-110' : 'text-slate-500'}`}
          >
            <User size={25} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          </button>
        </div>
      </div>

      {/* FORM SECTION - BOTTOM DRAWER STYLE */}
      {isFormOpen && activeTab === 'near' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:p-4 pointer-events-none">
          <div className="relative w-full  pointer-events-auto">
            <FormSection 
              formAddress={formAddress}
              setFormAddress={setFormAddress}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
              formImages={formImages}
              username={username}
              handleLocate={handleLocate}
              locating={locating}
              handleRemovePin={handleRemovePin}
              handleSavePlace={handleSavePlace}
              handleImageUpload={handleImageUpload}
              removeFormImage={removeFormImage}
              fileInputRef={fileInputRef}
            />
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 sm:gap-3">
        <button 
          onClick={() => { if (location && mapRef.current) mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 }); }}
          className="p-3 sm:p-4 bg-white/90 backdrop-blur rounded-full text-slate-800 hover:bg-blue-500 hover:text-white transition-all shadow-xl border border-white/20"
          title="My Location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
        </button>
      </div>


      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .sm-popup .maplibregl-popup-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          background: #101010;
          width: 380px;
        }
        @media (max-width: 640px) {
          .sm-popup .maplibregl-popup-content { width: 300px; }
        }
        .sm-popup .maplibregl-popup-tip { display: none; }
        .sm-popup .maplibregl-popup-close-button {
          color: #777;
          padding: 12px;
          font-size: 20px;
        }
        .sm-popup .maplibregl-popup-close-button:hover {
          color: white;
          background: none;
        }
        
        .threads-card {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #101010;
          color: white;
          display: flex;
          padding: 12px 16px;
          gap: 12px;
          border-radius: 16px;
        }
        .threads-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 44px;
          flex-shrink: 0;
        }
        .avatar-container {
          position: relative;
          width: 44px;
          height: 44px;
        }
        .threads-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          background: #222;
        }
        .avatar-plus {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #000;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #101010;
          box-shadow: 0 0 0 1px #333;
        }
        .threads-line {
          width: 2px;
          flex-grow: 1;
          background: #262626;
          border-radius: 1px;
          margin-bottom: 4px;
        }
        .threads-right {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .threads-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 20px;
        }
        .threads-user-info {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .threads-username {
          font-weight: 600;
          font-size: 15px;
          color: #f5f5f5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .threads-time {
          color: #616161;
          font-size: 15px;
          margin-left: 4px;
        }
        .threads-follow-btn {
          background: #3b82f6;
          color: #fff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 4px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .threads-follow-btn:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
        .threads-content {
          margin-top: 2px;
        }
        .threads-desc {
          font-size: 15px;
          line-height: 1.3;
          color: #f5f5f5;
          word-wrap: break-word;
        }
        .threads-translate {
          font-size: 13px;
          color: #616161;
          margin-top: 6px;
          cursor: pointer;
          font-weight: 400;
        }
        .threads-media {
          margin: 10px 0 4px 0;
          border-radius: 10px;
          overflow: hidden;
          border: 0.5px solid #333;
        }
        .threads-main-img {
          width: 100%;
          display: block;
          object-fit: cover;
          max-height: 240px;
        }
        .threads-actions {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          padding-bottom: 4px;
        }
        .threads-action-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f5f5f5;
          font-size: 13px;
        }
        .threads-action-item svg {
          stroke: #f5f5f5;
          stroke-width: 1.5;
        }
        @media (max-width: 640px) {
          .threads-card { padding: 12px; }
          .threads-left, .avatar-container { width: 36px; }
          .threads-avatar { width: 36px; height: 36px; }
          .threads-username, .threads-time, .threads-desc { font-size: 14px; }
          .threads-main-img { max-height: 160px; }
        }
        .threads-action-item svg {
          stroke: #f5f5f5;
        }
        
        .social-card {
          font-family: 'Inter', sans-serif;
          background: white;
          color: #262626;
        }
        .card-header-social {
          display: flex;
          align-items: center;
          padding: 12px;
          gap: 10px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #efefef;
        }
        .header-info {
          display: flex;
          flex-direction: column;
        }
        .username {
          font-size: 14px;
          font-weight: 600;
        }
        .meta-info {
          font-size: 11px;
          color: #8e8e8e;
        }
        .card-image-container {
          width: 100%;
          aspect-ratio: 1/1;
          overflow: hidden;
          padding: 0 12px;
        }
        .social-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }
        .card-content-social {
          padding: 12px;
        }
        .social-headline {
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }
        .social-desc {
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: #262626;
        }
        .hashtags {
          font-size: 13px;
          color: #00376b;
          margin-bottom: 12px;
        }
        .social-metrics-row {
          display: flex;
          gap: 16px;
          font-size: 13px;
          margin-bottom: 12px;
          color: #262626;
        }
        .metric-item strong {
          font-weight: 600;
        }
        .social-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #efefef;
          margin-bottom: 12px;
        }
        .action-left {
          display: flex;
          gap: 16px;
        }
        .bottom-comment {
          font-size: 12px;
          line-height: 1.4;
          padding: 8px;
          background: #f8f8f8;
          border-radius: 8px;
        }
        
        .sm-card {
          font-family: 'Inter', sans-serif;
          color: #3c4043;
        }
        .card-header {
          display: flex;
          height: 140px;
          background: #f1f3f4;
        }
        .main-img {
          flex: 2;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .side-imgs {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-left: 1px solid white;
        }
        .side-img {
          height: 50%;
          width: 100%;
          object-fit: cover;
        }
        .card-body {
          padding: 12px 16px;
        }
        .card-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 4px 0;
          line-height: 1.2;
          color: #202124;
        }
        .card-metrics {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
          color: #70757a;
        }
        .metric {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .card-meta { font-size: 13px; color: #70757a; margin-bottom: 2px; }
        .card-status { font-size: 13px; color: #70757a; margin-bottom: 4px; }
        .status-open { color: #188038; font-weight: 500; }
        .card-address { font-size: 13px; color: #70757a; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 4px; line-height: 1.4; }
        .card-desc { font-size: 12px; color: #3c4043; margin-top: 8px; border-top: 1px solid #f1f3f4; padding-top: 8px; }
        
        .card-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f0fe;
          color: #1a73e8;
          cursor: pointer;
        }
        .action-btn.blue {
          background: #e8f0fe;
          color: #1a73e8;
        }
        .action-btn:not(.blue) {
          background: #f1f3f4;
          color: #5f6368;
        }

        .preview-marker-icon { background: none; border: none; }
        .saved-marker-icon { background: none; border: none; }
        .discovery-marker-standard { background: none; border: none; pointer-events: auto !important; }

        .sm-pin {
          display: flex;
          align-items: center;
          gap: 4px;
          pointer-events: auto;
        }

        .gs-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }

        .gs-pin {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transform: translateY(-4px);
        }

        .gs-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          padding: 0 2px;
          letter-spacing: -0.2px;
        }
        
        .avatar-pin-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .avatar-pin-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          object-fit: cover;
          background: #222;
          transition: border-color 0.3s ease;
        }
        .avatar-pin-tip {
          width: 12px;
          height: 12px;
          background: white;
          transform: rotate(45deg);
          margin-top: -8px;
          z-index: -1;
          transition: background-color 0.3s ease;
        }

        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0) scale(1.2); }
          50% { transform: translateY(-10px) scale(1.2); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
