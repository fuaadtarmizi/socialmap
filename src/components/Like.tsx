import React from 'react';
import { formatCount } from './PostingCard';

interface LikeButtonProps {
  placeId: string;
  likedBy: string[];
  userId: string;
  onLike: (placeId: string) => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ placeId, likedBy, userId, onLike }) => {
  const isLiked = likedBy.includes(userId);

  return (
    <button
      onClick={() => onLike(placeId)}
      className="flex items-center gap-1.5 text-[13px] text-[#f5f5f5]"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={isLiked ? '#ff3366' : 'none'}
        stroke={isLiked ? '#ff3366' : 'white'}
        strokeWidth="2"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span>{formatCount(likedBy.length)}</span>
    </button>
  );
};
