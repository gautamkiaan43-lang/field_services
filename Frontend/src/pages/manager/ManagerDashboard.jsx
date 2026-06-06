import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, CheckCircle2, AlertCircle, Clock, Calendar, Download, ChevronRight } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useJobs } from '../../context/JobsContext'
import { useEmployees } from '../../context/EmployeesContext'

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { jobs } = useJobs()
  const { employees } = useEmployees()
  
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [kpis, setKpis] = useState([])

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      toast.success('Report downloaded successfully')
    }, 1500)
  }

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/analytics/manager-kpis')
        setKpis(res.data)
        setLoading(false)
      } catch (error) {
        console.error('KPI fetch error:', error)
        toast.error('Failed to load analytics')
        setLoading(false)
      }
    }
    fetchKPIs()
  }, [])

  const activeJobs = jobs.filter(j => ['In Progress', 'Pending'].includes(j.status)).slice(0, 5)
  const onlineTechs = employees.filter(e => e.role === 'Technician' && e.status === 'Active').slice(0, 6)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manager Overview</h1>
          <p className="text-slate-400 mt-1">Monitor daily operations and team performance.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <GradientButton 
            variant="secondary" 
            className="flex-1 sm:flex-none"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <span className="flex items-center gap-2 text-xs font-bold font-mono">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
                <span className="flex items-center gap-2 text-xs font-bold font-mono">
                    <Download size={16} /> Download Report
                </span>
            )}
          </GradientButton>
          <GradientButton 
            className="flex-1 sm:flex-none"
            onClick={() => navigate('/dashboard/manager/calendar')}
          >
            <Calendar size={18} /> View Schedule
          </GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <GlassCard key={idx} className="p-0 border-white/5 overflow-hidden group">
            <div className={`h-1.5 w-full bg-gradient-to-r ${kpi.color}`} />
            <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
                 <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-300">
                   {kpi.trend}
                 </span>
               </div>
               <div className="flex items-end justify-between">
                 <h3 className="text-3xl font-bold text-white">{kpi.value}</h3>
               </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard title="Recent Job Status">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Briefcase className="text-brand-cyan" size={20} /> Active Jobs
          </h2>
          <div className="space-y-4">
            {activeJobs.length > 0 ? activeJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate(`/dashboard/manager/jobs/${job.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{job.customer}</p>
                  <p className="text-sm text-slate-400 truncate">Tech: {job.technician}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                    job.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    job.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-brand-cyan/10 text-brand-cyan'
                    }`}>
                    {job.status}
                    </span>
                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} />
                    </button>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-500 py-8 text-sm">No active jobs found.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard title="Technician Status">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="text-brand-purple" size={20} /> Team Online
          </h2>
          <div className="space-y-4">
            {onlineTechs.length > 0 ? onlineTechs.map((tech) => (
              <div key={tech.id} className="p-4 rounded-xl bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/10 transition-all shadow-lg shadow-black/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden shadow-inner shadow-black/40">
                    <Avatar name={tech.name} className="w-full h-full rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{tech.name}</p>
                    <p className="text-xs text-slate-400 truncate">{tech.phone || 'Active Tech'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {tech.status || 'Active'}
                    </span>
                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} />
                    </button>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-500 py-8 text-sm">No technicians online.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
