import React, { useState } from 'react'
import { Search, Package, Plus, ShoppingCart, Filter, X, CheckCircle2, AlertTriangle, ArrowRight, Minus } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useMaterials } from '../../context/MaterialsContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function PartsAndMaterials() {
  const { materials, requests, requestPart, updateStock } = useMaterials()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showUseModal, setShowUseModal] = useState(null)
  const [requestForm, setRequestForm] = useState({ name: '', qty: 1, priority: 'Normal', note: '' })
  const [useQty, setUseQty] = useState(1)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = materials.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.sku?.toLowerCase().includes(search.toLowerCase())
    
    // Case-insensitive source comparison
    const matchesSource = sourceFilter === 'All' || 
      p.source?.toUpperCase().replace(/['\s]/g, '') === sourceFilter.toUpperCase().replace(/['\s]/g, '')
      
    return matchesSearch && matchesSource
  })

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    requestPart(requestForm)
    setShowRequestModal(false)
    setRequestForm({ name: '', qty: 1, priority: 'Normal', note: '' })
    showToast('Part request submitted successfully')
  }

  const handleUseSubmit = () => {
    if (showUseModal.qty < useQty) {
      showToast('Not enough stock available', 'error')
      return
    }
    updateStock(showUseModal.id, -useQty)
    setShowUseModal(null)
    setUseQty(1)
    showToast(`Used ${useQty} unit(s) of ${showUseModal.name}`)
  }

  return (
    <div className="space-y-8 pb-20 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]">
            <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
              {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span className="text-sm font-bold tracking-tight">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Parts & Materials</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400">Track materials used or needed for jobs.</p>
            {filtered.length !== materials.length && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 animate-pulse">
                Showing {filtered.length} of {materials.length}
              </span>
            )}
          </div>
        </div>
        <GradientButton onClick={() => setShowRequestModal(true)}>
          <Plus size={18} /> Request Parts
        </GradientButton>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <Filter size={14} className="text-slate-500 mr-2 shrink-0" />
            {['All', "Lowe's", 'Home Depot'].map(source => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${sourceFilter === source
                  ? 'bg-brand-cyan text-slate-900 border-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
              >
                {source.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-center">In Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((part) => (
                <tr key={part.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${part.qty < 5 ? 'bg-rose-500/10 text-rose-400' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
                        <Package size={18} />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{part.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono tracking-wider italic">{part.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-bold ${part.qty < 5 ? 'text-rose-400' : 'text-white'}`}>{part.qty}</span>
                      {part.qty < 5 && <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">Low Stock</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-400">{part.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                      part.source?.toUpperCase().includes('LOWE') ? 'bg-blue-600/10 text-blue-400 border-blue-600/20' : 
                      part.source?.toUpperCase().includes('DEPOT') ? 'bg-orange-600/10 text-orange-400 border-orange-600/20' :
                      'bg-slate-600/10 text-slate-400 border-slate-600/20'
                    }`}>{part.source}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setShowUseModal(part); setUseQty(1); }}
                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                        title="Use Material"
                      >
                        <ShoppingCart size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setRequestForm({ ...requestForm, name: part.name });
                          setShowRequestModal(true);
                        }}
                        className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-lg hover:bg-brand-cyan hover:text-slate-900 transition-all"
                        title="Request More"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* RECENT REQUESTS SECTION */}
      {requests.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="text-brand-teal" size={20} /> Recent Requests
          </h2>
          <GlassCard className="p-0 border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4">Request ID</th>
                    <th className="px-6 py-4">Material</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono italic">{req.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{req.name}</td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300 font-bold">{req.qty}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{req.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${req.priority === 'Immediate' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          req.priority === 'Urgent' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>{req.priority}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="flex items-center justify-end gap-1.5 text-brand-cyan font-bold italic text-xs">
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* REQUEST MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
            <motion.form
              onSubmit={handleRequestSubmit}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-cyan" />
              <button onClick={() => setShowRequestModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>

              <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Request Materials</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Material Name</label>
                  <input
                    required
                    value={requestForm.name}
                    onChange={e => setRequestForm({ ...requestForm, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                    placeholder="e.g. PVC Pipe 10ft"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={requestForm.qty}
                      onChange={e => setRequestForm({ ...requestForm, qty: parseInt(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Priority</label>
                    <select
                      value={requestForm.priority}
                      onChange={e => setRequestForm({ ...requestForm, priority: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                    >
                      <option className="bg-slate-900 text-white">Normal</option>
                      <option className="bg-slate-900 text-white">Urgent</option>
                      <option className="bg-slate-900 text-white">Immediate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Additional Notes</label>
                  <textarea
                    value={requestForm.note}
                    onChange={e => setRequestForm({ ...requestForm, note: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 min-h-[100px] resize-none"
                    placeholder="Why is this material needed?"
                  />
                </div>
              </div>

              <div className="mt-8">
                <GradientButton className="w-full py-4 rounded-xl" type="submit">
                  Submit Request
                </GradientButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* USE MATERIAL MODAL */}
      <AnimatePresence>
        {showUseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUseModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{showUseModal.name}</h3>
              <p className="text-slate-500 text-sm mb-8 uppercase font-bold tracking-widest">Available: <span className="text-emerald-400">{showUseModal.qty} units</span></p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => setUseQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Minus size={18} />
                </button>
                <div className="text-4xl font-bold text-white w-12">{useQty}</div>
                <button
                  onClick={() => setUseQty(q => Math.min(showUseModal.qty, q + 1))}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowUseModal(null)}
                  className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUseSubmit}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-900 font-bold shadow-lg shadow-emerald-500/20"
                >
                  Log Usage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
