
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatThread } from '../types';
import { generateTextResponse } from '../services/geminiService';
import { marked } from 'marked';

interface ChatInterfaceProps {
  user: { name: string; email: string } | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // State for renaming and deletion confirmation
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const getThreadsKey = () => {
    return user ? `helix_ai_threads_${user.email}` : 'helix_ai_threads_guest';
  };

  // Load threads on mount/user change
  useEffect(() => {
    const key = getThreadsKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        } else {
          createNewThread();
        }
      } catch (e) {
        console.error("Failed to parse threads", e);
        createNewThread();
      }
    } else {
      createNewThread();
    }
  }, [user]);

  // Save threads whenever they change
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
    }
  }, [threads, user]);

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{
        id: '1',
        role: 'assistant',
        content: user 
          ? `Welcome back to **Helix AI**, ${user.name}! I've initialized your session. How can I assist you today?` 
          : 'Hello! I am **Helix AI**. Sign in to save your chat history permanently and access advanced features.',
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadToDelete(id);
  };

  const confirmDelete = () => {
    if (!threadToDelete) return;
    const newThreads = threads.filter(t => t.id !== threadToDelete);
    setThreads(newThreads);
    if (activeThreadId === threadToDelete) {
      if (newThreads.length > 0) {
        setActiveThreadId(newThreads[0].id);
      } else {
        createNewThread();
      }
    }
    setThreadToDelete(null);
  };

  const startRenaming = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setEditTitle(currentTitle);
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      setThreads(prev => prev.map(t => t.id === id ? { ...t, title: editTitle.trim() } : t));
    }
    setRenamingId(null);
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeThreadId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    
    // Update thread title if it's the first user message and still default
    let updatedTitle = activeThread.title;
    if (updatedTitle === 'New Conversation') {
      updatedTitle = input.slice(0, 30) + (input.length > 30 ? '...' : '');
    }

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId 
        ? { ...t, messages: updatedMessages, title: updatedTitle, lastUpdated: Date.now() } 
        : t
    ));
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateTextResponse(input, []);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'I encountered an issue generating a response.',
        timestamp: Date.now(),
        sources: response.sources
      };
      
      setThreads(prev => prev.map(t => 
        t.id === activeThreadId 
          ? { ...t, messages: [...updatedMessages, assistantMsg], lastUpdated: Date.now() } 
          : t
      ));
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, Helix AI is having trouble connecting right now. Please check your network.",
        timestamp: Date.now()
      };
      setThreads(prev => prev.map(t => 
        t.id === activeThreadId 
          ? { ...t, messages: [...updatedMessages, errorMsg], lastUpdated: Date.now() } 
          : t
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Safe markdown render
  const renderMessageContent = (msg: Message) => {
    if (msg.role === 'user') {
      return <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-[15px]">{msg.content}</div>;
    }
    
    const html = marked.parse(msg.content) as string;
    return (
      <div 
        className="markdown-content leading-relaxed text-sm md:text-[15px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0f172a] relative">
      {/* Delete Confirmation Modal */}
      {threadToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl drop-shadow-glow">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <i className="fa-solid fa-trash-can text-red-500"></i>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Conversation?</h3>
            <p className="text-slate-400 text-center text-sm mb-6">
              This will permanently remove this chat history from your local session. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setThreadToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform glass border-r border-white/5 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-black italic text-sm">H</span>
            </div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">HELIX AI WORKSPACE</p>
          </div>

          <button 
            onClick={createNewThread}
            className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:bg-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/5"
          >
            <i className="fa-solid fa-plus"></i> New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">History</p>
            {threads.map(thread => (
              <div 
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                  activeThreadId === thread.id 
                    ? 'bg-indigo-600/20 border-indigo-500/30 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]' 
                    : 'hover:bg-white/5 border-transparent hover:translate-x-1'
                }`}
              >
                {/* Active Indicator Bar */}
                {activeThreadId === thread.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                )}

                <i className={`fa-solid fa-message-smile text-xs transition-colors duration-300 ${activeThreadId === thread.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}></i>
                
                <div className="flex-1 min-w-0">
                  {renamingId === thread.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(thread.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle(thread.id)}
                      className="bg-slate-800 border border-indigo-500/50 rounded px-2 py-0.5 text-xs text-white w-full outline-none focus:ring-1 focus:ring-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className={`text-xs font-medium truncate transition-colors duration-300 ${activeThreadId === thread.id ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {thread.title}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5 group-hover:text-slate-500 transition-colors">
                        {new Date(thread.lastUpdated).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
                
                {renamingId !== thread.id && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => startRenaming(thread.id, thread.title, e)}
                      className="p-1.5 text-slate-600 hover:text-indigo-400 transition-all hover:scale-110"
                      title="Rename"
                    >
                      <i className="fa-solid fa-pen text-[9px]"></i>
                    </button>
                    <button 
                      onClick={(e) => requestDelete(thread.id, e)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-all hover:scale-110"
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash-can text-[9px]"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
             <div className="flex items-center gap-3 px-2 opacity-60">
                <i className="fa-solid fa-shield-halved text-xs text-slate-500"></i>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Secure Storage
                </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Subtle Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none z-0 overflow-hidden">
          <span className="text-[20rem] font-black italic tracking-tighter">HELIX</span>
        </div>

        {/* Toggle sidebar button Desktop */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute left-4 top-4 z-10 w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-500 items-center justify-center border border-white/5 transition-all hover:scale-105 active:scale-95"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[10px]`}></i>
        </button>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 p-4 pt-12 md:pt-8 md:px-8 max-w-4xl mx-auto w-full scroll-smooth custom-scrollbar relative z-10"
        >
          <div className="flex justify-between items-center mb-6 opacity-40">
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {user ? 'Verified Helix Cloud' : 'Guest Instance'}
              </span>
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Helix AI v3.5
            </div>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10' 
                : 'glass text-slate-200 rounded-tl-none border border-slate-700/50 hover:border-slate-600/50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                   {msg.role === 'assistant' && (
                     <div className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                       <span className="text-indigo-400 text-[8px] font-black italic">H</span>
                     </div>
                   )}
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {msg.role === 'user' ? (user ? user.name : 'USER') : 'HELIX AI'}
                  </div>
                </div>
                {renderMessageContent(msg)}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Validated Sources</p>
                     <ul className="space-y-1">
                       {msg.sources.map((s, i) => (
                         <li key={i}>
                           <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                             <i className="fa-solid fa-link text-[9px]"></i> {s.title}
                           </a>
                         </li>
                       ))}
                     </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-tl-none p-4 border border-slate-700/50 flex gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full bg-[#0f172a] p-4 md:px-8 pb-4 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <div className="glass rounded-2xl p-2 border border-white/10 flex items-center gap-2 shadow-2xl transition-all focus-within:border-indigo-500/30">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={user ? "Communicate with Helix AI..." : "Sign in to Helix for session persistence..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 resize-none py-2 px-3 h-12 max-h-32 min-h-[48px] placeholder-slate-600 text-sm md:text-base"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 w-12 h-12 rounded-xl transition-all flex items-center justify-center ${
                  input.trim() && !isLoading 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg scale-100 hover:scale-105 active:scale-95' 
                  : 'bg-slate-800 text-slate-700 cursor-not-allowed'
                }`}
              >
                <i className="fa-solid fa-arrow-up"></i>
              </button>
            </div>
            <div className="text-center flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">
                  POWERED BY <span className="text-indigo-400">HELIX AI</span>
                </p>
                <div className="h-2 w-[1px] bg-slate-800"></div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">
                  DEV: <span className="text-indigo-400">AARYA GUJARI</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 opacity-30 hover:opacity-50 transition-all cursor-default group">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em]">Intelligence from</span>
                <span className="text-[9px] font-black text-indigo-400 tracking-tighter uppercase group-hover:text-indigo-300 transition-colors">Google Gemini</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
    </div>
  );
};

export default ChatInterface;
