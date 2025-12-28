
import React, { useState } from 'react';
import { AppMode } from './types';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import ImageGenerator from './components/ImageGenerator';

const HelixLogo = () => (
  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
    <span className="text-white font-black text-xl italic tracking-tighter">H</span>
  </div>
);

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  const handleSignIn = () => {
    // Simulated Google Sign In
    setUser({ name: "Aarya Gujari", email: "aarya@example.com" });
  };

  const handleSignOut = () => {
    setUser(null);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30 overflow-hidden">
      {/* Navbar */}
      <header className="glass border-b border-white/5 shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <HelixLogo />
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent leading-none uppercase">
                Helix AI
              </h1>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1">Electronic Learning Intelligence X</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveMode(AppMode.CHAT)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeMode === AppMode.CHAT ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
            >
              CHAT
            </button>
            <button 
              onClick={() => setActiveMode(AppMode.VOICE)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeMode === AppMode.VOICE ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <i className="fa-solid fa-microphone mr-2"></i> VOICE
            </button>
            <button 
              onClick={() => setActiveMode(AppMode.IMAGE)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeMode === AppMode.IMAGE ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <i className="fa-solid fa-palette mr-2"></i> VISION
            </button>
          </nav>

          <div className="flex items-center gap-3">
             {user ? (
               <div className="flex items-center gap-3 glass py-1.5 pl-1.5 pr-2 rounded-full border border-white/10">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                   {user.name.charAt(0)}
                 </div>
                 <div className="hidden sm:block">
                   <p className="text-[10px] font-bold text-slate-100 leading-none">{user.name}</p>
                   <p className="text-[8px] text-slate-500 font-medium">Verified</p>
                 </div>
                 <button 
                   onClick={handleSignOut}
                   className="ml-2 text-slate-500 hover:text-red-400 transition-colors p-1"
                   title="Sign Out"
                 >
                   <i className="fa-solid fa-right-from-bracket text-xs"></i>
                 </button>
               </div>
             ) : (
               <button 
                 onClick={handleSignIn}
                 className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all shadow-lg active:scale-95"
               >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                 Sign in
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeMode === AppMode.CHAT && <ChatInterface user={user} />}
        {activeMode === AppMode.VOICE && <VoiceInterface />}
        {activeMode === AppMode.IMAGE && <ImageGenerator />}
      </main>

      {/* Mobile Navigation */}
      <footer className="md:hidden glass border-t border-white/5 h-16 shrink-0 z-50">
        <div className="h-full flex items-center justify-around px-2">
          <button 
            onClick={() => setActiveMode(AppMode.CHAT)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMode === AppMode.CHAT ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <i className={`fa-solid fa-message-smile ${activeMode === AppMode.CHAT ? 'text-xl' : 'text-lg'}`}></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Chat</span>
          </button>
          <button 
            onClick={() => setActiveMode(AppMode.VOICE)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMode === AppMode.VOICE ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <i className={`fa-solid fa-microphone-lines ${activeMode === AppMode.VOICE ? 'text-xl' : 'text-lg'}`}></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Voice</span>
          </button>
          <button 
            onClick={() => setActiveMode(AppMode.IMAGE)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMode === AppMode.IMAGE ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <i className={`fa-solid fa-palette ${activeMode === AppMode.IMAGE ? 'text-xl' : 'text-lg'}`}></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Vision</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
