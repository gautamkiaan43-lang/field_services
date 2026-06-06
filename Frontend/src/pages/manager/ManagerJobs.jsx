import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, Eye, Edit3, Briefcase } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useJobs } from '../../context/JobsContext'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

export default function ManagerJobs() {
  const { jobs, assignTechnician, updateStatus } = useJobs()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [technicians, setTechnicians] = useState([])

  useEffect(() => {
    api.get('/employees?role=TECHNICIAN')
      .then(res => setTechnicians(res.data))
      .catch(() => {})
  }, [])

  const filtered = jobs.filter(j => !searchTerm || j.id.toLowerCase().includes(searchTerm.toLowerCase()) || j.customer.toLowerCase().includes(searchTerm.toLowerCase()))

  const statusColors = {
    'En Route': 'text-blue-400 bg-blue-400/10',
    'On Site': 'text-cyan-400 bg-cyan-400/10',
    'Completed': 'text-emerald-400 bg-emerald-400/10',
    'Pending': 'text-amber-400 bg-amber-400/10',
    'In Progress': 'text-purple-400 bg-purple-400/10',
    'Cancelled': 'text-rose-400 bg-rose-400/10',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Job Operations</h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/10 text-purple-400 border border-purple-400/20">Manager</span>
          </div>
          <p className="text-slate-400 mt-1">Assign technicians, manage statuses, and control job operations.</p>
        </div>
      </div>
 
      <GlassCard className="p-0 overflow-hidden border-white/5" hover={false}>
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
            />
          </div>
          <span className="text-sm text-slate-500 self-end md:self-auto">{filtered.length} jobsFOUND</span>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden p-4 space-y-4 bg-white/[0.01]">
          {filtered.map((job, index) => (
            <div key={job.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                    <span className="text-[10px] font-mono text-brand-cyan font-bold block">{index + 1}</span>
                    <h3 className="font-bold text-white text-lg">{job.customer}</h3>
                </div>
                <button 
                  onClick={() => navigate(`/dashboard/manager/jobs/${job.id}`)}
                  className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-xl"
                >
                  <Eye size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Priority</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    job.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                    job.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                    }`}>{job.priority}</span>
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-cyan" style={{ width: `${job.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{job.progress}%</span>
                    </div>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Status</p>
                <select
                    value={job.status}
                    onChange={e => updateStatus(job.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 bg-slate-900 focus:outline-none appearance-none [&>option]:bg-slate-900 ${statusColors[job.status] || 'text-slate-400'}`}
                >
                    {['Pending', 'En Route', 'On Site', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                    <option key={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                </select>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Assign Technician</p>
                <div className="relative">
                    <select
                        value={job.technicianId || "Unassigned"}
                        onChange={(e) => assignTechnician(job.id, e.target.value)}
                        className="w-full appearance-none bg-slate-900 border border-white/10 text-white text-sm rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:border-brand-cyan transition-colors [&>option]:bg-slate-900"
                    >
                        <option value="Unassigned">Unassigned</option>
                        {job.technician === 'Internal' && <option value="Internal">Internal</option>}
                        {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500">No jobs found matching your search.</p>
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Assign Technician</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((job, index) => (
                <tr key={job.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-brand-cyan font-bold">{index + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-white">{job.customer}</span>
                    <p className="text-[10px] text-slate-500">{job.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      job.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                      job.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>{job.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={job.status}
                      onChange={e => updateStatus(job.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 focus:outline-none cursor-pointer appearance-none [&>option]:bg-slate-900 ${statusColors[job.status] || 'text-slate-400 bg-slate-400/10'}`}
                    >
                      {['Pending', 'En Route', 'On Site', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                        <option key={s} className="bg-slate-900 text-white">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan rounded-full" style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block w-48">
                      <select
                        value={job.technicianId || "Unassigned"}
                        onChange={(e) => assignTechnician(job.id, e.target.value)}
                        className="w-full appearance-none bg-slate-900 border border-white/10 text-white text-sm rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-brand-cyan transition-colors cursor-pointer [&>option]:bg-slate-900"
                      >
                        <option value="Unassigned">Unassigned</option>
                        {job.technician === 'Internal' && <option value="Internal">Internal</option>}
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => navigate(`/dashboard/manager/jobs/${job.id}`)} className="p-2 text-slate-500 hover:text-brand-cyan hover:bg-white/5 rounded-lg transition-all" title="View Details">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
