import React, { useState, useRef, useEffect } from 'react';
import { Pin, Heart, MessageCircle, Repeat, Share, MoreHorizontal, Settings, LogOut, UserPlus, Send } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface ProfileProps {
  user: User;
  onLogout: () => void;
  isOwn?: boolean;
  followerCount?: number;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, isOwn = true, followerCount = 74 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [displayUsername] = useState(user.username);
  const [displayBio] = useState('Software Developer | Lead of PetalCode Labs\ni do coding as a hobby 🧘‍♀️');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-[#101010] flex flex-col animate-in fade-in duration-300">
     <div className="flex justify-end py-2">
        {/* More button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <MoreHorizontal size={20} className="text-white/60" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 w-44 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={16} className="text-white/50" />
                Settings
              </button>
              <div className="border-t border-white/10" />
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 text-sm hover:bg-red-500/5 transition-colors"
                onClick={() => { setMenuOpen(false); onLogout(); }}
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
     </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4">
            {/* Header */}
            <div className="flex  items-center mb-4">
                <div className="flex items-center gap-2">
                    <img
                    src={`https://i.pravatar.cc/150?u=${user.username}`}
                    className="w-16 h-16 rounded-full object-cover border border-white/10"
                    />
                </div>
                <div className="px-5">
                    <h1 className="text-2xl font-bold text-white">{displayUsername}</h1>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-white text-sm">{displayUsername.toLowerCase()}</span>
                    </div>
                </div>
            </div>

          {/* Bio */}
          <div className="text-white text-sm mb-4 leading-relaxed">
            {displayBio.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>

          {/* Followers */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <img src="https://i.pravatar.cc/150?u=1" className="w-5 h-5 rounded-full border border-[#101010]" />
                <img src="https://i.pravatar.cc/150?u=2" className="w-5 h-5 rounded-full border border-[#101010]" />
                <img src="https://i.pravatar.cc/150?u=3" className="w-5 h-5 rounded-full border border-[#101010]" />
              </div>
              <span className="text-white/40 text-sm">{followerCount} followers</span>
            </div>
            {isOwn && (
              <div className="flex items-center gap-2">
                {/* Instagram */}
                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                {/* TikTok */}
                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-black border border-white/20">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isOwn && (
            <div className="flex gap-2 mb-6">
              <button className="flex-1 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                <UserPlus size={14} />
                Follow
              </button>
              <button className="flex-1 py-2 rounded-xl border border-white/20 text-white text-sm font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Send size={14} />
                Message
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-4">
            <button className="flex-1 pb-3 text-white text-sm font-bold border-b-2 border-white">Threads</button>
            <button className="flex-1 pb-3 text-white/40 text-sm font-bold">Replies</button>
            <button className="flex-1 pb-3 text-white/40 text-sm font-bold">Media</button>
            <button className="flex-1 pb-3 text-white/40 text-sm font-bold">Reposts</button>
          </div>

          {/* Composer */}
          <div className="flex gap-3 items-center py-4 border-b border-white/5">
            <img src="https://i.pravatar.cc/150?u=fuaad" className="w-9 h-9 rounded-full object-cover" />
            <span className="text-white/30 text-sm flex-1">What's new?</span>
            <button className="px-4 py-1.5 bg-white/10 text-white/40 rounded-lg text-sm font-bold">Post</button>
          </div>

          {/* Posts */}
          <div className="divide-y divide-white/5">
            {/* Pinned post */}
            <div className="py-4">
              <div className="flex items-center gap-2 text-white/40 text-[12px] mb-2 ml-12">
                <Pin size={12} className="rotate-45" />
                <span>Pinned</span>
              </div>
              <div className="flex gap-3">
                <img src="https://i.pravatar.cc/150?u=fuaad" className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-sm">fuaadtarmizi</span>
                      <span className="text-white/40 text-sm">02/07/26</span>
                    </div>
                    <MoreHorizontal size={16} className="text-white/40" />
                  </div>
                  <p className="text-white text-sm mt-1 leading-normal">
                    hi semua, i trying to find a partner who always in the track to be success, who always stick on our mission. i have good idea IT project startup. if u demanding money on current situation, please forget it because we dont have any fund but soon will open for a partnership officially.
                  </p>
                  <p className="text-white text-sm mt-3 leading-normal">
                    A partner must be good encourage people, good in strategy to find investor. i have a skill in coding and manage project on backend but i dont have any skill to talk.
                  </p>
                  <p className="text-white text-sm mt-3 leading-normal">
                    please dm me, if u guys feel interested 😊
                  </p>
                  <div className="flex gap-4 mt-4 text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Heart size={18} />
                      <span className="text-xs">13</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle size={18} />
                      <span className="text-xs">9</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Repeat size={18} />
                      <span className="text-xs">1</span>
                    </div>
                    <Share size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Regular post */}
            <div className="py-4">
              <div className="flex gap-3">
                <img src="https://i.pravatar.cc/150?u=fuaad" className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-sm">fuaadtarmizi</span>
                      <span className="text-white/40 text-sm">1d</span>
                    </div>
                    <MoreHorizontal size={16} className="text-white/40" />
                  </div>
                  <p className="text-white text-sm mt-1 leading-normal">
                    hi semua, saya ade satu jam nak let go, jam beli dekat tiktok. condition still baru. reason jual sbb dah dapat colour lain. beli rm299 can nego utill let go. cod sahaja diterima{' '}
                    <span className="text-white/40">Translate</span>
                  </p>
                  <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                    <img src="https://picsum.photos/seed/watch1/300/400" className="w-40 h-52 rounded-lg object-cover border border-white/10" />
                    <img src="https://picsum.photos/seed/watch2/300/400" className="w-40 h-52 rounded-lg object-cover border border-white/10" />
                    <img src="https://picsum.photos/seed/watch3/300/400" className="w-40 h-52 rounded-lg object-cover border border-white/10" />
                  </div>
                  <div className="flex gap-4 mt-4 text-white/40">
                    <Heart size={18} />
                    <MessageCircle size={18} />
                    <Repeat size={18} />
                    <Share size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-24"></div>
      </div>
    </div>
  );
};
