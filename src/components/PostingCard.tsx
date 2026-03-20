import React from 'react';

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
}

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
}) => {
  if (!pointedPlaceId || !cardPos || isFormOpen || activeTab !== 'near') return null;

  return (
    <div
      id="floating-posting-card"
      className="fixed z-30 w-[320px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: cardPos.x,
        top: cardPos.y - 40,
        transform: 'translate(-50%, -100%)',
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
                    {(() => {
                      const isOwner = place.userId === user?.id;
                      const src = isOwner ? (profilePhoto || place.avatar) : place.avatar;
                      return src ? (
                        <img src={src} className="threads-avatar cursor-pointer" onClick={() => setActiveTab('profile')} />
                      ) : (
                        <div className="threads-avatar cursor-pointer bg-white/10 flex items-center justify-center" onClick={() => setActiveTab('profile')}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="white" opacity="0.5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="threads-line"></div>
                </div>

                <div className="threads-right">
                  <div className="threads-header">
                    <div className="threads-user-info">
                      <span className="threads-username">{place.username || 'WanderlustLara'}</span>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6" className="verified-badge">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 5.9-5.9 1.4 1.4-7.3 7.3z" />
                      </svg>
                      <span className="threads-time">5h</span>
                    </div>
                    <button
                      className="threads-follow-btn"
                      onClick={() => handleFollow(place.username || '')}
                      style={
                        followingSet.has(place.username || '')
                          ? { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)' }
                          : {}
                      }
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

                  <div className="threads-actions">
                    <div
                      className="threads-action-item"
                      onClick={() => handleLike(place.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill={place.likedBy.includes(user?.id || '') ? '#ff3366' : 'none'}
                        stroke={place.likedBy.includes(user?.id || '') ? '#ff3366' : 'white'}
                        strokeWidth="2"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{formatCount(place.likedBy.length)}</span>
                    </div>
                    <div
                      className="threads-action-item"
                      onClick={() => setCommentingOnPlace(commentingOnPlace === place.id ? null : place.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke={commentingOnPlace === place.id ? '#60a5fa' : 'white'}
                        strokeWidth="2"
                      >
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                      </svg>
                      <span>{formatCount(place.comments.length)}</span>
                    </div>
                    <div className="threads-action-item">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{formatCount(place.viewedBy.length)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INLINE COMMENT SECTION */}
              {commentingOnPlace === place.id && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px 12px 16px' }}>
                  <div
                    style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
                    className="no-scrollbar"
                  >
                    {place.comments.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                        No comments yet. Be the first!
                      </p>
                    ) : (
                      place.comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="white" opacity="0.5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>{c.username} </span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{c.text}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {profilePhoto ? (
                      <img src={profilePhoto} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="white" opacity="0.5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                      </div>
                    )}
                    <input
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(place.id)}
                      placeholder="Add a comment..."
                      autoFocus
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '6px 10px',
                        color: 'white',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(place.id)}
                      disabled={!commentInput.trim()}
                      style={{
                        background: commentInput.trim() ? 'white' : 'rgba(255,255,255,0.15)',
                        color: commentInput.trim() ? 'black' : 'rgba(255,255,255,0.3)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: commentInput.trim() ? 'pointer' : 'default',
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
  );
};
