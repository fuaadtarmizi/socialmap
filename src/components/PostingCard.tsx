import React from 'react';
import { CommentSection } from './Comment';
import { LikeButton } from './Like';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface SavedPlace {
  id: string;
  userId?: string;
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

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

interface PostingCardProps {
  pointedPlaceId: string | null;
  cardPos: { x: number; y: number } | null;
  isFormOpen: boolean;
  activeTab: string;
  savedPlaces: SavedPlace[];
  user: { id: string; username: string; email: string } | null;
  followingSet: Set<string>;
  commentingOnPlace: string | null;
  commentInput: string;
  profilePhoto?: string | null;
  handleLike: (placeId: string) => void;
  handleFollow: (username: string) => void;
  setActiveTab: (tab: string) => void;
  setCommentingOnPlace: (id: string | null) => void;
  setCommentInput: (input: string) => void;
  handleAddComment: (placeId: string) => void;
  onViewProfile?: (userId: string, username: string, avatar?: string | null) => void;
}

const UserIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="white" opacity="0.5">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export const PostingCard: React.FC<PostingCardProps> = ({
  pointedPlaceId,
  cardPos,
  isFormOpen,
  activeTab,
  savedPlaces,
  user,
  followingSet,
  commentingOnPlace,
  commentInput,
  profilePhoto,
  handleLike,
  handleFollow,
  setActiveTab,
  setCommentingOnPlace,
  setCommentInput,
  handleAddComment,
  onViewProfile,
}) => {
  if (!pointedPlaceId || !cardPos || isFormOpen || activeTab !== 'near') return null;

  const place = savedPlaces.find(p => p.id === pointedPlaceId);
  if (!place) return null;

  const mainImage = place.images.length > 0 ? place.images[0] : null;
  const isOwner = place.userId === user?.id;
  const avatarSrc = isOwner ? (profilePhoto || place.avatar) : place.avatar;
  const isCommenting = commentingOnPlace === place.id;
  const isFollowing = followingSet.has(place.username || '');

  const handleAvatarClick = () => {
    if (isOwner) {
      setActiveTab('profile');
    } else if (place.userId) {
      onViewProfile?.(place.userId, place.username || '', place.avatar);
    }
  };

  return (
    <div
      id="floating-posting-card"
      className="fixed z-30 w-[320px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
      style={{ left: cardPos.x, top: cardPos.y - 40, transform: 'translate(-50%, -100%)' }}
    >
      <div className="bg-[#101010] rounded-xl shadow-2xl overflow-hidden border border-white/10">

        {/* CARD BODY */}
        <div className="flex p-1 gap-3 px-2">

          {/* LEFT COLUMN — button follow + thread line */}
          <div className="flex flex-col items-center gap-2   flex-shrink-0">
            <button
              onClick={() => handleFollow(place.username || '')}
              className={`rounded-md text-[8px] font-semibold transition-all whitespace-nowrap ${
                isFollowing
                  ? 'bg-green-400 text-white/40 border border-white/15'
                  : 'bg-blue-500 text-white border border-blue-500 hover:bg-blue-600'
              }`}
            >
              {isFollowing ? (
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
              )}
            </button>
            
            <div className="w-0.5 flex-grow bg-[#262626] rounded-sm mb-1" />
            
          </div>

          {/* RIGHT COLUMN — content */}
          <div className="flex-grow flex flex-col gap-0.5 min-w-0">

            {/* Header row */}
            <div className="flex justify-between items-center ">
              
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[15px] text-[#f5f5f5] truncate">
                  {place.username || 'Anonymous'}
                </span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 5.9-5.9 1.4 1.4-7.3 7.3z" />
                </svg>
                <span className="text-[#616161] text-[15px] ml-1">5h</span>
              </div>
              {/* <div className="relative ">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    className="w-11 h-11 rounded-full object-cover bg-[#222] cursor-pointer"
                    onClick={handleAvatarClick}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <UserIcon size={20} />
                  </div>
                )}
              </div> */}

              
            </div>

            {/* Description */}
            <div className="mt-0.5">
              <p className="text-[15px] leading-snug text-[#f5f5f5] break-words">
                {place.description}
              </p>
            </div>

            {/* Image */}
            {mainImage && (
              <div className="my-2.5 mb-1 rounded-xl overflow-hidden border border-white/10">
                <img src={mainImage} className="w-full block object-cover max-h-60" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* Action row */}
            <div className="flex gap-4 mt-3 pb-1">
              {/* Like */}
              <LikeButton
                placeId={place.id}
                likedBy={place.likedBy}
                userId={user?.id || ''}
                onLike={handleLike}
              />

              {/* Comment */}
              <button
                onClick={() => setCommentingOnPlace(isCommenting ? null : place.id)}
                className="flex items-center gap-1.5 text-[13px] text-[#f5f5f5]"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                  stroke={isCommenting ? '#60a5fa' : 'white'}
                  strokeWidth="2"
                >
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
                <span>{formatCount(place.comments.length)}</span>
              </button>

              {/* Views */}
              <div className="flex items-center gap-1.5 text-[13px] text-[#f5f5f5]">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{formatCount(place.viewedBy.length)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COMMENT SECTION */}
        {isCommenting && (
          <CommentSection
            comments={place.comments}
            placeId={place.id}
            commentInput={commentInput}
            profilePhoto={profilePhoto}
            setCommentInput={setCommentInput}
            handleAddComment={handleAddComment}
          />
        )}
      </div>
    </div>
  );
};
