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
  handleLike: (placeId: string) => void;
  handleFollow: (username: string) => void;
  setActiveTab: (tab: string) => void;
  onAddComment: (placeId: string, text: string) => void;
  onSetCommentingOnPlace?: (setter: (id: string | null) => void) => void;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  pointedPlaceId,
  cardPos,
  isFormOpen,
  activeTab,
  savedPlaces,
  user,
  followingSet,
  handleLike,
  handleFollow,
  setActiveTab,
  onAddComment,
  onSetCommentingOnPlace,
}) => {
  const [commentingOnPlace, setCommentingOnPlace] = useState<string | null>(null);
  React.useEffect(() => { onSetCommentingOnPlace?.(setCommentingOnPlace); }, []);
  const [commentInput, setCommentInput] = useState('');

  const handleAddComment = (placeId: string) => {
    onAddComment(placeId, commentInput);
    setCommentInput('');
  };

  return (
    <>
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
      handleLike={handleLike}
      handleFollow={handleFollow}
      setActiveTab={setActiveTab}
      setCommentingOnPlace={setCommentingOnPlace}
      setCommentInput={setCommentInput}
      handleAddComment={handleAddComment}
    />
    </>
  );
};
