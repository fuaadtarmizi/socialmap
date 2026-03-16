import React from 'react';
import { Home, Plus, Bell, User, MessageCircle } from 'lucide-react';

interface BottomNavigateBarProps {
  activeTab: string;
  isFormOpen: boolean;
  setActiveTab: (tab: string) => void;
  setIsFormOpen: (open: boolean) => void;
}

export const BottomNavigateBar: React.FC<BottomNavigateBarProps> = ({
  activeTab,
  isFormOpen,
  setActiveTab,
  setIsFormOpen,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none flex justify-center px-2 sm:px-4">
      <div className="relative w-full rounded-t-md bg-black backdrop-blur-xl border border-black  px-6 py-2  pointer-events-auto flex items-center justify-between">
        <button
          onClick={() => setActiveTab('near')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'near' ? 'text-white scale-110' : 'text-slate-500'}`}
        >
          <Home size={25} strokeWidth={activeTab === 'near' ? 2.5 : 2} />
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inbox' ? 'text-white scale-110' : 'text-slate-500'}`}
        >
          <MessageCircle size={25} strokeWidth={activeTab === 'inbox' ? 2.5 : 2} />
        </button>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-9 h-9 bg-[#444446] rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform border-2 border-blue-400/30"
        >
          <Plus size={25} strokeWidth={3} />
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'activity' ? 'text-white scale-110' : 'text-slate-500'}`}
        >
          <Bell size={25} strokeWidth={activeTab === 'activity' ? 2.5 : 2} />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-white scale-110' : 'text-slate-500'}`}
        >
          <User size={25} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        </button>
      </div>
    </div>
  );
};
