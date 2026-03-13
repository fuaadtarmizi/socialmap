import React, { useState } from 'react';
import { User } from 'lucide-react';

interface ActivityItem {
  id: number;
  type: 'follow' | 'like' | 'reply' | 'mention';
  user: string;
  avatar: string;
  time: string;
  content: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [];

const filters = ['All', 'Follows', 'Replies', 'Mentions', 'Quotes', 'Reposts', 'Verified'];

export const Activity: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="absolute inset-0 z-50 bg-[#101010] flex flex-col animate-in fade-in duration-300 pb-20">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#101010]/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white">Activity</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Filter chips */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-white/5">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-lg border text-sm font-semibold transition-all whitespace-nowrap
                ${activeFilter === filter
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/20 hover:bg-white/5'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Activity list */}
        <div className="divide-y divide-white/5">
          {MOCK_ACTIVITY.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" className="opacity-20">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <p className="text-white/20 text-sm">No activity yet</p>
            </div>
          )}
          {MOCK_ACTIVITY.map((item) => (
            <div key={item.id} className="p-4 flex gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="relative flex-shrink-0">
                <img src={item.avatar} className="w-10 h-10 rounded-full object-cover" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#101010]
                  ${item.type === 'follow' ? 'bg-indigo-500' :
                    item.type === 'like' ? 'bg-pink-500' :
                    item.type === 'reply' ? 'bg-blue-500' : 'bg-green-500'}`}>
                  {item.type === 'follow' && <User size={10} fill="white" color="white" />}
                  {item.type === 'like' && (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                  {item.type === 'reply' && (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                    </svg>
                  )}
                  {item.type === 'mention' && <span className="text-[8px] font-bold text-white">@</span>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">{item.user}</span>
                  <span className="text-white/40 text-sm">{item.time}</span>
                </div>
                <p className="text-white/60 text-sm mt-0.5 leading-snug">{item.content}</p>
              </div>
              {item.type === 'follow' && (
                <button className="h-8 px-4 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/5 transition-colors">
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="h-24"></div>
      </div>
    </div>
  );
};
