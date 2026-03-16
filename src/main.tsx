
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FormSection } from './components/FormSection';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Login } from './api/Login';
import { Signup } from './api/Signup';
import { Send, MoreHorizontal, Pin, Heart, Repeat, Share, MapPin, User } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { usePosts } from './hooks/usePosts';
import { useGeocoding } from './hooks/useGeocoding';
import { useActivity, ActivityItem, formatActivityTime } from './hooks/useActivity';
import { useMap } from './hooks/useMap';
import { SavedPlace, formatCount } from './components/PostingCard';
import { BottomNavigateBar } from './components/BottomNavigateBar';
import { FloatingCard } from './components/FloatingCard';
import { Map } from './components/Map';
import { SearchBar } from './components/SearchBar';
import { SplashScreen } from './components/SplashScreen';

/**
 * Social Map - Enhanced with Image Support
 * Users can now add 3 images to each place they save.
 */






const App = () => {
  const { user, token, authLoading, handleAuthSuccess, handleLogout } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  // Form State
  const [formAddress, setFormAddress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [username, setUsername] = useState('WanderlustLara');
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const {
    activities,
    activityFilter,
    setActivityFilter,
    followingSet,
    userFollowers,
    pushActivity,
    handleFollow,
  } = useActivity();

  const {
    savedPlaces,
    setSavedPlaces,
    savedPlacesRef,
    handleLike,
    handleAddComment,
    handleSavePlace,
    handleImageUpload,
    removeFormImage,
  } = usePosts({
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
  });

  
  const setCommentingOnPlaceRef = useRef<((id: string | null) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mapRef, location, pointedPlaceId, cardPos } = useMap({
    user,
    savedPlaces,
    setSavedPlaces,
    previewCoords,
    setPreviewCoords,
    setFormAddress,
    handleLike,
    onOpenComments: (placeId) => setCommentingOnPlaceRef.current?.(placeId),
  });

  const { locating, handleLocate } = useGeocoding({
    mapRef,
    formAddress,
    setFormAddress,
    setPreviewCoords,
  });

  const handleRemovePin = () => {
    setPreviewCoords(null);
    setFormAddress('');
    setFormDescription('');
    setFormImages([]);
    setIsFormOpen(false);
  };



  return (
    <>
      <SplashScreen isReady={!authLoading} />

      {!authLoading && !user && (
        authPage === 'signup'
          ? <Signup onSignup={handleAuthSuccess} onGoLogin={() => setAuthPage('login')} />
          : <Login onLogin={handleAuthSuccess} onGoSignup={() => setAuthPage('signup')} />
      )}

      {!authLoading && user && (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
      <Map />

      {/* SEARCH BAR */}
      {activeTab === 'map' && (
        <SearchBar
          savedPlaces={savedPlaces}
          onSelectPlace={(place) => {
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 16, pitch: 65, bearing: -20 });
            }
          }}
        />
      )}

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
            <div className="h-24"></div> 
          </div>
        </div>
      )}

      {/* INBOX PAGE OVERLAY */}
      {activeTab === 'inbox' && <Chat currentUsername={username} />}

      {/* PROFILE PAGE OVERLAY */}
      {activeTab === 'profile' && <Profile user={user} onLogout={handleLogout} followerCount={userFollowers[user?.username || ''] ?? 74} />}

      {/* FLOATING CARD FOR POINTED PLACE */}
      <FloatingCard
        pointedPlaceId={pointedPlaceId}
        cardPos={cardPos}
        isFormOpen={isFormOpen}
        activeTab={activeTab}
        savedPlaces={savedPlaces}
        user={user}
        followingSet={followingSet}
        handleLike={handleLike}
        handleFollow={handleFollow}
        setActiveTab={setActiveTab}
        onAddComment={handleAddComment}
        onSetCommentingOnPlace={setter => { setCommentingOnPlaceRef.current = setter; }}
      />

      {/* BOTTOM UI CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-none">
      </div>

      {/* STATIC BOTTOM NAVIGATION BAR */}
      <BottomNavigateBar
        activeTab={activeTab}
        isFormOpen={isFormOpen}
        setActiveTab={setActiveTab}
        setIsFormOpen={setIsFormOpen}
      />

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

    </div>
      )}
    </>
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
