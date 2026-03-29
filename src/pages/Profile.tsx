import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Camera,
  Grid3X3,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { SavedPlace } from '../components/PostingCard';
import { useProfile } from '../hooks/useProfile';
import { AuthUser } from '../hooks/useAuth';

interface ProfileProps {
  user: AuthUser;
  onLogout: () => void;
  isOwn?: boolean;
  followerCount?: number;
  savedPlaces?: SavedPlace[];
  onDeletePlace?: (id: string) => void;
  onPhotoChange?: (url: string) => void;
  onBack?: () => void;
}

type ProfileTab = 'places';

const ACCENT = '#ff5a5f';

export const Profile: React.FC<ProfileProps> = ({
  user,
  onLogout,
  isOwn = true,
  followerCount = 74,
  savedPlaces = [],
  onDeletePlace,
  onPhotoChange,
  onBack,
}) => {
  const myPosts = useMemo(
    () => savedPlaces.filter((p) => p.userId === user.id),
    [savedPlaces, user.id]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<ProfileTab>('places');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { profileData, loading, uploadError, updatePhoto } = useProfile(user);
  const { displayName, bio, avatarUrl: profilePhoto } = profileData;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      const clickedMenuButton = (target as HTMLElement)?.closest?.('[data-post-menu]');
      if (!clickedMenuButton) {
        setPostMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await updatePhoto(file);
    if (url) onPhotoChange?.(url);
  };

  const getPlaceImage = (place: SavedPlace) => {
    return place.images?.[0] || '';
  };

  const getPlaceTitle = (place: SavedPlace) => {
    return place.name?.trim() || 'Untitled place';
  };

  const getPlaceSubtitle = (place: SavedPlace) => {
    return place.address?.trim() || place.description?.trim() || 'No location added';
  };

  const inferCityFromPlace = (place: SavedPlace) => {
    const raw = `${place.address || ''} ${place.name || ''} ${place.description || ''}`.toLowerCase();

    if (raw.includes('kuala lumpur') || raw.includes('kl')) return 'Kuala Lumpur';
    if (raw.includes('bangkok')) return 'Bangkok';
    if (raw.includes('bali')) return 'Bali';
    if (raw.includes('tbilisi')) return 'Tbilisi';
    if (raw.includes('johor')) return 'Johor';
    if (raw.includes('penang')) return 'Penang';

    const address = place.address?.split(',')?.[0]?.trim();
    return address || 'Unknown';
  };

  const inferCategoryFromPlace = (place: SavedPlace) => {
    const raw = `${place.name || ''} ${place.description || ''} ${place.address || ''}`.toLowerCase();

    if (
      raw.includes('coffee') ||
      raw.includes('cafe') ||
      raw.includes('latte') ||
      raw.includes('espresso')
    ) {
      return 'Cafe';
    }

    if (
      raw.includes('restaurant') ||
      raw.includes('dinner') ||
      raw.includes('lunch') ||
      raw.includes('food')
    ) {
      return 'Restaurant';
    }

    if (
      raw.includes('hotel') ||
      raw.includes('stay') ||
      raw.includes('villa') ||
      raw.includes('resort')
    ) {
      return 'Stay';
    }

    if (
      raw.includes('photo') ||
      raw.includes('view') ||
      raw.includes('spot') ||
      raw.includes('tourist')
    ) {
      return 'Photo Spot';
    }

    if (
      raw.includes('cozy') ||
      raw.includes('aesthetic') ||
      raw.includes('calm')
    ) {
      return 'Cozy';
    }

    return 'Place';
  };

  const visiblePosts = useMemo(() => {
    const base = myPosts.filter((p) => !archivedIds.has(p.id));

    return base;
  }, [myPosts, archivedIds, activeTab]);

  const cityOptions = useMemo(() => {
    const list = Array.from(new Set(visiblePosts.map(inferCityFromPlace).filter(Boolean)));
    return ['All', ...list.slice(0, 8)];
  }, [visiblePosts]);

  const categoryOptions = useMemo(() => {
    const list = Array.from(new Set(visiblePosts.map(inferCategoryFromPlace).filter(Boolean)));
    return ['All', ...list.slice(0, 8)];
  }, [visiblePosts]);

  const filteredPosts = useMemo(() => {
    return visiblePosts.filter((place) => {
      const city = inferCityFromPlace(place);
      const category = inferCategoryFromPlace(place);

      const cityMatch = selectedCity === 'All' || city === selectedCity;
      const categoryMatch = selectedCategory === 'All' || category === selectedCategory;

      return cityMatch && categoryMatch;
    });
  }, [visiblePosts, selectedCity, selectedCategory]);

  const placeCount = myPosts.filter((p) => !archivedIds.has(p.id)).length;
const username = `@${user.username.toLowerCase()}`;
  const headline = bio?.trim()
    ? bio
    : 'Collecting favorite places, cozy corners and beautiful moments.';

  return (
    <div className="absolute inset-0 z-50 bg-black text-white flex flex-col animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 pt-3 pb-28">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-5">
            {onBack ? (
              <button
                onClick={onBack}
                className="w-11 h-11 rounded-full bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/12 transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            ) : (
              <div className="w-11 h-11" />
            )}

            <div className="text-center">
              <p className="text-white/55 text-sm font-medium">{username}</p>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-11 h-11 rounded-full bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/12 transition-colors"
              >
                <MoreHorizontal size={20} className="text-white" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-44 bg-[#171717] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-40">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/5 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={16} className="text-white/50" />
                    Settings
                  </button>

                  <div className="border-t border-white/10" />

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-sm hover:bg-red-500/5 transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero */}
          <div className="mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {uploadError && (
                  <p className="text-red-400 text-xs mb-2">{uploadError}</p>
                )}

                <div className="flex items-center gap-2">
                  <h1 className="text-[30px] leading-none font-semibold tracking-tight">
                    {displayName || user.username}
                  </h1>

                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
                  >
                    ✓
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-white/60 text-sm">
                  <MapPin size={14} />
                  <span>{selectedCity !== 'All' ? selectedCity : 'Kuala Lumpur'}</span>
                </div>

                <p className="mt-3 text-white/75 text-[15px] leading-6 max-w-[260px] whitespace-pre-line">
                  {headline}
                </p>

                <div className="flex items-center gap-3 mt-4 text-white/65 text-sm">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 border border-black" />
                    <div className="w-7 h-7 rounded-full bg-white/10 border border-black" />
                  </div>

                  <span>{followerCount} Followers</span>

                  <div className="w-1 h-1 rounded-full bg-white/30" />

                  <div className="flex items-center gap-2 text-white/45">
                    <span>◎</span>
                    <span>◌</span>
                  </div>
                </div>
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => isOwn && !loading && fileInputRef.current?.click()}
                  className={`relative w-[92px] h-[92px] rounded-full overflow-hidden border border-white/10 bg-white/10 flex items-center justify-center ${
                    isOwn ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" width="42" height="42" fill="white" opacity="0.5">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </button>

                {isOwn && (
                  <button
                    onClick={() => !loading && fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center border border-black shadow-lg"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          {!isOwn ? (
            <div className="flex gap-2 mb-6">
              <button className="flex-1 h-12 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                <UserPlus size={16} />
                Follow
              </button>
              <button className="flex-1 h-12 rounded-2xl border border-white/15 bg-white/5 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/8 transition-colors">
                <Send size={16} />
                Message
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <button className="w-full h-12 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-colors">
                Edit profile
              </button>
            </div>
          )}


          {/* Grid */}
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Grid3X3 size={34} className="mb-3 opacity-40" />
              <p className="text-sm">
                {activeTab === 'photos'
                  ? 'No photo posts yet'
                  : activeTab === 'guides'
                  ? 'No guides yet'
                  : 'No places yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPosts.map((place) => {
                const coverImage = getPlaceImage(place);
                const title = getPlaceTitle(place);
                const subtitle = getPlaceSubtitle(place);
                const category = inferCategoryFromPlace(place);
                const city = inferCityFromPlace(place);
                const menuOpenForCard = postMenuOpenId === place.id;

                return (
                  <div
                    key={place.id}
                    className="relative rounded-[28px] overflow-hidden bg-white/5 border border-white/8 aspect-[0.76]"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <div className="flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-[11px] text-white">
                        <span>{category === 'Cafe' ? '☕' : category === 'Restaurant' ? '🍽️' : category === 'Stay' ? '🛏️' : '📍'}</span>
                        <span className="truncate max-w-[80px]">{category}</span>
                      </div>

                      <div className="relative">
                        <button
                          data-post-menu
                          onClick={() =>
                            setPostMenuOpenId(menuOpenForCard ? null : place.id)
                          }
                          className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {menuOpenForCard && (
                          <div className="absolute right-0 top-12 w-40 bg-[#171717] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-30">
                            <button
                              className="w-full flex items-center gap-3 px-4 py-3 text-white/80 text-sm hover:bg-white/5 transition-colors"
                              onClick={() => {
                                setArchivedIds((prev) => new Set([...prev, place.id]));
                                setPostMenuOpenId(null);
                              }}
                            >
                              <Archive size={14} className="text-white/50" />
                              Archive
                            </button>

                            <div className="border-t border-white/10" />

                            <button
                              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-sm hover:bg-red-500/5 transition-colors"
                              onClick={() => {
                                onDeletePlace?.(place.id);
                                setPostMenuOpenId(null);
                              }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute left-3 right-3 bottom-3">
                      <p className="text-white text-[15px] font-semibold leading-tight line-clamp-2">
                        {title}
                      </p>

                      <p className="text-white/65 text-[12px] mt-1 truncate">
                        {city}
                      </p>

                      <p className="text-white/78 text-[12px] mt-1 line-clamp-2">
                        {subtitle}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-white/70 text-[12px]">
                        <div className="flex items-center gap-1">
                          <MessageCircle size={13} />
                          <span>{place.comments?.length || 0}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span>♡</span>
                          <span>{place.likedBy?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating bottom controls */}
      {/* <div className="absolute left-0 right-0 bottom-5 px-4 pointer-events-none">
        <div className="flex items-center justify-center gap-3">
          <button className="pointer-events-auto h-14 px-6 rounded-full bg-[#3b3b3b]/90 backdrop-blur-xl border border-white/10 text-white flex items-center gap-2 shadow-2xl">
            <Map size={18} />
            <span className="text-sm font-medium">Map</span>
          </button>

          <button className="pointer-events-auto w-14 h-14 rounded-full bg-[#2f2f2f]/90 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-2xl">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div> */}
    </div>
  );
};