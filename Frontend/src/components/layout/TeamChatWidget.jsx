import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Send, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMessages } from '../../context/MessagesContext'

export const TeamChatWidget = () => {
  const { role, user } = useAuth()
  const { 
    teamMessages, 
    fetchTeamMessages, 
    sendTeamMessage,
    isTeamChatOpen: isOpen,
    setIsTeamChatOpen: setIsOpen
  } = useMessages()
  const [message, setMessage] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const endRef = React.useRef(null)

  const canAccessTeamChat = role === 'admin' || role === 'manager' || role === 'technician'

  React.useEffect(() => {
    if (!canAccessTeamChat || !isOpen) return
    fetchTeamMessages()
  }, [canAccessTeamChat, isOpen, fetchTeamMessages])

  React.useEffect(() => {
    if (!isOpen) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [teamMessages, isOpen])

  if (!canAccessTeamChat) return null

  const handleSend = async (event) => {
    event?.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    setMessage('')
    try {
      await sendTeamMessage(trimmed)
    } catch (error) {
      setMessage(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          className="fixed bottom-16 right-2.5 sm:right-4 w-[calc(100vw-1rem)] max-w-[17rem] z-50"
        >
          <div className="overflow-hidden rounded-[22px] border border-brand-cyan/20 bg-slate-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-cyan text-[#0a141d] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Team Chat</p>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">Shared Room</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="h-64 overflow-y-auto px-2.5 py-2.5 space-y-2.5 custom-scrollbar">
              {(!teamMessages || teamMessages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-cyan mb-3">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs font-semibold text-white">No team messages yet</p>
                  <p className="text-xs text-slate-500 mt-1">Start the conversation from here.</p>
                </div>
              ) : (
                teamMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] rounded-2xl px-2.5 py-2 ${isMine ? 'bg-[#0b3a4a] text-cyan-50 rounded-tr-none' : 'bg-[#1a212e] text-slate-200 rounded-tl-none'}`}>
                        {!isMine && (
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-cyan mb-1.5">
                            {msg.sender?.name || 'Team Member'}
                          </p>
                        )}
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                      </div>
                      <span className="mt-1 px-1 text-[8px] uppercase tracking-widest text-slate-600">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-white/5 p-2">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a team message..."
                  className="w-full bg-[#05080d] border border-white/10 rounded-2xl py-2 pl-3 pr-11 text-xs text-white focus:outline-none focus:border-brand-cyan/20 placeholder:text-slate-700"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    message.trim() && !isSending
                      ? 'bg-brand-cyan text-[#0a141d] hover:scale-[1.03]'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
