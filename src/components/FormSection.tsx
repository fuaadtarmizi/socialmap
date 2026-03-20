import React, { useState } from 'react';
import { MoreHorizontal, Copy, Image as ImageIcon, Smile } from 'lucide-react';

interface FormSectionProps {
  formAddress: string;
  setFormAddress: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formImages: string[];
  username: string;
  profilePhoto?: string | null;
  handleLocate: () => void;
  locating: boolean;
  handleRemovePin: () => void;
  handleSavePlace: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFormImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const FormSection: React.FC<FormSectionProps> = ({
  formAddress,
  setFormAddress,
  formDescription,
  setFormDescription,
  formImages,
  username,
  profilePhoto,
  handleLocate,
  locating,
  handleRemovePin,
  handleSavePlace,
  handleImageUpload,
  removeFormImage,
  fileInputRef,
}) => {
  return (
    <div className="w-full ">
      <div className="mb-10 w-full bg-[#101010] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden no-scrollbar">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button 
            onClick={handleRemovePin}
            className="text-white text-sm font-medium hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
          <h2 className="text-white text-sm font-bold">New Event</h2>
          <div className="flex items-center gap-3">
            <Copy className="w-4 h-4 text-white/60 cursor-pointer hover:text-white transition-colors" />
            <MoreHorizontal className="w-5 h-5 text-white/60 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex gap-4">
            {/* Left Column: Avatar and Line */}
            <div className="flex flex-col items-center">
              {profilePhoto ? (
                <img src={profilePhoto} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" opacity="0.5"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </div>
              )}
              
            </div>

            {/* Right Column: Content */}
            <div className="flex-1 space-y-4">
              {/* Header: Username and Topic */}
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base">{username || 'fuaadtarmizi'}</span>
                <span className="text-white/40 text-sm sm:text-base">›</span>
                <span className="text-white/40 text-sm sm:text-base cursor-pointer hover:text-white/60 transition-colors">Add a topic</span>
              </div>

              {/* Address Input and Locate Button */}
              <div className="space-y-2">
                <div className="relative group">
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Location / Address"
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/20 transition-all pr-20"
                  />
                  <button 
                    onClick={handleLocate}
                    disabled={locating}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/90 transition-all"
                  >
                    {locating ? '...' : 'Locate'}
                  </button>
                </div>
              </div>

              {/* Description Input: "What's new?" */}
              <div className="relative">
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What’s new in your area?"
                  rows={1}
                  className="w-full bg-transparent text-white text-sm sm:text-base placeholder-white/40 focus:outline-none resize-none overflow-hidden"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>

              

              {/* Icon Actions Row */}
              <div className="flex items-center gap-4 py-2">
                <button 
                  onClick={() => formImages.length < 3 && fileInputRef.current?.click()}
                  className="text-white/40 hover:text-white transition-colors"
                  title="Add Image"
                >
                  <ImageIcon size={20} />
                </button>
                <button className="text-white/40 hover:text-white transition-colors" title="Add GIF">
                  <span className="text-[10px] font-bold border border-white/40 rounded px-1">GIF</span>
                </button>
                <button className="text-white/40 hover:text-white transition-colors" title="Add Emoji">
                  <Smile size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload} 
                />
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6   border-white/10">
            <button 
              onClick={handleRemovePin}
              className="px-6 py-1 bg-transparent rounded-sm border border-white/10 hover:border-red-500/50 text-white/60 hover:text-red-500 font-bold transition-all text-sm"
            >
              Discard
            </button>
            <button 
              onClick={handleSavePlace}
              className="px-6 py-1 bg-white hover:bg-white/90 text-black rounded-sm font-bold shadow-lg shadow-white/5 transition-all text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
