import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Tag, CreditCard, Hash, FileText, Loader2 } from 'lucide-react'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function AddExpenseModal({ isOpen, onClose, onSave, jobId }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'MATERIAL',
    paymentMethod: 'CARD',
    reference: '',
    note: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      return toast.error('Please enter a valid amount')
    }

    try {
      setIsSubmitting(true)
      const backendId = jobId?.replace('JOB-', '')
      await api.post(`/job-ledger/${backendId}/expenses`, {
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.reference,
        note: formData.note
      })
      toast.success('Expense recorded successfully')
      onSave() // Trigger parent refresh
      onClose()
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error(error.response?.data?.message || 'Failed to record expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    { label: 'Materials', value: 'MATERIAL' },
    { label: 'Labor', value: 'LABOR' },
    { label: 'Permits', value: 'PERMIT' },
    { label: 'Subcontractors', value: 'SUBCONTRACTOR' },
    { label: 'Equipment', value: 'EQUIPMENT' },
    { label: 'Miscellaneous', value: 'MISC' }
  ]

  const methods = [
    { label: 'Credit Card', value: 'CARD' },
    { label: 'Cash', value: 'CASH' },
    { label: 'Check', value: 'CHECK' },
    { label: 'Bank Transfer', value: 'TRANSFER' }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="relative w-full max-w-md bg-slate-900 border border-rose-500/20 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
        
        <div className="flex items-center justify-between mb-6 md:mb-8 sticky top-0 bg-slate-900/80 backdrop-blur-md pt-2 pb-4 z-10">
          <h3 className="text-xl md:text-2xl font-black text-white">Add Expense</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <DollarSign size={12} /> Amount
            </label>
            <input 
              required
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-bold text-xl"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                <Tag size={12} /> Category
              </label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all truncate uppercase text-xs font-bold"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value} className="bg-slate-900">{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                <CreditCard size={12} /> Method
              </label>
              <select 
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all truncate uppercase text-xs font-bold"
              >
                {methods.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <Hash size={12} /> Reference #
            </label>
            <input 
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              placeholder="Receipt # or PO #"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <FileText size={12} /> Notes
            </label>
            <textarea 
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
              rows={3}
              placeholder="Internal memo..."
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : 'Confirm Expense'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
