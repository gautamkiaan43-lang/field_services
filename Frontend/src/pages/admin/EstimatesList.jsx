import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Plus, FileText, ChevronRight, 
  Copy, Briefcase, FileSignature, Receipt
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useNavigate } from 'react-router-dom'
import { useEstimates } from '../../context/EstimatesContext'
import { toast } from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import api from '../../services/api'
import { Download, Eye, Printer, X, ArrowLeft, ShieldCheck, Calendar, Clock } from 'lucide-react'

export default function EstimatesList() {
  const navigate = useNavigate()
  const { estimates, convertToJob } = useEstimates()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedEstimate, setSelectedEstimate] = useState(null)
  const [businessSettings, setBusinessSettings] = useState({})

  React.useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get('/settings/business')
        if (response?.data?.success) {
          setBusinessSettings(response.data.data || {})
        }
      } catch (error) {
        setBusinessSettings({})
      }
    }
    fetchBusinessSettings()
  }, [])

  const handleDownload = (est) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // Header
      doc.setFontSize(22)
      doc.setTextColor(6, 182, 212) // brand-cyan
      doc.text(businessSettings?.businessName || 'FieldSync Pro', 20, 30)
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text('PROJECT ESTIMATE', 20, 38)
      doc.text(`Estimate ID: ${est.id}`, pageWidth - 20, 30, { align: 'right' })
      doc.text(`Date: ${est.date}`, pageWidth - 20, 38, { align: 'right' })
      
      // Customer Info
      doc.setDrawColor(230)
      doc.line(20, 45, pageWidth - 20, 45)
      
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text('Prepared For:', 20, 55)
      doc.setFont('helvetica', 'normal')
      doc.text(est.customer, 20, 62)
      doc.text(est.projectTitle || '', 20, 68)
      
      // Summary Box
      doc.setFillColor(248, 250, 252)
      doc.rect(pageWidth - 85, 50, 65, 25, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('TOTAL ESTIMATED AMOUNT', pageWidth - 80, 58)
      doc.setFontSize(16)
      doc.setTextColor(6, 182, 212)
      doc.text(est.amount, pageWidth - 80, 68)
      
      // Items Table
      let y = 85
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text('Description', 20, y)
      doc.text('Qty', 110, y)
      doc.text('Price', 140, y)
      doc.text('Total', pageWidth - 20, y, { align: 'right' })
      
      doc.setLineWidth(0.5)
      doc.line(20, y + 2, pageWidth - 20, y + 2)
      y += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      est.items?.forEach(item => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        const desc = item.desc || item.description || 'Service'
        doc.text(desc.substring(0, 50), 20, y)
        doc.text(String(item.qty || 1), 110, y)
        doc.text(`$${Number(item.price || 0).toLocaleString()}`, 140, y)
        doc.text(`$${Number((item.qty || 1) * (item.price || 0)).toLocaleString()}`, pageWidth - 20, y, { align: 'right' })
        y += 8
      })
      
      // Notes
      if (est.notes && y < 250) {
        y += 10
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const splitNotes = doc.splitTextToSize(est.notes, pageWidth - 40)
        doc.text(splitNotes, 20, y + 5)
      }
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('This is an estimate only. Final prices may vary based on project scope changes.', pageWidth / 2, 285, { align: 'center' })
      
      doc.save(`${est.id}_Estimate.pdf`)
      toast.success('Estimate downloaded successfully')
    } catch (error) {
      console.error('Download Error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const stats = [
    { label: 'Pending Approval', count: estimates.filter(e => e.status === 'Pending').length, color: 'text-amber-400' },
    { label: 'Approved', count: estimates.filter(e => e.status === 'Approved').length, color: 'text-emerald-400' },
    { label: 'Converted to Job', count: estimates.filter(e => e.status === 'Applied').length, color: 'text-cyan-400' }
  ]

  const filteredEstimates = estimates.filter(est => {
    const matchesSearch = est.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      est.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (est.projectTitle && est.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || est.status === statusFilter;
    return matchesSearch && matchesStatus;
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Estimates</h1>
          <p className="text-slate-400 mt-1">Create and manage project quotes for customers.</p>
        </div>
        <GradientButton onClick={() => navigate('/dashboard/estimates/new')} className="w-full sm:w-auto">
          <Plus size={18} /> New Estimate
        </GradientButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={i} className="p-4 border-white/5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.count}</h3>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-visible border-white/5 relative z-10">
        <div className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search estimates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-lg pl-3 pr-1 py-1">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 bg-transparent text-slate-400 py-1.5 pr-2 focus:outline-none text-sm cursor-pointer appearance-none [&>option]:bg-slate-900"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Applied">Converted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold text-center w-20">ID</th>
                <th className="px-6 py-4 font-semibold">Customer / Project</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode='popLayout'>
                {filteredEstimates.map((est, index) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={est.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className="cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mx-auto text-brand-cyan group-hover:bg-brand-cyan group-hover:text-slate-900 transition-all">
                          <FileText size={18} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                          {est.projectTitle || est.customer}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">{index + 1}</span>
                          {est.projectTitle && <span className="text-[10px] text-slate-600 font-medium">• {est.customer}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white tracking-tight">{est.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        est.status === 'Applied' ? 'text-emerald-400 bg-emerald-400/10' : 
                        est.status === 'Pending' ? 'text-amber-400 bg-amber-400/10' : 
                        est.status === 'Approved' ? 'text-cyan-400 bg-cyan-400/10' : 'text-rose-400 bg-rose-400/10'
                      }`}>
                        {est.status === 'Applied' ? 'Converted' : est.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{est.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          {est.status === 'Approved' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); convertToJob(est.id); }}
                              className="px-2 py-1 border border-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-400/10 text-[10px] font-bold flex items-center gap-1"
                            >
                              <Briefcase size={12} /> Convert to Job
                            </button>
                          )}

                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/invoices?estimateId=${est.id}`); }}
                            className="px-2 py-1 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-400/10 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Receipt size={12} /> Send Invoice
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedEstimate(est); }}
                            className="p-2 border border-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-all"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(est); }}
                            className="p-2 border border-slate-500/20 rounded-lg text-slate-400 hover:bg-slate-400/10 transition-all"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/estimates/edit/${est.id}`); }}
                            className="px-2 py-1 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-400/10 text-[10px] font-bold flex items-center gap-1"
                          >
                            <FileSignature size={12} /> Edit
                          </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {selectedEstimate && (
          <EstimateDetailModal 
            estimate={selectedEstimate}
            businessSettings={businessSettings}
            onClose={() => setSelectedEstimate(null)}
            onDownload={() => handleDownload(selectedEstimate)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EstimateDetailModal({ estimate, businessSettings, onClose, onDownload }) {
  const subtotal = estimate.total || 0
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-2xl relative scrollbar-hide"
      >
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-black text-white uppercase tracking-tight">Estimate Detail</h3>
              <p className="text-[10px] font-mono text-slate-500 font-bold">{estimate.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onDownload} className="p-3 rounded-2xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all">
              <Download size={20} />
            </button>
            <button onClick={() => window.print()} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hidden sm:block">
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 md:p-14 space-y-16">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  <FileText size={40} className="text-white" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Issued By</p>
                <p className="text-2xl font-black text-white">{businessSettings?.businessName || 'FieldSync Pro'}</p>
                <p className="text-slate-400 text-sm">{businessSettings?.businessAddress}</p>
              </div>
            </div>
            <div className="text-left md:text-right flex flex-col justify-end">
              <h2 className="text-8xl font-black text-white/[0.03] absolute right-16 top-40 pointer-events-none select-none tracking-tighter">ESTIMATE</h2>
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 px-4 py-1.5 rounded-full">
                  <ShieldCheck size={16} className="text-brand-cyan" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Professional Quote</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Prepared For</p>
                  <p className="text-3xl font-black text-white mt-1 underline decoration-brand-cyan/30 decoration-8 underline-offset-4">{estimate.customer}</p>
                  <p className="text-slate-500 text-xs mt-2 font-bold font-mono">{estimate.projectTitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Status</p>
              <div className="text-xs font-black uppercase tracking-widest text-brand-cyan flex items-center gap-2">
                <Clock size={16} /> {estimate.status}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Date</p>
              <p className="text-xs font-black text-white uppercase">{estimate.date}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Valid Until</p>
              <p className="text-xs font-black text-amber-500 uppercase">30 Days from Issue</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Amount</p>
              <p className="text-xl font-black text-white tracking-tighter">{estimate.amount}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] pb-4 border-b border-white/5">Project Breakdown</h5>
            <div className="divide-y divide-white/5">
              {estimate.items?.map((item, i) => (
                <div key={i} className="py-8 flex justify-between items-center group">
                  <div className="space-y-2">
                    <p className="text-lg font-black text-white group-hover:text-brand-cyan transition-colors">{item.desc || item.description}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Quantity: <span className="text-slate-300">{item.qty || item.quantity}</span> &bull; Rate: <span className="text-slate-300">${(item.price || item.unitPrice || 0).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white font-mono tracking-tighter">${((item.qty || item.quantity) * (item.price || item.unitPrice || 0)).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {estimate.notes && (
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Additional Notes</h5>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-slate-400 text-sm leading-relaxed italic">
                "{estimate.notes}"
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-end gap-10 pt-10">
            <div className="w-full md:max-w-xs p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                This estimate is valid for 30 days. Final invoice may vary based on material costs and scope adjustments.
              </p>
            </div>
            <div className="w-full md:w-80 space-y-5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
                <span className="text-lg font-bold text-white font-mono tracking-tighter">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tax (8%)</span>
                <span className="text-lg font-bold text-white font-mono tracking-tighter">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t-4 border-brand-cyan">
                <span className="text-lg font-black text-white uppercase tracking-tighter">Total Estimated</span>
                <span className="text-5xl font-black text-brand-cyan tracking-tighter shadow-cyan-500/10 shadow-lg">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-purple" />
      </motion.div>
    </motion.div>
  )
}
