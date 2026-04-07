import React from 'react';
import type { Comment } from './PostingCard';

const UserIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="white" opacity="0.5">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

interface CommentSectionProps {
  comments: Comment[];
  placeId: string;
  commentInput: string;
  profilePhoto?: string | null;
  setCommentInput: (input: string) => void;
  handleAddComment: (placeId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  placeId,
  commentInput,
  profilePhoto,
  setCommentInput,
  handleAddComment,
}) => {
  return (
    <div className="border-t border-white/[0.08] px-4 pt-2.5 pb-3">
      {/* Comment list */}
      <div className="max-h-[140px] overflow-y-auto mb-2 flex flex-col gap-2 no-scrollbar">
        {comments.length === 0 ? (
          <p className="text-white/25 text-xs text-center py-2">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <div className="w-[30px] h-[30px] rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <UserIcon size={15} />
              </div>
              <div className="flex-1">
                <span className="text-white font-semibold text-xs">{c.username} </span>
                <span className="text-white/70 text-xs">{c.text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2.5 items-center">
        {profilePhoto ? (
          <img src={profilePhoto} className="w-[30px] h-[30px] rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-[30px] h-[30px] rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <UserIcon size={15} />
          </div>
        )}
        <input
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddComment(placeId)}
          placeholder="Add a comment..."
          autoFocus
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-[10px] px-2.5 py-1.5 text-white text-xs placeholder:text-white/30 outline-none"
        />
        <button
          onClick={() => handleAddComment(placeId)}
          disabled={!commentInput.trim()}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
            commentInput.trim()
              ? 'bg-white text-black cursor-pointer'
              : 'bg-white/15 text-white/30 cursor-default'
          }`}
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
