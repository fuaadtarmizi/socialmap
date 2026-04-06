import React, { useState } from 'react';
import { PostingCard, SavedPlace } from './PostingCard';

interface FloatingCardProps {
  pointedPlaceId: string | null;
  cardPos: { x: number; y: number } | null;
  isFormOpen: boolean;
  activeTab: string;
  savedPlaces: SavedPlace[];
  user: { id: string; username: string; email: string } | null;
  followingSet: Set<string>;
  profilePhoto?: string | null;
  handleLike: (placeId: string) => void;
  handleFollow: (username: string) => void;
  setActiveTab: (tab: string) => void;
  onAddComment: (placeId: string, text: string) => void;
  onSetCommentingOnPlace?: (setter: (id: string | null) => void) => void;
  onViewProfile?: (userId: string, username: string, avatar?: string | null) => void;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  pointedPlaceId,
  cardPos,
  isFormOpen,
  activeTab,
  savedPlaces,
  user,
  followingSet,
  profilePhoto,
  handleLike,
  handleFollow,
  setActiveTab,
  onAddComment,
  onSetCommentingOnPlace,
  onViewProfile,
}) => {
  const [commentingOnPlace, setCommentingOnPlace] = useState<string | null>(null);
  React.useEffect(() => { onSetCommentingOnPlace?.(setCommentingOnPlace); }, []);
  const [commentInput, setCommentInput] = useState('');

  const handleAddComment = (placeId: string) => {
    onAddComment(placeId, commentInput);
    setCommentInput('');
  };

  return (
    <PostingCard
      pointedPlaceId={pointedPlaceId}
      cardPos={cardPos}
      isFormOpen={isFormOpen}
      activeTab={activeTab}
      savedPlaces={savedPlaces}
      user={user}
      followingSet={followingSet}
      commentingOnPlace={commentingOnPlace}
      commentInput={commentInput}
      profilePhoto={profilePhoto}
      handleLike={handleLike}
      handleFollow={handleFollow}
      setActiveTab={setActiveTab}
      setCommentingOnPlace={setCommentingOnPlace}
      setCommentInput={setCommentInput}
      handleAddComment={handleAddComment}
      onViewProfile={onViewProfile}
    />
  );
};
