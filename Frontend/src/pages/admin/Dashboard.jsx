import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Clock, FileText, DollarSign, Plus,
  MoreHorizontal, MessageSquare, Send, Bot, Star,
  ShoppingCart, Briefcase, ChevronRight, Download
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useInvoices } from '../../context/InvoicesContext'
import { useJobs } from '../../context/JobsContext'
import { useEstimates } from '../../context/EstimatesContext'
import { useReviews } from '../../context/ReviewsContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const { jobs } = useJobs()
  const { estimates } = useEstimates()
  const { invoices } = useInvoices()
  const { reviews } = useReviews()

  const [kpis, setKpis] = useState([])
  const [materials, setMaterials] = useState([])
  const [schedule, setSchedule] = useState([])
  const [chat, setChat] = useState([])

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayJobs = jobs.filter(j => {
        if (!j.scheduledAt) return false;
        return new Date(j.scheduledAt).toISOString().split('T')[0] === today;
      }).map(j => ({
        id: j.id,
        title: j.title,
        customer: j.customer,
        time: j.time || 'TBD',
        day: new Date(j.scheduledAt).getDate(),
        month: new Date(j.scheduledAt).toLocaleString('default', { month: 'short' }).toUpperCase()
      }));
      setSchedule(todayJobs);
    }
  }, [jobs]);

  const fetchDashboardStats = async () => {
    const role = String(user?.role || '').toUpperCase()
    const kpiEndpoint = role === 'ADMIN'
      ? '/analytics/admin-kpis'
      : role === 'MANAGER'
        ? '/analytics/manager-kpis'
        : null

    // KPI Data
    if (kpiEndpoint) {
      api.get(kpiEndpoint)
        .then(res => setKpis(res.data))
        .catch(e => console.error('Failed to fetch KPIs', e));
    } else {
      setKpis([])
    }

    // Material Pricing Data
    api.get('/materials/pricing')
      .then(res => setMaterials(res.data))
      .catch(e => {
        console.error('Failed to fetch materials', e);
        setMaterials([]); // Ensure empty state on failure instead of undefined
      });
  };

  const fetchTeamChat = async () => {
    try {
      const res = await api.get('/messages/team');
      setChat(res.data.map(m => ({
        user: m.sender.name,
        msg: m.content,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.sender.name)}&background=random&color=fff&rounded=true`,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (e) {
      console.error('Failed to fetch team chat', e);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchTeamChat();

    // Polling for live chat updates
    const chatInterval = setInterval(fetchTeamChat, 5000);

    return () => clearInterval(chatInterval);
  }, [user?.role]);

  const recentEstimates = [...estimates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  const handleDownload = () => {
    setDownloading(true)
    const toastId = toast.loading('Generating report...')

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Header Section with Gradient-like bar
      doc.setFillColor(15, 23, 42) // brand-navy
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('FieldSync Pro', 15, 20)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('EXECUTIVE DASHBOARD SUMMARY', 15, 30)
      
      doc.setFontSize(9)
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 15, 15, { align: 'right' })
      doc.text(`TIME: ${new Date().toLocaleTimeString()}`, pageWidth - 15, 22, { align: 'right' })
      doc.text(`ADMIN: ${user?.name || 'Authorized User'}`, pageWidth - 15, 29, { align: 'right' })

      let y = 55

      // 1. KPI SECTION
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Performance Indicators', 15, y)
      
      doc.setDrawColor(220)
      doc.line(15, y + 3, pageWidth - 15, y + 3)
      
      y += 15
      kpis.forEach((kpi, idx) => {
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text(kpi.label.toUpperCase(), 15 + (idx % 2 * 90), y)
        
        doc.setFontSize(18)
        doc.setTextColor(15, 23, 42)
        doc.text(String(kpi.value || ''), 15 + (idx % 2 * 90), y + 8)
        
        doc.setFontSize(9)
        if (kpi.trend.includes('+')) {
          doc.setTextColor(16, 185, 129) // emerald-500
        } else {
          doc.setTextColor(244, 63, 94) // rose-500
        }
        doc.text(String(kpi.trend || ''), 45 + (idx % 2 * 90), y + 8)
        
        if (idx % 2 === 1) y += 25
      })

      y = Math.max(y, 115)

      // 2. RECENT ESTIMATES
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Latest Estimates', 15, y)
      y += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('CUSTOMER', 15, y)
      doc.text('AMOUNT', pageWidth - 15, y, { align: 'right' })
      
      doc.setDrawColor(240)
      doc.line(15, y + 2, pageWidth - 15, y + 2)
      y += 8

      doc.setFont('helvetica', 'normal')
      recentEstimates.forEach(est => {
        doc.text(est.customer, 15, y)
        doc.text(String(est.total || ''), pageWidth - 15, y, { align: 'right' })
        y += 7
      })

      y += 15

      // 3. TODAY'S SCHEDULE
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Upcoming Schedule', 15, y)
      y += 8

      if (schedule.length === 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150)
        doc.text('No jobs scheduled for today.', 15, y)
        y += 10
      } else {
        schedule.forEach(task => {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 23, 42)
          doc.text(`${task.time} - ${task.title}`, 15, y)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100)
          doc.text(task.customer, 15, y + 5)
          y += 12
        })
      }

      y += 5

      // 4. MATERIAL PRICING (Optional extra value)
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Material Price Index', 15, y)
      y += 8

      materials.slice(0, 10).forEach(mat => {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(15, 23, 42)
        doc.text(mat.name, 15, y)
        doc.setTextColor(100)
        doc.text(`Lowe's: ${String(mat.lowes || '')} | Home Depot: ${String(mat.homeDepot || '')}`, pageWidth - 15, y, { align: 'right' })
        y += 6
        if (y > 280) { doc.addPage(); y = 20; }
      })

      // Footer
      const totalPages = doc.internal.getNumberOfPages()
      for(let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(180)
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' })
        doc.text('Generated by FieldSync Pro Analytics Engine', pageWidth / 2, 294, { align: 'center' })
      }

      doc.save(`FieldSync_Pro_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Report downloaded successfully!', { id: toastId })
    } catch (error) {
      console.error('Report Error:', error)
      toast.error('Failed to generate PDF report', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  const handleAIAction = (action) => {
    toast.success(`Action: ${action} - Feature coming soon!`)
  }

  const handleSendChat = async () => {
    if (!chatInput.trim()) return
    try {
      const res = await api.post('/messages/team', { content: chatInput });
      const newMsg = {
        user: res.data.sender.name,
        msg: res.data.content,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(res.data.sender.name)}&background=random&color=fff&rounded=true`,
        time: new Date(res.data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChat(prev => [...prev, newMsg]);
      setChatInput('');
      toast.success('Message sent to team!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.name || 'Admin'}! Here's what's happening today.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <GradientButton
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download size={18} /> Download Report
              </span>
            )}
          </GradientButton>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <GlassCard key={idx} className="p-0 border-white/5 overflow-hidden group">
            <div className={`h-1.5 w-full bg-gradient-to-r ${kpi.color}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-white/5 ${kpi.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold text-white tracking-tighter">{kpi.value}</h3>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                  {idx === 0 && <Briefcase size={20} className="text-white" />}
                  {idx === 1 && <FileText size={20} className="text-white" />}
                  {idx === 2 && <DollarSign size={20} className="text-white" />}
                  {idx === 3 && <TrendingUp size={20} className="text-white" />}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Estimates & Materials */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Estimates */}
          <GlassCard title="Recent Estimates">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-brand-cyan" size={20} /> Recent Estimates
              </h2>
              <button
                className="text-sm text-brand-cyan hover:underline transition-opacity hover:opacity-80"
                onClick={() => navigate('/dashboard/estimates')}
              >View All</button>
            </div>
            <div className="space-y-4">
              {recentEstimates.slice(0, 5).map((est) => (
                <div
                  key={est.id}
                  onClick={() => navigate(`/dashboard/estimates/edit/${est.id}`)}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-cyan/30 hover:bg-white/8 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 shrink-0 rounded-full ${est.status === 'Approved' ? 'bg-emerald-400' : est.status === 'Rejected' ? 'bg-rose-400' : 'bg-brand-cyan'} shadow-[0_0_8px_rgba(34,211,238,0.5)]`} />
                    <span className="font-medium text-slate-200 truncate">{est.customer}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-white whitespace-nowrap">{est.total}</span>
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-brand-cyan transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Material Pricing */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-brand-purple" size={20} /> Material Pricing
              </h2>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded-lg text-xs font-bold border border-orange-600/30">LOWE'S</div>
                <div className="px-3 py-1 bg-orange-700/20 text-orange-500 rounded-lg text-xs font-bold border border-orange-700/30">HOME DEPOT</div>
              </div>
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="pb-4 font-medium">Material Name</th>
                    <th className="pb-4 font-medium">Lowe's</th>
                    <th className="pb-4 font-medium">Home Depot</th>
                    <th className="pb-4 font-medium text-right">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((mat, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-4 font-medium text-slate-300">{mat.name}</td>
                      <td className="py-4 text-slate-400">{mat.lowes}</td>
                      <td className="py-4 text-slate-400">{mat.homeDepot}</td>
                      <td className="py-4 text-right">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${mat.better === 'HD' ? 'bg-orange-600/20 text-orange-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          BEST: {mat.better}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {materials.map((mat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 text-sm">{mat.name}</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${mat.better === 'HD' ? 'bg-orange-600/20 text-orange-400' : 'bg-blue-600/20 text-blue-400'}`}>
                      BEST: {mat.better}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 p-2 rounded-xl bg-orange-600/10 border border-orange-600/20 text-center">
                      <p className="text-[10px] text-orange-400 font-bold uppercase mb-0.5">Lowe's</p>
                      <p className="text-sm font-bold text-white">{mat.lowes}</p>
                    </div>
                    <div className="flex-1 p-2 rounded-xl bg-orange-700/10 border border-orange-700/20 text-center">
                      <p className="text-[10px] text-orange-500 font-bold uppercase mb-0.5">Home Depot</p>
                      <p className="text-sm font-bold text-white">{mat.homeDepot}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Customer Reviews Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400" size={20} /> Latest Reviews
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.slice(0, 4).length > 0 ? reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                      {review.customer?.name || review.customer || 'Customer'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={10} className={`${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 italic">"{review.comment}"</p>
                  <p className="text-[9px] text-slate-600 uppercase font-black">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-slate-500 text-sm">No reviews yet.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-8">
          {/* AI Assistant Widget */}
          <GlassCard className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/20" glow>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">AI Assistant</h3>
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Online</span>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-6 font-medium">How can I assist you with your jobs today?</p>
            <div className="space-y-3">
              {['Job Updates', 'Estimate Help', 'Answer FAQs'].map((action) => (
                <button
                  key={action}
                  onClick={() => handleAIAction(action)}
                  className="w-full p-4 flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-left group"
                >
                  <span className="text-sm font-medium text-slate-200 group-hover:text-brand-cyan">{action}</span>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-cyan" />
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Upcoming Schedule */}
          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="text-brand-cyan" size={18} /> Upcoming Schedule
            </h2>
            <div className="space-y-4">
              {schedule.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm italic">No jobs scheduled for today</p>
                </div>
              ) : schedule.map((task, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/dashboard/jobs`)}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center bg-brand-cyan/10 rounded-xl px-3 py-1 h-fit group-hover:bg-brand-cyan/20 transition-colors">
                    <span className="text-[10px] uppercase font-bold text-brand-cyan">{task.month}</span>
                    <span className="text-lg font-bold text-white leading-tight">{task.day}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm group-hover:text-brand-cyan transition-colors">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{task.time} • {task.customer}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Team Chat Widget */}
          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="text-brand-purple" size={18} /> Team Chat
            </h2>
            <div className="space-y-6">
              {chat.map((chat, i) => (
                <div key={i} className="flex gap-3">
                  <img src={chat.avatar} alt="" className="w-8 h-8 rounded-lg bg-white/10" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{chat.user}</p>
                    <p className="text-xs text-slate-400 mt-1">{chat.msg}</p>
                  </div>
                </div>
              ))}
              <div className="relative mt-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-brand-cyan/30 transition-all text-white"
                />
                <button
                  onClick={handleSendChat}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-cyan p-1 hover:bg-brand-cyan/10 rounded-lg transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
