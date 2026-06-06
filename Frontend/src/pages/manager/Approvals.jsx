import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, FileText, CheckCircle2, XCircle, Clock, Package, Filter } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('Timesheets')
  const [searchTerm, setSearchTerm] = useState('')
  const [timesheets, setTimesheets] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [tsRes, mrRes] = await Promise.all([
        api.get('/timesheets?status=PENDING'),
        api.get('/material-requests?status=PENDING')
      ])
      setTimesheets(tsRes.data)
      setRequests(mrRes.data)
    } catch (e) {
      toast.error('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Filter pending data
  const pendingTimesheets = timesheets.filter(ts =>
    !searchTerm || ts.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingRequests = requests.filter(req =>
    !searchTerm || req.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTimesheetAction = async (ts, action) => {
    try {
      await api.patch(`/timesheets/${ts.id}/status`, { status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
      toast.success(`Timesheet ${action === 'approve' ? 'approved' : 'rejected'}`)
      fetchData()
    } catch (e) { toast.error('Action failed') }
  }

  const handleRequestAction = async (req, action) => {
    try {
      await api.patch(`/material-requests/${req.id}/status`, { status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`)
      fetchData()
    } catch (e) { toast.error('Action failed') }
  }

  const currentData = activeTab === 'Timesheets' ? pendingTimesheets : pendingRequests

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pending Approvals</h1>
          <p className="text-slate-400 mt-1">Review items requiring your authorization.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
            {['Timesheets', 'Material Requests'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === tab ? 'bg-brand-cyan text-slate-900 shadow-lg shadow-brand-cyan/20' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden" hover={false}>
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
                />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter size={14} />
                <span>Showing {currentData.length} pending items</span>
            </div>
        </div>

        <div className="overflow-x-auto">
          <AnimatePresence mode="wait">
            {currentData.length > 0 ? (
              <>
                {/* Mobile View - Cards */}
                <div className="md:hidden p-4 space-y-4">
                  {currentData.map((item, idx) => (
                    <motion.div 
                      key={item.id || idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                               activeTab === 'Timesheets' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                           }`}>
                               {activeTab === 'Timesheets' ? <Clock size={16} /> : <Package size={16} />}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white">{activeTab === 'Timesheets' ? item.employee?.name : item.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{activeTab === 'Timesheets' ? new Date(item.date).toLocaleDateString() : `SKU: ${item.sku}`}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-sm font-bold tracking-tight ${activeTab === 'Timesheets' ? 'text-white' : 'text-brand-cyan'}`}>
                              {activeTab === 'Timesheets' ? `${item.totalHours ?? '-'} hrs` : `${item.quantity} units`}
                           </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>{activeTab === 'Timesheets' ? `${item.clockIn ? new Date(item.clockIn).toLocaleTimeString() : '-'} - ${item.clockOut ? new Date(item.clockOut).toLocaleTimeString() : 'ongoing'}` : `Employee: ${item.employee?.name}`}</span>
                        <span className="bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Pending Approval</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                            onClick={() => activeTab === 'Timesheets' ? handleTimesheetAction(item, 'approve') : handleRequestAction(item, 'approve')} 
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                            <CheckCircle2 size={16} /> Approve
                        </button>
                        <button 
                            onClick={() => activeTab === 'Timesheets' ? handleTimesheetAction(item, 'reject') : handleRequestAction(item, 'reject')} 
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                        >
                            <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <motion.table 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="hidden md:table w-full text-left"
                >
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4 font-bold text-center w-20">Type</th>
                      <th className="px-6 py-4 font-bold">Details</th>
                      <th className="px-6 py-4 font-bold">{activeTab === 'Timesheets' ? 'Hours' : 'Quantity'}</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentData.map((item, idx) => (
                      <tr key={item.id || idx} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto border ${
                              activeTab === 'Timesheets' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                          }`}>
                              {activeTab === 'Timesheets' ? <Clock size={18} /> : <Package size={18} />}
                          </div>
                        </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                               {activeTab === 'Timesheets' ? item.employee?.name : item.name}
                             </span>
                             <span className="text-[10px] text-slate-500 font-medium">
                               {activeTab === 'Timesheets' ? `${item.clockIn ? new Date(item.clockIn).toLocaleTimeString() : '-'} - ${item.clockOut ? new Date(item.clockOut).toLocaleTimeString() : 'ongoing'}` : `Employee: ${item.employee?.name}`}
                             </span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`text-sm font-bold tracking-tight ${activeTab === 'Timesheets' ? 'text-white' : 'text-brand-cyan'}`}>
                             {activeTab === 'Timesheets' ? `${item.totalHours ?? '-'} hrs` : `${item.quantity} units`}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                             {activeTab === 'Timesheets' ? new Date(item.date).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                         </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                              <button 
                                  onClick={() => activeTab === 'Timesheets' ? handleTimesheetAction(item, 'approve') : handleRequestAction(item, 'approve')} 
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                  title="Approve"
                              >
                                  <CheckCircle2 size={16} />
                              </button>
                              <button 
                                  onClick={() => activeTab === 'Timesheets' ? handleTimesheetAction(item, 'reject') : handleRequestAction(item, 'reject')} 
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                                  title="Reject"
                              >
                                  <XCircle size={16} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </motion.table>
              </>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-24 flex flex-col items-center justify-center text-center px-6"
              >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Shield size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No {activeTab.toLowerCase()} to review</h3>
                  <p className="text-slate-500 text-sm max-w-xs">Everything is up to date! There are no pending approval requests in this category.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  )
}

