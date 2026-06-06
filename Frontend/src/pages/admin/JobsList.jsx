import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, MoreVertical, Trash2, Eye, Edit3, UserPlus, X, Download, Shield, AlertTriangle, ChevronDown, RefreshCcw } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { useJobs } from '../../context/JobsContext'
import { useAuth } from '../../context/AuthContext'
import { useEmployees } from '../../context/EmployeesContext'
import { useCustomers } from '../../context/CustomersContext'
import { useMaterials } from '../../context/MaterialsContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function JobsList() {
  const { jobs, createJob, deleteJob, assignTechnician, updateStatus } = useJobs()
  const { role, user: authUser } = useAuth()
  const { employees } = useEmployees()
  const { customers } = useCustomers()
  const { syncAllPrices } = useMaterials()
  const navigate = useNavigate()

  const technicians = employees.filter(e => e.role === 'Technician')
  const customersList = customers

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Create Job Form State
  const [newJob, setNewJob] = useState({ 
    customerId: '', 
    customer: '', 
    title: '', 
    type: 'Scheduled Service', 
    priority: 'Medium', 
    technician: 'Unassigned', 
    date: '', 
    address: '', 
    phone: '', 
    email: '' 
  })
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [lineItems, setLineItems] = useState([{ id: 1, desc: '', qty: 1, price: 0 }])
  
  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)

  const dropdownRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const customerName = params.get('customer')
    if (customerName) {
      setSearchTerm(customerName)
    }
  }, [location.search])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // --- Role-based job filtering ---
  const roleFilteredJobs = (() => {
    if (role === 'technician') return jobs.filter(j => j.technicianId === authUser?.employee?.id)
    if (role === 'customer') return jobs.filter(j => j.customerId === authUser?.customer?.id)
    return jobs
  })()

  // --- Search + status filter ---
  const filtered = roleFilteredJobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // --- Permissions ---
  const canCreate = role === 'admin'
  const canDelete = role === 'admin'
  const canAssign = role === 'manager'
  const canChangeStatus = role === 'manager' || role === 'technician'
  const canViewActions = role !== 'customer'

  // --- Create job ---
  const handleCreate = () => {
    if (!newJob.customerId || !newJob.title || !newJob.date) {
      toast.error('Please select a customer, title, and date')
      return
    }
    createJob({ ...newJob, items: lineItems })
    setNewJob({ 
      customerId: '', 
      customer: '', 
      title: '', 
      type: 'Scheduled Service', 
      priority: 'Medium', 
      technician: 'Unassigned', 
      date: '', 
      address: '', 
      phone: '', 
      email: '' 
    })
    setLineItems([{ id: 1, desc: '', qty: 1, price: 0 }])
    setCustomerSearch('')
    setShowCreateForm(false)
  }

  const selectCustomer = (customer) => {
    setNewJob({
      ...newJob,
      customerId: customer.id,
      customer: customer.name,
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || ''
    })
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
  }

  const filteredCustomers = customersList.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const subtotal = lineItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  // --- Navigate to detail page based on role ---
  const goToDetail = (id) => {
    if (role === 'manager') navigate(`/dashboard/manager/jobs/${id}`)
    else if (role === 'technician') navigate(`/dashboard/tech/jobs/${id}`)
    else if (role === 'customer') navigate(`/dashboard/portal/job/${id}`)
    else navigate(`/dashboard/jobs/${id}`)
  }

  // --- Export CSV ---
  const handleExport = () => {
    const csv = ['ID,Title,Customer,Technician,Status,Priority,Date', ...filtered.map(j => `${j.id},${j.title},${j.customer},${j.technician},${j.status},${j.priority},${j.date}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'jobs_export.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const confirmDelete = (id) => {
    deleteJob(id)
    setDeleteConfirmId(null)
  }

  const confirmCancel = (id) => {
    updateStatus(id, 'Cancelled')
    setCancelConfirmId(null)
  }

  const statusColors = {
    'En Route': 'text-blue-400 bg-blue-400/10',
    'On Site': 'text-cyan-400 bg-cyan-400/10',
    'Completed': 'text-emerald-400 bg-emerald-400/10',
    'Pending': 'text-amber-400 bg-amber-400/10',
    'In Progress': 'text-purple-400 bg-purple-400/10',
    'Cancelled': 'text-rose-400 bg-rose-400/10',
  }

  const roleTitles = {
    admin: 'Jobs Management',
    manager: 'Job Operations',
    technician: 'My Assigned Jobs',
    customer: 'My Service Requests',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{roleTitles[role] || 'Jobs'}</h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              {role}
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            {role === 'admin' ? 'Create and monitor all field service requests.' :
             role === 'manager' ? 'Manage, assign, and control job operations.' :
             role === 'technician' ? 'View and update your assigned jobs.' :
             'Track your active service requests.'}
          </p>
        </div>
        {canCreate && (
          <GradientButton className="w-full sm:w-auto" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Create New Job</>}
          </GradientButton>
        )}
      </div>

      {/* Create Job Form (Admin Only) */}
      <AnimatePresence>
        {showCreateForm && canCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/5 to-transparent overflow-visible" hover={false}>
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Plus size={20} className="text-brand-cyan" /> Create New Job</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Searchable Customer Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Customer Name *</label>
                  <div className="relative">
                    <input 
                      value={customerSearch} 
                      onChange={e => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                        if (newJob.customerId && e.target.value !== newJob.customer) {
                          setNewJob({...newJob, customerId: '', customer: e.target.value})
                        }
                      }} 
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search or enter customer" 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 pr-10" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <ChevronDown 
                        size={16} 
                        className={`text-slate-500 cursor-pointer transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} 
                        onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                      />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showCustomerDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto scrollbar-hide py-2"
                      >
                        {(() => {
                           // If search matches the current selected customer exactly, show ALL customers
                           const displayList = (customerSearch === newJob.customer || !customerSearch) 
                             ? customersList 
                             : customersList.filter(c => 
                                 c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                                 c.email.toLowerCase().includes(customerSearch.toLowerCase())
                               );

                           return displayList.length > 0 ? (
                             displayList.map(c => (
                               <button 
                                 key={c.id} 
                                 onClick={() => selectCustomer(c)}
                                 className={`w-full text-left px-4 py-2 text-sm transition-colors ${newJob.customerId === c.id ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'text-slate-300 hover:bg-brand-cyan/10 hover:text-brand-cyan'}`}
                               >
                                 <div className="flex justify-between items-center">
                                   <div>
                                     <div className="font-bold">{c.name}</div>
                                     <div className="text-[10px] text-slate-500">{c.email}</div>
                                   </div>
                                   {newJob.customerId === c.id && <Shield size={12} />}
                                 </div>
                               </button>
                             ))
                           ) : (
                             <div className="px-4 py-2 text-sm text-slate-500 italic">No existing customer found. Type to add new.</div>
                           );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Job Title *</label>
                  <input value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="Enter job title" className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Service Type</label>
                  <select value={newJob.type} onChange={e => setNewJob({...newJob, type: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900">
                    <option>Scheduled Service</option>
                    <option>Emergency Repair</option>
                    <option>Installation</option>
                    <option>Maintenance</option>
                    <option>Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Priority</label>
                  <select value={newJob.priority} onChange={e => setNewJob({...newJob, priority: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Scheduled Date *</label>
                  <input type="date" value={newJob.date} onChange={e => setNewJob({...newJob, date: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Address</label>
                  <input value={newJob.address} onChange={e => setNewJob({...newJob, address: e.target.value})} placeholder="Enter job address" className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Line Items</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={syncAllPrices} className="text-emerald-400 text-xs flex items-center gap-1.5 hover:underline whitespace-nowrap">
                      <RefreshCcw size={14} /> Sync All Prices
                    </button>
                    <button
                      onClick={() => setLineItems(prev => [...prev, { id: Date.now(), desc: '', qty: 1, price: 0 }])}
                      className="text-brand-cyan text-sm flex items-center gap-1 hover:underline whitespace-nowrap"
                    >
                      <Plus size={14} /> Add Labor / Custom Item
                    </button>
                  </div>
                </div>

                {lineItems.map((item, idx) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end p-3 sm:p-0 rounded-2xl sm:rounded-none bg-white/[0.02] sm:bg-transparent border border-white/5 sm:border-0">
                    <div className="flex-1">
                      <input
                        placeholder="Description"
                        value={item.desc}
                        onChange={(e) => {
                          const next = [...lineItems]
                          next[idx].desc = e.target.value
                          setLineItems(next)
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="w-20 sm:w-24">
                        <input
                          placeholder="Qty"
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const next = [...lineItems]
                            next[idx].qty = Number(e.target.value)
                            setLineItems(next)
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                        />
                      </div>
                      <div className="flex-1 sm:w-32">
                        <input
                          placeholder="Price"
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const next = [...lineItems]
                            next[idx].price = parseFloat(e.target.value) || 0
                            setLineItems(next)
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                        />
                      </div>
                      <button
                        onClick={() => setLineItems(prev => prev.filter(row => row.id !== item.id))}
                        className="p-3 text-slate-600 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-white/5 flex flex-col items-stretch sm:items-end gap-3">
                  <div className="flex justify-between sm:w-64 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-white font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between sm:w-64 text-sm">
                    <span className="text-slate-500">Tax (8%)</span>
                    <span className="text-white font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between sm:w-64 text-xl border-t border-white/5 pt-3">
                    <span className="text-white font-bold underline decoration-brand-cyan decoration-2 underline-offset-8">Total</span>
                    <span className="text-brand-cyan font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <GradientButton onClick={handleCreate} className="py-2.5"><Plus size={16} /> Create Job</GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jobs Table */}
      <GlassCard className="p-0 overflow-hidden border-white/5" hover={false}>
        {/* Search & Filters */}
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col gap-4 bg-white/[0.02]">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search jobs, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${showFilters ? 'border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
              >
                <Filter size={16} /> Filters {statusFilter !== 'All' && <span className="w-2 h-2 rounded-full bg-brand-cyan" />}
              </button>
              <button 
                onClick={handleExport} 
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2">
                {['All', 'Pending', 'En Route', 'On Site', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30' : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
                {statusFilter !== 'All' && <button onClick={() => setStatusFilter('All')} className="text-xs text-rose-400 hover:text-rose-300 font-bold ml-2">Clear</button>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        {/* Mobile View - Cards */}
        <div className="md:hidden p-4 space-y-4 bg-white/[0.01]">
          {filtered.length > 0 ? filtered.map((job, index) => (
            <motion.div 
              key={job.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => goToDetail(job.id)}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                    <span className="text-[10px] font-mono text-brand-cyan font-bold block">{`JOB-${index + 1}`}</span>
                    <h3 className="font-bold text-white text-lg">{job.customer}</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{job.type || 'Scheduled Service'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                    onClick={(e) => { e.stopPropagation(); goToDetail(job.id); }}
                    className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-xl"
                    >
                    <Eye size={18} />
                    </button>
                    {canDelete && (
                        <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(job.id); }}
                        className="p-2 bg-rose-500/10 text-rose-500 rounded-xl"
                        >
                        <Trash2 size={18} />
                        </button>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Technician</p>
                        <div className="flex items-center gap-2">
                            <Avatar name={job.technician} className="w-5 h-5 rounded-full bg-slate-800" />
                            <span className={`font-medium ${job.technician === 'Unassigned' && job.status !== 'Completed' ? 'text-amber-400 italic' : 'text-slate-300'}`}>{job.technician}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Priority</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                        job.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                        }`}>{job.priority}</span>
                    </div>
                </div>
                <div className="space-y-3 text-right">
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Date</p>
                        <p className="text-slate-300 font-medium">{job.date}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Progress</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-cyan" style={{ width: `${job.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{job.progress}%</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Status</p>
                <div className={`w-full px-3 py-2 rounded-xl text-xs font-bold uppercase text-center tracking-widest border border-white/5 ${statusColors[job.status] || 'text-slate-400'}`}>
                    {job.status}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-12 text-center">
              <p className="text-xl font-bold text-white mb-2">No jobs found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Job ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Technician</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                {canViewActions && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length > 0 ? filtered.map((job, index) => (
                <motion.tr
                  key={job.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => goToDetail(job.id)}
                  className="cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="text-brand-cyan font-bold font-mono">{`JOB-${index + 1}`}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{job.customer}</span>
                      <span className="text-[10px] text-slate-500">{job.type || 'Scheduled Service'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={job.technician} className="w-6 h-6 rounded-full bg-slate-800" />
                      <span className={`text-sm ${job.technician === 'Unassigned' && job.status !== 'Completed' ? 'text-amber-400 italic' : 'text-slate-300'}`}>{job.technician}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[job.status] || 'text-slate-400 bg-slate-400/10'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      job.priority === 'High' ? 'text-rose-400 bg-rose-400/10' : job.priority === 'Medium' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10'
                    }`}>{job.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan rounded-full" style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{job.date}</td>
                  {canViewActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => goToDetail(job.id)} 
                          className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {canDelete && (
                          <button 
                            onClick={() => setDeleteConfirmId(job.id)} 
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete Job"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={canViewActions ? 8 : 7} className="px-6 py-16 text-center">
                    <p className="text-xl font-bold text-white mb-2">No jobs found</p>
                    <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
               <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-rose-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Confirm Deletion</h3>
               <p className="text-slate-400 mb-8 leading-relaxed">Are you sure you want to delete <span className="text-brand-cyan font-bold font-mono">{deleteConfirmId}</span>? This action is permanent and cannot be undone.</p>
               <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={() => confirmDelete(deleteConfirmId)} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-all">Delete</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCancelConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
               <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                <X size={32} className="text-amber-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Cancel Job?</h3>
               <p className="text-slate-400 mb-8 leading-relaxed">Are you sure you want to cancel <span className="text-brand-cyan font-bold font-mono">{cancelConfirmId}</span>? The job status will be set to Cancelled.</p>
               <div className="flex gap-4">
                <button onClick={() => setCancelConfirmId(null)} className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Back</button>
                <button onClick={() => confirmCancel(cancelConfirmId)} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">Cancel Job</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
