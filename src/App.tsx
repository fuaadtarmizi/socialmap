import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Info, X, Compass, Layers, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';

export interface Place {
  name: string;
  address?: string;
  rating?: number;
  description?: string;
  lat: number;
  lng: number;
  url?: string;
}
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ text: string; places: Place[] } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // SF default
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res: { text: string; places: Place[] } = { text: '', places: [] };
    setResults(res);
    setIsSearching(false);
    setShowSidebar(true);

    // If we found places, let's try to center on the first one if it has coords
    // (In a real app, we'd geocode the results if the API doesn't provide them)
    // For this demo, we'll simulate some coordinates if they are missing
    if (res.places.length > 0) {
      // Mocking coordinates for demo purposes since grounding metadata extraction is tricky
      const mockPlaces = res.places.map((p, i) => ({
        ...p,
        id: `place-${i}`,
        lat: mapCenter[0] + (Math.random() - 0.5) * 0.02,
        lng: mapCenter[1] + (Math.random() - 0.5) * 0.02,
      }));
      setResults({ ...res, places: mockPlaces });
    }
  };

  const markers = results?.places.map(p => ({
    id: p.name,
    position: [p.lat, p.lng] as [number, number],
    title: p.name,
    description: p.description || "Found via Lumina AI"
  })) || [];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-100">
      {/* Map Background */}
      <Map 
        center={mapCenter} 
        zoom={zoom} 
        markers={markers}
      />

      {/* Top Search Bar */}
      {/* <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transition-all group-focus-within:ring-2 ring-blue-500/50"></div>
          <div className="relative flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask Lumina: 'Best coffee shops with wifi nearby'..."
              className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <button type="submit" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <Navigation className="w-5 h-5 text-blue-500" />
              </button>
            )}
          </div>
        </form>
      </div> */}

      {/* Sidebar Results */}
      <AnimatePresence>
        {showSidebar && results && (
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-24 left-6 bottom-6 w-96 z-40 flex flex-col gap-4"
          >
            {/* AI Insights Card */}
            <div className="glass rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60%]">
              <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-800">Lumina Insights</span>
                </div>
                <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown>{results.text}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Places List */}
            <div className="glass rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-slate-200/50 bg-white/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Discovered Places
                </h3>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {results.places.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {results.places.map((place, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setMapCenter([place.lat, place.lng]);
                          setZoom(16);
                          setSelectedPlace(place);
                        }}
                        className="w-full p-4 text-left hover:bg-blue-50/50 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{place.name}</h4>
                          <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-600" />
                            4.5
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {place.description || "Highly rated destination recommended by Lumina AI based on your preferences."}
                        </p>
                        {place.url && (
                          <a 
                            href={place.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-wider hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on Maps
                          </a>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">No specific locations pinned yet.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-20 z-40 flex flex-col gap-3">
        <button 
          onClick={() => {
            if (userLocation) {
              setMapCenter([userLocation.lat, userLocation.lng]);
              setZoom(15);
            }
          }}
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95 group"
        >
          <Navigation className="w-5 h-5 text-slate-600 group-hover:text-blue-500" />
        </button>
        <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95 group">
          <Layers className="w-5 h-5 text-slate-600 group-hover:text-blue-500" />
        </button>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="glass px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            AI Engine Active
          </div>
          <div className="w-px h-3 bg-slate-300"></div>
          <div>Grounding: Google Maps</div>
          <div className="w-px h-3 bg-slate-300"></div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Feedback
          </div>
        </div>
      </div>
    </div>
  );
}
