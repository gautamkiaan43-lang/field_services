import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, CreditCard, Hash, FileText, Loader2 } from 'lucide-react'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function AddDepositModal({ isOpen, onClose, onSave, jobId }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    labor: '',
    materials: '',
    paymentMethod: 'CASH', // Match backend enum
    reference: '',
    note: ''
  })

  if (!isOpen) return null

  const totalAllocated = (Number(formData.labor) || 0) + (Number(formData.materials) || 0)
  const remainingCredit = (Number(formData.amount) || 0) - totalAllocated

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      return toast.error('Please enter a valid amount')
    }

    if (totalAllocated > Number(formData.amount)) {
      return toast.error('Allocated amounts cannot exceed the total deposit amount')
    }

    try {
      setIsSubmitting(true)
      const backendId = jobId?.replace('JOB-', '')
      await api.post(`/job-ledger/${backendId}/deposits`, {
        amount: parseFloat(formData.amount),
        labor: parseFloat(formData.labor || 0),
        materials: parseFloat(formData.materials || 0),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.reference,
        note: formData.note
      })
      toast.success('Deposit added successfully')
      onSave() // Trigger parent refresh
      onClose()
    } catch (error) {
      console.error('Error adding deposit:', error)
      toast.error(error.response?.data?.message || 'Failed to add deposit')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        className="relative w-full max-w-md bg-slate-900 border border-emerald-500/20 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        
        <div className="flex items-center justify-between mb-6 md:mb-8 sticky top-0 bg-slate-900/80 backdrop-blur-md pt-2 pb-4 z-10">
          <h3 className="text-xl md:text-2xl font-black text-white">Add Deposit</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <DollarSign size={12} /> Total Amount
            </label>
            <input 
              required
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-xl"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block px-1">Labor Allocation</label>
              <input 
                type="number"
                step="0.01"
                value={formData.labor}
                onChange={e => setFormData({ ...formData, labor: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-bold"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block px-1">Material Allocation</label>
              <input 
                type="number"
                step="0.01"
                value={formData.materials}
                onChange={e => setFormData({ ...formData, materials: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          {Number(formData.amount) > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remaining Credit</p>
                <p className={`text-base font-black ${remainingCredit < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  ${remainingCredit.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Allocation</p>
                <p className="text-xs font-bold text-white opacity-40">
                  {((totalAllocated / (Number(formData.amount) || 1)) * 100).toFixed(0)}% Utilized
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <CreditCard size={12} /> Payment Method
            </label>
            <select 
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium uppercase"
            >
              {[
                { label: 'Cash', value: 'CASH' },
                { label: 'Credit Card', value: 'CARD' },
                { label: 'Bank Transfer', value: 'TRANSFER' },
                { label: 'Check', value: 'CHECK' }
              ].map(m => (
                <option key={m.value} value={m.value} className="bg-slate-900 border-none">{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <Hash size={12} /> Reference/Check #
            </label>
            <input 
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              placeholder="e.g. Check #1234"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
              <FileText size={12} /> Notes
            </label>
            <textarea 
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none font-medium"
              rows={3}
              placeholder="Internal memo..."
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || remainingCredit < 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : 'Confirm Deposit'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
