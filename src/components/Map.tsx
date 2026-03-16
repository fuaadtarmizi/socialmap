import React from 'react';
import { SavedPlace, formatCount } from './PostingCard';

// ─── HTML Templates ───────────────────────────────────────────────────────────
// Edit these functions to change how markers and popups look on the map.

export function previewMarkerHtml(username: string): string {
  return `
    <div class="avatar-pin-container" style="animation: bounce 10s infinite alternate; transform-origin: bottom center;">
      <img src="https://i.pravatar.cc/150?u=${username}" class="avatar-pin-img" style="border-color: #ea4335" />
      <div class="avatar-pin-tip" style="background-color: #ea4335"></div>
    </div>
  `;
}

export function placeMarkerHtml(avatarSrc: string, isPointed: boolean): string {
  return `
    <div class="avatar-pin-container" style="transition: all 0.3s ease; transform: ${isPointed ? 'scale(1.2)' : 'scale(1)'}; animation: ${isPointed ? 'pin-bounce 0.8s infinite' : 'none'}">
      <img src="${avatarSrc}" class="avatar-pin-img" style="border-color: ${isPointed ? '#3b82f6' : 'white'}" />
      <div class="avatar-pin-tip" style="background-color: ${isPointed ? '#3b82f6' : 'white'}"></div>
    </div>
  `;
}

export function placePopupHtml(place: SavedPlace): string {
  const mainImage = place.images.length > 0 ? place.images[0] : null;
  const avatarSrc = place.avatar || `https://i.pravatar.cc/150?u=${place.username}`;
  return `
    <div class="threads-card">
      <div class="threads-left">
        <div class="avatar-container">
          <img src="${avatarSrc}" class="threads-avatar" />
        </div>
        <div class="threads-line"></div>
      </div>
      <div class="threads-right">
        <div class="threads-header">
          <div class="threads-user-info">
            <span class="threads-username">${place.username || 'Anonymous'}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#0095f6"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.4-1.4 2.7 2.7 5.9-5.9 1.4 1.4-7.3 7.3z"/></svg>
            <span class="threads-time">5h</span>
          </div>
          <button class="threads-follow-btn">Follow</button>
        </div>
        <div class="threads-content">
          <div class="threads-desc">${place.description}</div>
          <div class="threads-translate">Translate</div>
        </div>
        ${mainImage ? `<div class="threads-media"><img src="${mainImage}" class="threads-main-img" referrerPolicy="no-referrer" /></div>` : ''}
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
}

// ─── Map UI Component ─────────────────────────────────────────────────────────

export const Map = () => (
  <div id="map" className="absolute inset-0 z-0" />
);
