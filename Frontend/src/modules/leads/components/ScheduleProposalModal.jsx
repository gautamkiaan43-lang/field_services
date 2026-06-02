import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MessageSquare, X, Check } from 'lucide-react'
import { GlassCard } from '../../../components/ui/GlassCard'
import { GradientButton } from '../../../components/ui/GradientButton'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function ScheduleProposalModal({ isOpen, onClose, lead, onProposed }) {
  const [formData, setFormData] = useState({
    proposedDate: '',
    proposedTimeSlot: '',
    internalNote: '',
    customerMessage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.proposedDate || !formData.proposedTimeSlot) {
      toast.error('Please select both date and time')
      return
    }

    try {
      setIsSubmitting(true)
      // Call real API when ready
      await api.post(`/leads/${lead.id}/propose`, formData)
      toast.success('Schedule proposal sent successfully')
      onProposed()
      onClose()
    } catch (error) {
      console.error('Error proposing schedule:', error)
      toast.error('Could not send proposal - check connection')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl relative"
          >
            <GlassCard className="p-8 border-brand-cyan/20 overflow-hidden" hover={false}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Calendar className="text-brand-cyan" size={24} />
                    Propose schedule
                  </h3>
                  <p className="text-slate-400 mt-1">Suggest an available slot for {lead.firstName}.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Proposed Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan" size={16} />
                      <input 
                        type="date"
                        required
                        value={formData.proposedDate}
                        onChange={(e) => setFormData({...formData, proposedDate: e.target.value})}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Proposed Time Slot</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan" size={16} />
                      <select 
                        required
                        value={formData.proposedTimeSlot}
                        onChange={(e) => setFormData({...formData, proposedTimeSlot: e.target.value})}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-bold text-sm appearance-none"
                      >
                        <option value="">Select a slot</option>
                        <option value="Morning (8AM - 12PM)">Morning (8AM - 12PM)</option>
                        <option value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</option>
                        <option value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Internal Note (Private)</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 text-slate-500 group-focus-within:text-brand-cyan" size={16} />
                    <textarea 
                      placeholder="Why this slot? Special instructions?"
                      value={formData.internalNote}
                      onChange={(e) => setFormData({...formData, internalNote: e.target.value})}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium text-sm h-24"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <GradientButton 
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1 py-4"
                  >
                    <Check size={18} className="mr-2" />
                    Propose schedule
                  </GradientButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
