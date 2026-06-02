import React, { useState } from 'react'
import { Bot, Send, Sparkles, Zap, HelpCircle, FileText, Briefcase } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'

export default function AIAssistant() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState([
    { role: 'ai', text: "Hello! I'm your FieldSync AI assistant. I can help you with job updates, estimate generation, scheduling, and answering FAQs. What can I do for you today?" },
  ])

  const quickActions = [
    { icon: Briefcase, label: 'Summarize today\'s jobs', color: 'text-cyan-400' },
    { icon: FileText, label: 'Draft an estimate', color: 'text-purple-400' },
    { icon: Zap, label: 'Find available technicians', color: 'text-amber-400' },
    { icon: HelpCircle, label: 'How to create an invoice?', color: 'text-emerald-400' },
  ]

  const handleSend = () => {
    if (!input.trim()) return
    setChat([...chat,
      { role: 'user', text: input },
      { role: 'ai', text: getAIResponse(input) }
    ])
    setInput('')
  }

  const getAIResponse = (msg) => {
    const lower = msg.toLowerCase()
    if (lower.includes('job')) return "I can help you manage your jobs. You can see your active and pending jobs in the Jobs section of your dashboard."
    if (lower.includes('estimate')) return "I can help draft an estimate. Please provide the customer name and service details, and I'll help you get started."
    if (lower.includes('technician') || lower.includes('available')) return "I can help you check technician availability and manage assignments in the Employees section."
    if (lower.includes('invoice')) return "To create an invoice: Go to Invoices → Create Invoice. You can also convert any approved estimate directly into an invoice."
    return "I'm here to help with your business operations. Feel free to ask about jobs, estimates, or scheduling!"
  }

  const handleQuickAction = (label) => {
    setChat([...chat,
      { role: 'user', text: label },
      { role: 'ai', text: getAIResponse(label) }
    ])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={22} className="text-white" />
          </div>
          AI Assistant
        </h1>
        <p className="text-slate-400 mt-1">Get instant help with jobs, estimates, and scheduling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <GlassCard className="p-0 overflow-hidden flex flex-col border-white/5 h-[calc(100vh-260px)]">
            <div className="p-5 border-b border-white/5 bg-gradient-to-r from-indigo-950/40 to-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">FieldSync AI</h3>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-brand-cyan/20 border border-brand-cyan/20 text-white rounded-tr-none'
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-slate-200 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your business..."
                  className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button onClick={handleSend} className="bg-indigo-500 p-3 rounded-xl text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Quick Actions</h3>
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action.label)}
              className="w-full p-4 flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-indigo-500/30 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10">
                <action.icon size={18} className={action.color} />
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
