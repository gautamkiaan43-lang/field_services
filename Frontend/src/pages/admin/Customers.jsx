import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, Mail, MapPin, Edit3, Trash2, X, MoreVertical, UserPlus, Filter, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useCustomers } from '../../context/CustomersContext'
import api from '../../services/api'
import { AlertCircle, DollarSign, Calculator } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [toast, setToast] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [selectedCity, setSelectedCity] = useState('All')
  const [financialSummary, setFinancialSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '', confirmPassword: '' })

  useEffect(() => {
    if (editingCustomer) {
      setLoadingSummary(true)
      api.get(`/customers/${editingCustomer.id}/financial-summary`)
        .then(res => setFinancialSummary(res.data))
        .catch(err => {
          console.error("Failed to fetch financial summary", err)
          setFinancialSummary(null)
        })
        .finally(() => setLoadingSummary(false))
    } else {
      setFinancialSummary(null)
    }
  }, [editingCustomer])

  const getCity = (address) => {
    if (!address) return 'N/A';
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
    return 'Other';
  };

  const cities = ['All', ...new Set(customers.map(c => getCity(c.address)))]

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.id).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity = selectedCity === 'All' || getCity(c.address) === selectedCity;

      return matchesSearch && matchesCity;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'id') return String(a.id).localeCompare(String(b.id))
      return 0
    })

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, password: '', confirmPassword: '' })
    } else {
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phone: '', address: '', password: '', confirmPassword: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData)
      showToast('Customer profile updated successfully')
    } else {
      if (formData.password !== formData.confirmPassword) {
        showToast('Passwords do not match', 'error')
        return
      }
      if (formData.password.length < 6) {
        showToast('Password must be at least 6 characters', 'error')
        return
      }
      addCustomer(formData)
      showToast('New customer added successfully')
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id)
      setDeleteConfirmId(null)
      showToast('Customer record deleted', 'warning')
    } catch (error) {
      // Error toast is handled by context, just collapse the modal
      setDeleteConfirmId(null)
    }
  }

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ID,Name,Email,Phone,Address\n"
      + filteredCustomers.map(c => `${c.id},${c.name},${c.email},${c.phone},"${c.address}"`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "customers_export.csv")
    document.body.appendChild(link)
    link.click()
    showToast('Exporting customer list...')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Customers</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400">Manage your customer database and records.</p>
            {filteredCustomers.length !== customers.length && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 animate-pulse">
                Showing {filteredCustomers.length} of {customers.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm">
            <Download size={18} /> Export List
          </button>
          <GradientButton onClick={() => handleOpenModal()} className="flex-1 sm:flex-none">
            <UserPlus size={18} /> Add Customer
          </GradientButton>
        </div>
      </div>

      <GlassCard className="p-4 md:p-6 overflow-visible" hover={false}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all shadow-inner"
            />
          </div>
          <div className="relative">
            <button onClick={() => setShowFilters(!showFilters)} className={`h-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${showFilters || selectedCity !== 'All' ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan font-bold' : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Filter size={18} />
              {selectedCity === 'All' ? 'Filters' : `City: ${selectedCity}`}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 overflow-hidden">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest p-2 border-b border-white/5 mb-1">Sort By</p>
                  <button onClick={() => { setSortBy('name'); setShowFilters(false) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === 'name' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-400 hover:bg-white/5'}`}>Name (A-Z)</button>
                  <button onClick={() => { setSortBy('id'); setShowFilters(false) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === 'id' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-400 hover:bg-white/5'}`}>Customer ID</button>

                  <div className="flex items-center justify-between p-2 border-b border-white/5 my-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Filter City</p>
                    {selectedCity !== 'All' && (
                      <button onClick={() => { setSelectedCity('All'); setShowFilters(false) }} className="text-[10px] text-brand-cyan hover:underline font-bold">Clear</button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {cities.map(city => (
                      <button key={city} onClick={() => { setSelectedCity(city); setShowFilters(false) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCity === city ? 'bg-brand-cyan/10 text-brand-cyan font-bold' : 'text-slate-400 hover:bg-white/5'}`}>
                        {city}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredCustomers.map(cust => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={cust.id}
            >
              <GlassCard className="group relative h-full overflow-hidden border-white/5 hover:border-brand-cyan/20">
                <div className="absolute top-3 right-3 z-20 flex gap-2">
                  <button onClick={() => handleOpenModal(cust)} className="p-2 bg-slate-800 text-brand-cyan rounded-lg hover:bg-brand-cyan hover:text-white transition-all shadow-lg">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(cust.id)} className="p-2 bg-slate-800 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-lg">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center p-2 mb-6 pt-6">
                  <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-brand-cyan/20 to-brand-teal/20 p-1 mb-4 shadow-2xl group-hover:rotate-6 transition-transform">
                    <div className="w-full h-full rounded-[28px] bg-slate-900 overflow-hidden border border-white/10">
                      <Avatar name={cust.name} className="w-full h-full" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{cust.name}</h3>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 text-slate-500 font-mono tracking-widest">{cust.id}</span>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-cyan transition-colors"><Mail size={16} /></div>
                    <span className="text-slate-400 truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-cyan transition-colors"><Phone size={16} /></div>
                    <span className="text-slate-400">{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-cyan transition-colors"><MapPin size={16} /></div>
                    <span className="text-slate-400 line-clamp-1">{cust.address}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => navigate(`/dashboard/jobs?customer=${cust.name}`)}
                    className="w-full py-2.5 rounded-xl border border-brand-cyan/20 text-brand-cyan text-sm font-bold hover:bg-brand-cyan/10 transition-all flex items-center justify-center gap-2"
                  >
                    View Activity <Plus size={14} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <p className="text-slate-400 text-sm">Fill in the details below to manage your customer profile.</p>
              </div>

              <div className="custom-scrollbar overflow-y-auto max-h-[70vh]">
                {/* Financial Summary */}
                {editingCustomer && !loadingSummary && financialSummary && (
                  <div className="p-8 border-b border-white/5 bg-slate-900/50">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-4 flex items-center justify-between">
                      Financial Summary
                      <Calculator size={16} />
                    </h3>

                    {financialSummary.remainingBalance <= 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 text-amber-500 mb-4">
                        <AlertCircle size={16} />
                        <p className="font-bold text-xs uppercase tracking-wider">All funds have been used</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Total Deposits</p>
                        <p className="text-lg font-black text-brand-cyan">${parseFloat(financialSummary.totalDeposits).toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Remaining Balance</p>
                        <p className={`text-lg font-black ${financialSummary.remainingBalance > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ${parseFloat(financialSummary.remainingBalance).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Labor Spent</p>
                        <p className="text-sm font-bold text-slate-300">${parseFloat(financialSummary.totalLaborSpent).toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Material Spent</p>
                        <p className="text-sm font-bold text-slate-300">${parseFloat(financialSummary.totalMaterialSpent).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Full Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Email Address *</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Phone Number *</label>
                        <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Street Address *</label>
                      <textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Enter full address" rows={3} className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all resize-none" />
                    </div>

                    {!editingCustomer && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Create Password *</label>
                          <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1.5 block">Confirm Password *</label>
                          <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 transition-all" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancel</button>
                    <GradientButton type="submit" className="flex-1 py-4">
                      {editingCustomer ? 'Update Profile' : 'Save Customer'}
                    </GradientButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 size={32} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Delete Customer?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">Are you sure you want to delete <span className="text-brand-cyan font-bold">{customers.find(c => c.id === deleteConfirmId)?.name}</span>? This action is irreversible.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">No, Keep</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
            <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-900/90 border-brand-cyan/20 text-brand-cyan' : 'bg-slate-900/90 border-rose-500/20 text-rose-500'
              }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-brand-cyan' : 'bg-rose-500'}`} />
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
