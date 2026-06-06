import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Phone, User, Search, 
  MoreVertical, Paperclip, Smile, Shield, 
  Clock, CheckCheck, Loader2, Plus, Filter,
  ExternalLink, Video, ChevronRight, ChevronLeft, Mail, AlignLeft, Trash2
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';
import { motion, AnimatePresence } from 'framer-motion';

const Communication = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    sendMessage, 
    fetchMessages, 
    contacts, 
    isLoading,
    deleteConversation,
    deleteAllMessages,
    deleteMessages,
    teamMessages,
    fetchTeamMessages,
    sendTeamMessage
  } = useMessages();
  
  const [activeTab, setActiveTab] = useState('chat'); // chat, sms, calls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const chatEndRef = useRef(null);
  const filteredContacts = contacts
    .slice()
    .sort((a, b) => {
      const convA = conversations.find(c => c.user?.id === a.id);
      const convB = conversations.find(c => c.user?.id === b.id);

      if (convA && convB) {
        return new Date(convB.lastMessage?.createdAt || 0) - new Date(convA.lastMessage?.createdAt || 0);
      }
      if (convA) return -1;
      if (convB) return 1;
      return a.name.localeCompare(b.name);
    })
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const smsTemplates = [
    { id: 1, text: "Hi {name}, your technician is on the way!" },
    { id: 2, text: "Hi {name}, your job has been completed. Please review." },
    { id: 3, text: "Reminder: Your appointment is tomorrow at {time}." },
    { id: 4, text: "Hi {name}, your estimate is ready for review." }
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 150);
  };

  useEffect(() => {
    if (activeTab === 'chat' && selectedChat) {
      scrollToBottom();
    }
  }, [messages, activeTab, selectedChat]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isTeamChat) {
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (selectedChat?.isTeamChat) {
      fetchTeamMessages();
    }
  }, [selectedChat, fetchTeamMessages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = activeTab === 'sms' ? selectedTemplate : newMessage;
    if (!content.trim() || !selectedChat || isSending) return;

    setIsSending(true);
    const text = content;
    if (activeTab === 'chat') setNewMessage('');
    else setSelectedTemplate('');

    try {
      if (selectedChat.isTeamChat) {
        await sendTeamMessage(text);
      } else {
        await sendMessage(selectedChat.id, text);
      }
    } catch (error) {
      if (activeTab === 'chat') setNewMessage(text);
      else setSelectedTemplate(text);
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleMessageSelection = (id) => {
    setSelectedMessageIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.length === 0) return;
    if (window.confirm(`Delete ${selectedMessageIds.length} selected messages?`)) {
      await deleteMessages(selectedMessageIds);
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileRows = windowWidth < 640 ? 4 : 6;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 overflow-hidden relative">
      {/* Sidebar - Messages List */}
      <GlassCard className={`
        w-full lg:w-80 flex flex-col p-0 overflow-hidden border-white/5 bg-[#0a0f18]/60 backdrop-blur-xl 
        transition-all duration-300
        ${selectedChat ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-8 space-y-7 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white tracking-tight">Messages</h2>
            <button 
              onClick={() => window.confirm('Clear all messages permanently?') && deleteAllMessages()}
              className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Trash2 size={12} />
              Clear All
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#05080d] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-brand-cyan/20 transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-scroll px-3 pb-8 custom-scrollbar">
          <div className="space-y-2">
              <p className="px-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">
                Internal
              </p>
              
              <button
                onClick={() => setSelectedChat({ id: 'team-chat', name: 'Team Chat', isTeamChat: true, role: 'INTERNAL' })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                  selectedChat?.id === 'team-chat'
                    ? 'bg-[#162a35]/60 border border-brand-cyan/10' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm shadow-xl transition-all duration-300 ${
                    selectedChat?.id === 'team-chat' ? 'bg-[#22d3ee] text-[#111827]' : 'bg-[#1a212e] text-brand-cyan font-bold'
                  }`}>
                    <Shield size={20} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0f18]" />
                </div>
                <div className="flex-1 overflow-hidden text-left ml-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold truncate transition-colors ${selectedChat?.id === 'team-chat' ? 'text-white' : 'text-slate-300'}`}>
                      Team Chat
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                    SHARED ROOM
                  </p>
                </div>
                {selectedChat?.id === 'team-chat' && (
                  <div className="w-[2px] h-10 bg-brand-cyan rounded-full absolute -right-0.5 shadow-[0_0_10px_#22d3ee]" />
                )}
              </button>

              <div className="h-px bg-white/5 my-4 mx-2" />

              <p className="px-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">
                Inbox
              </p>
              {filteredContacts.map(contact => {
                const isActive = selectedChat?.id === contact.id;
                const initials = getInitials(contact.name);
                
                // Find conversation for this contact to get unread count
                const conversation = conversations.find(conv => conv.user?.id === contact.id);
                const unreadCount = conversation?.unread || 0;
              
                // Standard color for contact avatars
                const avatarStyle = 'bg-[#1a212e] text-brand-cyan font-bold';

                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedChat(contact)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                      isActive 
                        ? 'bg-[#162a35]/60 border border-brand-cyan/10' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm shadow-xl transition-all duration-300 ${
                        isActive ? 'bg-[#22d3ee] text-[#111827]' : avatarStyle
                      }`}>
                        {initials}
                      </div>
                      {unreadCount > 0 ? (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-brand-cyan rounded-lg flex items-center justify-center text-[10px] text-[#0a0f18] font-black px-1.5 shadow-lg shadow-cyan-500/40 ring-4 ring-[#0a0f18]">
                          {unreadCount}
                        </div>
                      ) : (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0f18]" />
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden text-left ml-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {contact.name}
                        </p>
                        {unreadCount > 0 && <div className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse shadow-glow shadow-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {contact.role || 'USER'}
                      </p>
                    </div>

                    {isActive && (
                      <div className="w-[2px] h-10 bg-brand-cyan rounded-full absolute -right-0.5 shadow-[0_0_10px_#22d3ee]" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </GlassCard>

      {/* Content Area */}
      <div className={`
        flex-1 flex flex-col gap-6 overflow-hidden transition-all duration-300
        ${selectedChat ? 'flex' : 'hidden lg:flex'}
      `}>
        {selectedChat ? (
          <>
              {/* Merged Header & Interaction Area */}
              <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-white/5 bg-[#0a0f18]/60 relative shadow-3xl">
                {/* Merged Navigation Bar */}
                <div className="px-4 py-2 bg-[#0a0f18] border-b border-white/5 flex items-center justify-between gap-4">
                  {/* Left: User Info */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button 
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#22d3ee] flex items-center justify-center text-[#1a2b2f] font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/10">
                      {getInitials(selectedChat?.name || 'User')}
                    </div>
                    <div className="max-w-[80px] sm:max-w-none">
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none truncate">{selectedChat?.name || 'User'}</h3>
                      <p className="text-[8px] sm:text-[9px] text-emerald-400 font-black uppercase mt-0.5">ACTIVE</p>
                    </div>
                  </div>

                  {/* Middle: Segmented Tabs */}
                  {!selectedChat.isTeamChat && (
                    <div className="flex-1 max-w-[140px] sm:max-w-sm bg-[#111827]/80 p-0.5 sm:p-1 rounded-xl flex gap-1">
                      {[
                        { id: 'chat', label: 'Chat', icon: MessageSquare },
                        { id: 'sms', label: 'SMS', icon: AlignLeft },
                        { id: 'calls', label: 'Calls', icon: Phone }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                              ? 'bg-[#1a2e35] text-brand-cyan shadow-lg' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <tab.icon size={12} className={activeTab === tab.id ? 'text-brand-cyan' : 'text-slate-600'} />
                          <span className="hidden md:block">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedMessageIds([]);
                      }}
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-2 rounded-lg transition-all ${
                        isSelectionMode ? 'bg-brand-cyan text-[#0a141d]' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {isSelectionMode ? 'Cancel' : 'Select'}
                    </button>
                    <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#111827] border border-white/5 flex items-center justify-center text-brand-cyan hover:bg-white/10 transition-all">
                       <Phone size={14} />
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide flex flex-col">
                      <div className="mt-auto space-y-8 sm:space-y-12 px-1 sm:px-2 pb-6 sm:pb-10">
                        {(selectedChat.isTeamChat ? teamMessages : messages).map((msg) => {
                          const isSentByMe = msg.senderId === user?.id;
                          const isSelected = selectedMessageIds.includes(msg.id);
                          return (
                            <div 
                              key={msg.id} 
                              onClick={() => isSelectionMode && toggleMessageSelection(msg.id)}
                              className={`flex flex-col mb-3 ${isSentByMe ? 'items-end' : 'items-start'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
                            >
                              <div className={`flex items-end gap-3 max-w-[80%] ${isSentByMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {isSelectionMode && (
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-white/10 bg-white/5'
                                  }`}>
                                    {isSelected && <CheckCheck size={12} className="text-[#0a141d]" />}
                                  </div>
                                )}
                                <div className={`px-5 py-3.5 shadow-2xl transition-all ${
                                  isSentByMe 
                                    ? `bg-[#0b3a4a] text-cyan-50 rounded-2xl rounded-tr-none ${isSelected ? 'ring-2 ring-brand-cyan' : ''}` 
                                    : `bg-[#1a212e] text-slate-200 rounded-2xl rounded-tl-none ${isSelected ? 'ring-2 ring-brand-cyan' : ''}`
                                }`}>
                                  {selectedChat.isTeamChat && !isSentByMe && (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-cyan mb-1.5">
                                      {msg.sender?.name || 'Team Member'}
                                    </p>
                                  )}
                                  <p className="text-[14px] leading-relaxed font-medium">{msg.content}</p>
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-600 mt-1 font-black uppercase tracking-tighter px-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>
                    </div>
                    
                    {/* Chat Input Field / Selection Bar */}
                    {isSelectionMode ? (
                      <div className="px-5 py-4 border-t border-white/5 bg-[#0a0f18]/95 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-slate-400">
                          <span className="text-sm font-bold text-white tracking-widest uppercase">{selectedMessageIds.length} Selected</span>
                          <button 
                            onClick={() => setSelectedMessageIds(messages.map(m => m.id))}
                            className="text-[10px] uppercase font-black hover:text-white transition-colors"
                          >
                            Select All
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsSelectionMode(false)}
                            className="px-6 py-2.5 rounded-xl border border-white/5 text-slate-500 font-bold text-xs hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleDeleteSelected}
                            disabled={selectedMessageIds.length === 0}
                            className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                              selectedMessageIds.length > 0 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-[1.03]' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Delete Selected
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 sm:px-5 py-2.5 border-t border-white/5 bg-[#0a0f18]/95">
                        <div className="relative max-w-6xl mx-auto">
                          <input 
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="w-full bg-[#05080d] border border-white/10 rounded-2xl py-2.5 sm:py-3 pl-4 sm:pl-8 pr-16 sm:pr-20 text-sm sm:text-[15px] text-white focus:outline-none focus:border-brand-cyan/20 transition-all placeholder:text-slate-700 shadow-3xl"
                          />
                          <button 
                            onClick={handleSendMessage}
                            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-brand-cyan rounded-xl flex items-center justify-center text-[#111827] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl shadow-cyan-500/40"
                          >
                            <Send size={16} className="sm:hidden" />
                            <Send size={18} className="hidden sm:block" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'sms' && (
                  <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-10 py-4">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <AlignLeft size={18} className="text-brand-cyan" />
                           <h4 className="font-bold text-white text-lg tracking-tight">Select Template</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {smsTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template.text.replace('{name}', (selectedChat?.name || 'User').split(' ')[0]))}
                              className={`w-full text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                                selectedTemplate === template.text.replace('{name}', (selectedChat?.name || 'User').split(' ')[0])
                                  ? 'bg-brand-cyan/10 border-brand-cyan/30 ring-1 ring-brand-cyan/20'
                                  : 'bg-[#05080d]/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                              }`}
                            >
                              <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                                {template.text.replace('{name}', (selectedChat?.name || 'User').split(' ')[0])}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <Mail size={18} className="text-brand-cyan" />
                           <h4 className="font-bold text-white text-lg tracking-tight">Message Preview</h4>
                        </div>
                        <div className="relative">
                          <textarea 
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            rows={mobileRows}
                            className="w-full bg-[#05080d]/50 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-brand-cyan/30 transition-all resize-none shadow-inner leading-relaxed"
                          />
                          <div className="absolute bottom-4 right-5 sm:bottom-5 sm:right-7">
                             <span className="text-[9px] sm:text-[10px] text-slate-600 font-black tracking-widest">{selectedTemplate.length} chars</span>
                          </div>
                        </div>
                      </div>

                      <button 
                          onClick={handleSendMessage}
                          disabled={!selectedTemplate.trim() || isSending}
                          className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-slate-900 font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-cyan-900/30 hover:shadow-cyan-400/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4"
                        >
                          {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={20} />}
                          Send SMS Update
                        </button>
                    </div>
                  </div>
                )}

                {activeTab === 'calls' && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                     <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                        <Phone size={40} className="text-slate-500" />
                     </div>
                     <h4 className="text-2xl font-bold text-white mb-3">Call Logging Unavailable</h4>
                     <p className="text-sm text-slate-400 max-w-sm leading-relaxed">External telephony integration is required to record and display call history in this view.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
             <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-10 relative">
                <MessageSquare size={56} className="relative z-10" />
                <div className="absolute inset-0 bg-brand-cyan/10 blur-3xl rounded-full scale-150 opacity-50" />
             </div>
             <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter">Choose a Conversation</h2>
             <p className="text-slate-500 max-w-sm text-lg leading-relaxed">
               Select a contact from the sidebar to view your message history or send quick mobile updates.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
