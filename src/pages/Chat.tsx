import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  user: string;
  avatar: string;
  messages: Message[];
}

const now = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const INITIAL_CONVERSATIONS: Conversation[] = [];

interface ChatProps {
  currentUsername?: string;
}

export const Chat: React.FC<ChatProps> = ({ currentUsername = 'You' }) => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const openConv = conversations.find(c => c.id === openId) ?? null;

  const filtered = conversations.filter(c =>
    c.user.toLowerCase().includes(search.toLowerCase()) ||
    c.messages.at(-1)?.text.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !openId) return;
    const msg: Message = { id: Date.now().toString(), from: currentUsername, text, time: now() };
    setConversations(prev =>
      prev.map(c => c.id === openId ? { ...c, messages: [...c.messages, msg] } : c)
    );
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [openConv?.messages.length]);

  /* ── Chat thread view ── */
  if (openConv) {
    return (
      <div className="absolute inset-0 z-50 bg-[#101010] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#101010]/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setOpenId(null)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <img src={openConv.avatar} className="w-9 h-9 rounded-full object-cover" />
          <span className="font-bold text-white text-base">{openConv.user}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3">
          {openConv.messages.map(msg => {
            const isMine = msg.from === currentUsername;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white/10 text-white rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-white/30 text-[10px] mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3 bg-[#101010]">
          <img src={`https://i.pravatar.cc/150?u=${currentUsername}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-2 gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center disabled:opacity-30 hover:bg-blue-400 transition-colors"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Conversation list view ── */
  return (
    <div className="absolute inset-0 z-50 bg-[#101010] flex flex-col animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#101010]/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Search */}
        <div className="p-4">
          <div className="bg-white/5 rounded-xl flex items-center gap-3 px-4 py-2.5">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2" className="opacity-40">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent border-none outline-none text-white text-sm w-full"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="divide-y divide-white/5">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" className="opacity-20">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              <p className="text-white/20 text-sm">No messages yet</p>
            </div>
          )}
          {filtered.map(conv => {
            const last = conv.messages.at(-1);
            const unread = last?.from !== currentUsername;
            return (
              <div
                key={conv.id}
                onClick={() => setOpenId(conv.id)}
                className="p-4 flex gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer items-center"
              >
                <img src={conv.avatar} className="w-14 h-14 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">{conv.user}</span>
                    <span className="text-white/40 text-xs">{last?.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-sm truncate ${unread ? 'text-white font-semibold' : 'text-white/40'}`}>
                      {last?.from === currentUsername ? `You: ${last.text}` : last?.text}
                    </p>
                    {unread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
