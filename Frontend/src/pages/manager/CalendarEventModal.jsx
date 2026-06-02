import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Clock, User, FileText, ChevronDown } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useEmployees } from '../../context/EmployeesContext'
import { useCustomers } from '../../context/CustomersContext'

export default function CalendarEventModal({ isOpen, onClose, onSave }) {
  const { employees } = useEmployees()
  const { customers } = useCustomers()
  
  const technicians = employees.filter(e => {
    const r = e.role?.toUpperCase();
    return r === 'TECHNICIAN' || r === 'MANAGER' || r === 'ADMIN';
  })

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    technician: '',
    technicianId: '',
    customer: '',
    customerId: '',
    notes: '',
    priority: 'Medium'
  })

  const [techSearch, setTechSearch] = useState('')
  const [showTechDropdown, setShowTechDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  
  const techRef = useRef(null)
  const custRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (techRef.current && !techRef.current.contains(event.target)) setShowTechDropdown(false)
      if (custRef.current && !custRef.current.contains(event.target)) setShowCustomerDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.date) return
    onSave(formData)
    setFormData({ title: '', date: '', time: '', technician: '', technicianId: '', customer: '', customerId: '', notes: '', priority: 'Medium' })
    setTechSearch('')
    setCustomerSearch('')
  }

  const selectTechnician = (tech) => {
    setFormData({ ...formData, technician: tech.name, technicianId: tech.id })
    setTechSearch(tech.name)
    setShowTechDropdown(false)
  }

  const selectCustomer = (cust) => {
    setFormData({ ...formData, customer: cust.name, customerId: cust.id })
    setCustomerSearch(cust.name)
    setShowCustomerDropdown(false)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
        className="relative w-full max-w-lg"
      >
        <GlassCard className="border-white/10 shadow-2xl p-0 overflow-visible" hover={false}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-cyan" />

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center">
                  <PlusIcon size={24} className="text-brand-cyan" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">New Calendar Event</h3>
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">Add a manually scheduled task</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                      <FileText size={12} /> Event Title *
                    </label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="E.g. Annual Maintenance Check"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Date */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                        <CalendarIcon size={12} /> Date *
                      </label>
                      <input
                        required
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all"
                      />
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Time
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Customer Dropdown */}
                    <div className="space-y-2 relative" ref={custRef}>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                        <User size={12} /> Customer
                      </label>
                      <div className="relative">
                        <input 
                          value={customerSearch}
                          onChange={e => {
                            setCustomerSearch(e.target.value)
                            setShowCustomerDropdown(true)
                            if (formData.customerId && e.target.value !== formData.customer) {
                              setFormData({...formData, customer: e.target.value, customerId: ''})
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Select customer"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all pr-10"
                        />
                        <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {showCustomerDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative z-[120] w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-2"
                          >
                            {(() => {
                               const list = customers.filter(c => 
                                 c.name.toLowerCase().includes(customerSearch.toLowerCase())
                               );

                               return list.length > 0 ? (
                                 list.map(c => (
                                   <button 
                                     key={c.id} 
                                     type="button"
                                     onClick={() => selectCustomer(c)}
                                     className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3 ${formData.customerId === c.id ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-300 hover:bg-brand-cyan/10 hover:text-brand-cyan'}`}
                                   >
                                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/10 shrink-0 uppercase text-slate-400">
                                       {c.name.charAt(0)}
                                     </div>
                                     <div className="flex flex-col">
                                       <span className="font-medium text-white">{c.name}</span>
                                       <span className="text-[10px] text-slate-500">{c.email || 'Customer'}</span>
                                     </div>
                                   </button>
                                 ))
                               ) : (
                                 <div className="px-4 py-2 text-xs text-slate-500 italic">No customer found</div>
                               );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Technician Dropdown */}
                    <div className="space-y-2 relative" ref={techRef}>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                        <User size={12} /> Technician
                      </label>
                      <div className="relative">
                        <input 
                          value={techSearch}
                          onChange={e => {
                            setTechSearch(e.target.value)
                            setShowTechDropdown(true)
                            if (formData.technicianId && e.target.value !== formData.technician) {
                              setFormData({...formData, technician: e.target.value, technicianId: ''})
                            }
                          }}
                          onFocus={() => setShowTechDropdown(true)}
                          placeholder="Select technician"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all pr-10"
                        />
                        <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-transform ${showTechDropdown ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {showTechDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative z-[120] w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-2"
                          >
                            {(() => {
                               const list = technicians.filter(t => 
                                 t.name.toLowerCase().includes(techSearch.toLowerCase())
                               );

                               return list.length > 0 ? (
                                 list.map(t => (
                                   <button 
                                     key={t.id} 
                                     type="button"
                                     onClick={() => selectTechnician(t)}
                                     className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3 ${formData.technicianId === t.id ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-300 hover:bg-brand-cyan/10 hover:text-brand-cyan'}`}
                                   >
                                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/10 shrink-0">
                                       {t.name.split(' ').map(n => n[0]).join('')}
                                     </div>
                                     <div className="flex flex-col">
                                       <span className="font-medium text-white">{t.name}</span>
                                       <span className="text-[10px] text-slate-500 uppercase">{t.role}</span>
                                     </div>
                                   </button>
                                 ))
                               ) : (
                                 <div className="px-4 py-2 text-xs text-slate-500 italic">No technician found</div>
                               );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Priority</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${formData.priority === p
                              ? (p === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                p === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                  'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30')
                              : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional details..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <GradientButton className="flex-1 py-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  Create Event
                </GradientButton>
              </div>
            </form>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

function PlusIcon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
