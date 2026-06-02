import React, { useState, useEffect } from 'react'
import { History, MapPin, ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

export default function JobHistory() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/customer/jobs/history')
        setHistory(data)
      } catch (error) {
        toast.error('Failed to load job history')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
         <Loader2 className="animate-spin text-brand-cyan" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Job History</h1>
        <p className="text-slate-400 mt-1">View all your past service projects.</p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
           <GlassCard className="p-12 text-center text-slate-500">
             <History size={48} className="mx-auto mb-4 opacity-50" />
             <p>No past projects found.</p>
           </GlassCard>
        ) : (
          history.map((job) => (
            <GlassCard key={job.id} onClick={() => navigate(`/dashboard/portal/job/${job.id}`)} className="group cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors truncate">{job.title || 'General Service'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-[10px] text-brand-cyan font-bold font-mono tracking-wider">JOB-{job.id}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tech: {job.assignedEmployee?.user?.name || 'Unassigned'}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(job.scheduledAt || job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-left sm:text-right">
                    <p className="text-xl font-bold text-white tracking-tight">
                      ${(() => {
                        const amt = job.invoice?.total || job.invoice?.totalAmount || job.estimate?.totalAmount || 0;
                        return parseFloat(amt).toLocaleString(undefined, { minimumFractionDigits: 2 });
                      })()}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                      {job.invoice?.status === 'Paid' ? 'Paid' : job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
