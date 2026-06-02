import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Phone, HelpCircle, User, Loader2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useAuth } from '../../context/AuthContext'
import { useMessages } from '../../context/MessagesContext'

export default function Support() {
  const { user } = useAuth()
  const { conversations, messages, sendMessage, fetchMessages, contacts } = useMessages()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const chatEndRef = useRef(null)

  // For a customer, "Support" is usually a chat with an ADMIN or MANAGER
  const [adminContact, setAdminContact] = useState(null);

  useEffect(() => {
    if (contacts.length > 0) {
      // 1. If we have incoming messages or loaded messages, snap to THAT sender
      const lastMsgFromAdmin = [...messages].reverse().find(m => m.senderId !== user.id);
      if (lastMsgFromAdmin) {
        const contact = contacts.find(c => c.id === lastMsgFromAdmin.senderId);
        if (contact && (!adminContact || adminContact.id !== contact.id)) {
          setAdminContact(contact);
          return;
        }
      }
      
      // 2. If no adminContact is set, prioritize the most recent existing conversation
      if (!adminContact && conversations.length > 0) {
        const supportConvs = conversations
          .filter(c => c.user?.role === 'ADMIN' || c.user?.role === 'MANAGER')
          .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
        
        if (supportConvs.length > 0) {
          setAdminContact(supportConvs[0].user);
          return;
        }
      }
      
      // 3. Fallback to the first available Admin or Manager
      if (!adminContact) {
        const defaultAdmin = contacts.find(c => c.role === 'ADMIN' || c.role === 'MANAGER');
        if (defaultAdmin) {
          setAdminContact(defaultAdmin);
        }
      }
    }
  }, [contacts, messages, user.id, adminContact, conversations]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (adminContact) {
      fetchMessages(adminContact.id);
    }
  }, [adminContact, fetchMessages]);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || isSending || !adminContact) return
    
    setIsSending(true)
    const currentMsg = message
    setMessage('')
    
    try {
      await sendMessage(adminContact.id, currentMsg)
    } catch (error) {
      setMessage(currentMsg) // Restore input
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Contact Support</h1>
        <p className="text-slate-400 mt-1">Chat with our support team or give us a call.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden flex flex-col border-white/5 h-[calc(100vh-280px)] min-h-[500px]">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan relative">
                <MessageSquare size={20} />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">Live Support</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Online • ~2 min wait</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-brand-cyan" size={32} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <MessageSquare size={24} className="text-slate-500" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-300">How can we help today?</p>
                     <p className="text-xs text-slate-500">Send a message to start conversing with support.</p>
                   </div>
                </div>
              ) : (
                <>
                  {/* System Initial Message */}
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-200 rounded-tl-none relative">
                      <p className="text-sm">Hello! Welcome to FieldSync Pro Support. How can we assist you today?</p>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">System &bull; Automatically generated</p>
                    </div>
                  </div>
                  
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl ${
                          isMe
                            ? 'bg-brand-cyan/20 border border-brand-cyan/20 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}>
                          {!isMe && (
                             <div className="flex items-center gap-2 mb-1">
                               <User size={12} className="text-brand-cyan" />
                               <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest">{msg.sender?.name || 'Support Agent'}</span>
                             </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-slate-400 mt-2 text-right opacity-70 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex gap-3 relative">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  maxLength={500}
                  className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 pr-14 transition-all"
                  disabled={isSending}
                />
                <button 
                  onClick={handleSend} 
                  disabled={isSending || !message.trim()}
                  className={`absolute right-2 top-2 bg-brand-cyan p-2 rounded-lg text-slate-900 transition-all ${
                    !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Support Options */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-bold text-white mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-3">
              <a href="tel:555-123-4567" className="block p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Call Us</p>
                  <p className="text-xs text-slate-400 mt-0.5">(555) 123-4567</p>
                </div>
              </a>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-brand-purple/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:bg-brand-purple/20 group-hover:scale-110 transition-all">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-brand-purple transition-colors">FAQ</p>
                  <p className="text-xs text-slate-400 mt-0.5">Browse common questions</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
