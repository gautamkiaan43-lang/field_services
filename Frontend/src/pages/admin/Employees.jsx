import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Users, Clock, X, MoreVertical,
  Trash2, Edit3, Phone, Mail, Shield, AlertTriangle,
  ChevronDown, Filter, Download, MapPin
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { useEmployees } from '../../context/EmployeesContext'
import { useJobs } from '../../context/JobsContext'
import { toast } from 'react-hot-toast'
import L from 'leaflet'

// Fix Default Icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function Employees() {
  const { employees, timesheets, addEmployee, updateEmployee, deleteEmployee } = useEmployees()
  const { jobs } = useJobs()

  const formatDuration = (hoursValue) => {
    const hours = Number(hoursValue)
    if (!Number.isFinite(hours) || hours <= 0) return '0m'

    const totalSeconds = hours * 3600
    if (totalSeconds < 60) return `${Math.max(1, Math.round(totalSeconds))}s`

    const totalMinutes = totalSeconds / 60
    if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`

    return `${parseFloat(hours.toFixed(2))}h`
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [showAllTimesheets, setShowAllTimesheets] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Technician',
    phone: '',
    email: '',
    status: 'Active',
    password: '',
    confirmPassword: ''
  })

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'All' || emp.role?.toUpperCase() === roleFilter.toUpperCase()
    return matchesSearch && matchesRole
  })

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (selectedEmployee?.latitude && selectedEmployee?.longitude && mapRef.current) {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([selectedEmployee.latitude, selectedEmployee.longitude], 14);
        L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenFreeMap contributors'
        }).addTo(mapInstanceRef.current);
        
        L.marker([selectedEmployee.latitude, selectedEmployee.longitude]).addTo(mapInstanceRef.current)
          .bindPopup(`<div style="text-align:center;font-weight:bold;">${selectedEmployee.name}<br/><span style="font-weight:normal;color:#64748b;font-size:12px;">Active Tracking</span></div>`)
          .openPopup();
      } else {
        mapInstanceRef.current.setView([selectedEmployee.latitude, selectedEmployee.longitude], 14);
      }
    }
    
    // Cleanup if unmounted or deselected
    return () => {
      if (mapInstanceRef.current && !selectedEmployee) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedEmployee]);

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields')
      return
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData)
      toast.success('Employee updated successfully')
    } else {
      addEmployee(formData)
      toast.success('Employee added successfully')
    }

    setShowAddModal(false)
    setEditingEmployee(null)
    setFormData({ name: '', role: 'Technician', phone: '', email: '', status: 'Active', password: '', confirmPassword: '' })
  }

  const openEdit = (emp) => {
    setEditingEmployee(emp)
    setFormData({
      name: emp.name,
      role: emp.role,
      phone: emp.phone,
      email: emp.email || '',
      status: emp.status,
      password: '',
      confirmPassword: ''
    })
    setShowAddModal(true)
  }

  const handleDelete = () => {
    deleteEmployee(deleteConfirmId)
    toast.success('Employee removed')
    setDeleteConfirmId(null)
  }

  const handleExport = () => {
    const csv = ['ID,Name,Role,Phone,Email,Status', ...filteredEmployees.map(e => `${e.id},${e.name},${e.role},${e.phone},${e.email || ''},${e.status}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employees_list.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exporting list...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Employees</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400">Manage team members, roles, and track time.</p>
            {filteredEmployees.length !== employees.length && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 animate-pulse">
                Showing {filteredEmployees.length} of {employees.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Download size={18} /> Export List
          </button>
          <GradientButton onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none px-6 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Plus size={18} /> Add Employee
          </GradientButton>
        </div>
      </div>

      {/* Search & Filters */}
      <GlassCard className="p-4 md:p-6 !overflow-visible z-20" hover={false}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-full px-6 rounded-xl border transition-all flex items-center gap-2 text-sm font-bold ${showFilters || roleFilter !== 'All' ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'}`}
            >
              <Filter size={18} /> 
              {roleFilter === 'All' ? 'Filters' : `Role: ${roleFilter}`}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] p-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Filter</p>
                    {roleFilter !== 'All' && (
                      <button onClick={() => { setRoleFilter('All'); setShowFilters(false); }} className="text-[10px] text-brand-cyan hover:underline font-bold">Clear</button>
                    )}
                  </div>
                  {['All', 'Technician', 'Manager', 'Admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => { setRoleFilter(role); setShowFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${roleFilter === role ? 'bg-brand-cyan/10 text-brand-cyan font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {role}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      {/* Employee List - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode='popLayout'>
          {filteredEmployees.map((emp) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={emp.id}
            >
              <GlassCard className="group relative h-full overflow-hidden border-white/5 hover:border-brand-cyan/20 transition-all duration-500" hover={false}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1 border border-white/10">
                        <Avatar name={emp.name} className="w-full h-full rounded-[14px]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-brand-cyan transition-colors line-clamp-1">{emp.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-md border border-white/5 group-hover:border-brand-cyan/20 transition-colors">
                            {emp.id}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(emp)} className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                      <button onClick={() => setDeleteConfirmId(emp.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Shield size={14} className="text-brand-cyan/70" />
                      <span className="font-medium">{emp.role}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Phone size={14} className="text-brand-cyan/70" />
                      <span>{emp.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Mail size={14} className="text-brand-cyan/70" />
                      <span className="truncate">{emp.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-brand-purple/70" />
                      <span className="text-xs font-medium text-slate-500">Last Active: Today</span>
                    </div>
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest hover:underline px-3 py-1.5 bg-brand-cyan/5 rounded-lg border border-brand-cyan/10 active:scale-95 transition-all"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Time Tracking - Responsive Table Card */}
      <GlassCard className="p-0 border-white/5 overflow-hidden" hover={false}>
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Clock className="text-brand-purple" size={24} /> Time Tracking</h2>
          <button 
            onClick={() => setShowAllTimesheets(true)}
            className="text-xs font-bold text-brand-purple uppercase tracking-widest hover:underline"
          >
            View All Records
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-hide custom-scrollbar pb-2">
          <div className="min-w-[600px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-white/5 font-bold">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">In / Out</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {timesheets.map((ts, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={ts.name} className="w-6 h-6 rounded-lg bg-slate-800" />
                        <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{ts.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">{ts.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                        <span className="text-emerald-400">{ts.clockIn}</span>
                        <span className="text-slate-500">{ts.clockOut}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-brand-cyan tracking-tighter">{formatDuration(ts.totalHours)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${ts.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>{ts.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-brand-purple" />
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                    <p className="text-sm text-slate-400 mt-1">Configure user role and access credentials.</p>
                  </div>
                  <button onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"><X size={20} /></button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Full Name</label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                        placeholder="e.g. Alex Rivera"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Role</label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900"
                      >
                        <option>Technician</option>
                        <option>Manager</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900"
                      >
                        <option>Active</option>
                        <option>On Leave</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Phone</label>
                      <input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                        placeholder="name@company.com"
                      />
                    </div>
                    {!editingEmployee && (
                      <>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                          <input
                            required
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Confirm Password</label>
                          <input
                            required
                            type="password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                            placeholder="••••••••"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} className="flex-1 py-3 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-all">Cancel</button>
                    <GradientButton type="submit" className="flex-1 py-3 font-bold">{editingEmployee ? 'Update Member' : 'Add Member'}</GradientButton>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Remove Employee?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">This will remove <span className="text-brand-cyan font-bold font-mono">{deleteConfirmId}</span> from the active roster. This action cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-all">Keep</button>
                <button onClick={handleDelete} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Profile Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedEmployee(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-cyan to-brand-purple" />
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6 min-w-0">
                    <div className="w-24 h-24 rounded-3xl bg-slate-800 p-1.5 border border-white/10 shadow-2xl">
                      <Avatar name={selectedEmployee.name} className="w-full h-full rounded-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-3xl font-bold text-white truncate">{selectedEmployee.name}</h2>
                      <p className="text-brand-cyan font-medium flex items-center gap-2 mt-1">
                        <Shield size={16} /> {selectedEmployee.role}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                          {selectedEmployee.id}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${selectedEmployee.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-slate-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Phone size={18} className="text-brand-cyan" /></div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Phone Number</p>
                          <p className="font-medium">{selectedEmployee.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300">
                        <div className="p-2 bg-white/5 rounded-lg"><Mail size={18} className="text-brand-cyan" /></div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Email Address</p>
                          <p className="font-medium truncate">{selectedEmployee.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Performance Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Hours</p>
                        <p className="text-xl font-bold text-white tracking-tight">
                          {formatDuration(timesheets
                            .filter(ts => String(ts.employeeId) === String(selectedEmployee.id))
                            .reduce((acc, ts) => acc + parseFloat(ts.totalHours || 0), 0)
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Jobs Done</p>
                        <p className="text-xl font-bold text-brand-purple tracking-tight">
                          {jobs.filter(j => String(j.technicianId) === String(selectedEmployee.id) && j.status === 'Completed').length}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-brand-cyan/10 to-transparent rounded-2xl border border-brand-cyan/20">
                      <p className="text-xs font-bold text-brand-cyan mb-2">Efficiency Rating</p>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-brand-cyan shadow-[0_0_10px_#22d3ee]" />
                      </div>
                      <p className="text-right text-[10px] font-bold text-slate-400 mt-1">92% Average</p>
                    </div>
                  </div>
                </div>

                {selectedEmployee.latitude && selectedEmployee.longitude && (() => {
                  const rawTimestamp = selectedEmployee.lastLocationUpdate;
                  let parsedValue = rawTimestamp;
                  // Ensure standard ISO format if raw SQL returns space-separated MySQL timestamp
                  if (typeof rawTimestamp === 'string' && rawTimestamp.includes(' ') && !rawTimestamp.includes('T')) {
                    parsedValue = rawTimestamp.replace(' ', 'T') + (rawTimestamp.endsWith('Z') ? '' : 'Z');
                  }
                  
                  const formattedTime = rawTimestamp 
                    ? new Date(parsedValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                    
                  console.log('Employee GPS Timestamp Validation:', { 
                    fieldUsed: 'lastLocationUpdate', 
                    rawTimestamp, 
                    parsedValue,
                    formattedTime 
                  });

                  return (
                    <div className="mt-8 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={16} className="text-brand-cyan" /> Current Location
                        </h3>
                        <span className="text-[10px] text-slate-400">Last updated: {formattedTime}</span>
                      </div>
                      <div 
                          ref={mapRef} 
                          className="h-48 w-full rounded-2xl overflow-hidden border border-white/10 relative z-0" 
                          style={{ backgroundColor: '#0f172a' }} 
                      />
                    </div>
                  );
                })()}

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <GradientButton onClick={() => { openEdit(selectedEmployee); setSelectedEmployee(null); }} className="flex-1 py-3 font-bold flex items-center justify-center gap-2">
                    <Edit3 size={18} /> Edit Profile
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* View All Timesheets Modal */}
      <AnimatePresence>
        {showAllTimesheets && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAllTimesheets(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="text-brand-purple" size={24} /> Full Time Tracking Logs
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Detailed history of all employee clock-in and clock-out events.</p>
                </div>
                <button onClick={() => setShowAllTimesheets(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto p-0 flex-grow custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-white/5 font-bold bg-slate-900">
                      <th className="px-8 py-4">Employee</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Clock In</th>
                      <th className="px-8 py-4">Clock Out</th>
                      <th className="px-8 py-4">Hours</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timesheets.map((ts, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar name={ts.name} className="w-8 h-8 rounded-xl bg-slate-800" />
                            <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{ts.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-400 font-medium">{ts.date}</td>
                        <td className="px-8 py-5 text-sm text-emerald-400 font-mono">{ts.clockIn}</td>
                        <td className="px-8 py-5 text-sm text-rose-400 font-mono">{ts.clockOut || '--:--'}</td>
                        <td className="px-8 py-5 text-base font-bold text-brand-cyan tracking-tighter">{formatDuration(ts.totalHours)}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ts.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            ts.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>{ts.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-slate-950/50 border-t border-white/5 flex justify-end">
                 <button onClick={() => setShowAllTimesheets(false)} className="px-8 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all">Close Records</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
