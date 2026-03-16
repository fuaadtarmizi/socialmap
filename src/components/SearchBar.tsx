import React, { useState, useRef, useEffect } from 'react';
import { SavedPlace } from './PostingCard';

interface SearchBarProps {
  savedPlaces: SavedPlace[];
  onSelectPlace: (place: SavedPlace) => void;
}

export const SearchBar = ({ savedPlaces, onSelectPlace }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? savedPlaces.filter(p => {
        const q = query.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.username?.toLowerCase().includes(q)
        );
      })
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (place: SavedPlace) => {
    onSelectPlace(place);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
      {/* Input */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" className="flex-shrink-0">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search posts, places, people..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {results.map(place => (
            <button
              key={place.id}
              onClick={() => handleSelect(place)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
            >
              <img
                src={place.avatar || `https://i.pravatar.cc/150?u=${place.username}`}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{place.name || place.address}</p>
                <p className="text-xs text-slate-400 truncate">{place.description}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">@{place.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim() && results.length === 0 && (
        <div className="mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl px-4 py-5 text-center">
          <p className="text-sm text-slate-400">No posts found for "{query}"</p>
        </div>
      )}
    </div>
  );
};
