import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, MapPin, Clock, ChevronRight, Plus, X, UserCheck } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useJobs } from '../../context/JobsContext'
import { useEmployees } from '../../context/EmployeesContext'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Dispatch() {
  const { jobs, assignTechnician } = useJobs()
  const { employees } = useEmployees()
  const navigate = useNavigate()

  const [assignModal, setAssignModal] = useState(null)
  const [selectedTech, setSelectedTech] = useState('')

  const techs = employees.filter(e => e.role === 'TECHNICIAN' || e.user?.role === 'TECHNICIAN')

  // Calculate stats for technicians
  const technicians = techs.map(tech => {
    const activeJobs = jobs.filter(j =>
      (String(j.technicianId) === String(tech.id)) &&
      ['Pending', 'Scheduled', 'En Route', 'On Site', 'In Progress'].includes(j.status)
    ).length

    let status = 'Available'
    if (activeJobs > 2) status = 'Busy'
    else if (activeJobs > 0) status = 'On Site'

    return { name: tech.name, status, jobs: activeJobs }
  })

  const unassignedJobs = jobs.filter(j => j.technician === 'Unassigned' && !['Completed', 'Cancelled'].includes(j.status))

  const handleAssign = (e) => {
    e.preventDefault()
    if (!selectedTech) {
      toast.error('Please select a technician')
      return
    }
    const techName = techs.find(t => String(t.id) === String(selectedTech))?.name || selectedTech
    assignTechnician(assignModal.id, selectedTech)
    toast.success(`Job ${assignModal.id} assigned to ${techName}`)
    setAssignModal(null)
    setSelectedTech('')
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dispatch Board</h1>
          <p className="text-slate-400 mt-1">Assign technicians and manage daily schedule.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => toast.success('Switching to daily view...')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Calendar size={18} /> Daily View
          </button>
          <GradientButton className="flex-1 sm:flex-none" onClick={() => navigate('/dashboard/manager/jobs')}>
            <Plus size={18} /> Schedule Job
          </GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Technicians List */}
        <GlassCard className="lg:col-span-1 p-0 overflow-hidden border-white/5 h-fit">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-brand-cyan" /> Technicians
            </h3>
          </div>
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {technicians.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No active technicians found.</p>
            ) : (
              technicians.map((tech, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white truncate mr-2">{tech.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0 ${tech.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' :
                      tech.status === 'On Site' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{tech.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">{tech.jobs} active job{tech.jobs !== 1 && 's'}</span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-brand-cyan transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Unassigned Jobs */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-rose-400" /> Pending Dispatch
          </h3>

          {unassignedJobs.length === 0 ? (
            <GlassCard className="py-12 text-center border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <UserCheck size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
              <p className="text-sm text-slate-400">There are currently no pending jobs needing to be dispatched.</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unassignedJobs.map((job) => (
                <GlassCard key={job.id} className="group transition-all hover:border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-white transition-colors">{job.id}</h4>
                      <p className="text-sm text-slate-400">{job.customer}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${job.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                      job.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                      {job.priority} Priority
                    </span>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
                      <MapPin size={14} className="shrink-0" /> {job.address || '789 Oak Lane, Glendale, CA'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock size={14} className="shrink-0" /> {job.date} (Scheduled)
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <GradientButton className="flex-1 py-2 text-xs" onClick={() => setAssignModal(job)}>Quick Assign</GradientButton>
                    <button
                      onClick={() => navigate(`/dashboard/manager/jobs`)}
                      className="p-2 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      title="View Job Details"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ASSIGN MODAL */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
            <motion.form
              onSubmit={handleAssign}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-cyan" />
              <button type="button" onClick={() => setAssignModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>

              <div className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10">
                <Users className="text-brand-cyan" size={24} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Assign {assignModal.id}</h3>
              <p className="text-slate-400 text-sm mb-6">{assignModal.customer}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Technician</label>
                  <select
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                    required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 cursor-pointer appearance-none [&>option]:bg-slate-900"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">Choose a technician...</option>
                    {techs.map(tech => (
                      <option key={tech.id} value={tech.id} className="bg-slate-900 text-white">{tech.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm"
                >
                  Cancel
                </button>
                <GradientButton className="flex-1 py-3" type="submit">
                  Confirm
                </GradientButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
