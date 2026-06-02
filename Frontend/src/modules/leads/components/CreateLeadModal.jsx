import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mail, MapPin, Wrench, FileText, Calendar, Clock, Send, X, ChevronRight } from 'lucide-react'
import { GlassCard } from '../../../components/ui/GlassCard'
import { GradientButton } from '../../../components/ui/GradientButton'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'

const SERVICE_TYPES = [
  'HVAC repair', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping',
  'Pest Control', 'General Repair', 'Other'
]

const TIME_SLOTS = [
  'Morning (8AM - 12PM)',
  'Afternoon (12PM - 4PM)',
  'Evening (4PM - 8PM)'
]

export default function CreateLeadModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceType: '',
    jobDescription: '',
    preferredDate: '',
    preferredTimeSlot: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.phone || !formData.serviceType) {
      toast.error('First Name, Phone, and Service are required')
      return
    }

    try {
      setIsSubmitting(true)
      await api.post('/leads', {
        ...formData,
        preferredDate: formData.preferredDate ? new Date(formData.preferredDate).toISOString() : null
      })
      toast.success('Lead created successfully')
      onCreated()
      onClose()
      // Reset form
      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        address: '', city: '', state: '', zipCode: '',
        serviceType: '', jobDescription: '',
        preferredDate: '', preferredTimeSlot: ''
      })
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error(error.response?.data?.error || 'Failed to create lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
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
            className="w-full max-w-4xl relative my-auto py-8"
          >
            <div className="relative bg-slate-950 rounded-[2.5rem] border border-white/5 p-4 md:p-8 shadow-2xl overflow-hidden">
               <div className="flex items-center justify-between mb-8 px-4">
                <div>
                  <h3 className="text-3xl font-black text-white flex items-center gap-3 italic uppercase tracking-tighter">
                    <User className="text-brand-cyan" size={28} />
                    Create New Lead
                  </h3>
                  <p className="text-slate-400 mt-1 font-medium italic">Manually input a new customer inquiry.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto px-4 scrollbar-hide">
                {/* Contact Section */}
                <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <User className="text-brand-cyan" size={20} />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">First Name</label>
                      <input required name="firstName" value={formData.firstName} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm md:text-base" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Last Name</label>
                      <input required name="lastName" value={formData.lastName} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm md:text-base" placeholder="Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm md:text-base" placeholder="(555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm md:text-base" placeholder="john@example.com" />
                    </div>
                  </div>
                </GlassCard>

                {/* Address Section */}
                <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <MapPin className="text-brand-cyan" size={20} />
                    Service Address
                  </h3>
                  
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Street Address</label>
                      <input required name="address" value={formData.address} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm md:text-base" placeholder="123 Main St" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <input required name="city" placeholder="City" value={formData.city} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium text-sm md:text-base" />
                       <input required name="state" placeholder="State/Prov" value={formData.state} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium text-sm md:text-base" />
                       <input required name="zipCode" placeholder="ZIP/Postal" value={formData.zipCode} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium text-sm md:text-base" />
                    </div>
                  </div>
                </GlassCard>

                {/* Service Detail Section */}
                <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Wrench className="text-brand-cyan" size={20} />
                    Service Request Details
                  </h3>
                  
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Service Required</label>
                          <div className="relative">
                            <select required name="serviceType" value={formData.serviceType} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none appearance-none font-medium text-sm md:text-base">
                              <option value="">Select Service</option>
                              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Job Description</label>
                       <textarea required name="jobDescription" placeholder="Please describe the issue or service needed in detail..." value={formData.jobDescription} onChange={handleChange} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium min-h-[140px] text-sm md:text-base resize-none" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Preferred Date</label>
                          <div className="relative">
                            <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input required type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium text-sm md:text-base" />
                          </div>
                        </div>
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Preferred Time Window</label>
                          <div className="relative">
                            <Clock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <select required name="preferredTimeSlot" value={formData.preferredTimeSlot} onChange={handleChange} className="bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white w-full transition-all focus:ring-2 focus:ring-brand-cyan/20 outline-none appearance-none font-medium text-sm md:text-base">
                              <option value="">Select Time Slot</option>
                              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                     </div>
                  </div>
                </GlassCard>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 pb-8">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic text-center sm:text-left">
                     All fields are required • Secure submission
                   </p>
                   <div className="flex gap-4 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 sm:flex-none px-8 py-5 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm border border-white/5"
                      >
                        Cancel
                      </button>
                      <GradientButton 
                        type="submit" 
                        isLoading={isSubmitting}
                        className="flex-1 sm:flex-none px-10 py-5 rounded-2xl text-base font-black tracking-widest uppercase italic shadow-2xl"
                      >
                        <Send size={20} className="mr-3" />
                        Create Lead
                      </GradientButton>
                   </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
