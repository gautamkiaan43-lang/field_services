import React, { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import api from '../../services/api'

export default function Timesheets() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/timesheets/my-history')
        setHistory(res.data)
      } catch (e) {
        console.error('Failed to load timesheets', e)
      }
    }
    fetchHistory()
  }, [])

  const totalHours = history.reduce((sum, h) => sum + Number(h.totalHours || 0), 0)
  const approvedHours = history.filter(h => h.status === 'APPROVED').reduce((sum, h) => sum + Number(h.totalHours || 0), 0)
  const pendingHours = history.filter(h => !h.status || h.status === 'PENDING').reduce((sum, h) => sum + Number(h.totalHours || 0), 0)

  const formatTime = (isoString) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (hoursValue) => {
    const hours = Number(hoursValue)
    if (!Number.isFinite(hours) || hours <= 0) return '0m'

    const totalSeconds = hours * 3600
    if (totalSeconds < 60) return `${Math.max(1, Math.round(totalSeconds))}s`

    const totalMinutes = totalSeconds / 60
    if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`

    return `${parseFloat(hours.toFixed(2))}h`
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Timesheets</h1>
          <p className="text-slate-400 mt-1">View hours logged.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-0 border-white/5 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="p-6">
            <p className="text-slate-400 text-sm">Total Hours Logged</p>
            <h3 className="text-3xl font-bold text-white mt-2">{formatDuration(totalHours)}</h3>
          </div>
        </GlassCard>
        <GlassCard className="p-0 border-white/5 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="p-6">
            <p className="text-slate-400 text-sm">Approved</p>
            <h3 className="text-3xl font-bold text-white mt-2">{formatDuration(approvedHours)}</h3>
          </div>
        </GlassCard>
        <GlassCard className="p-0 border-white/5 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="p-6">
            <p className="text-slate-400 text-sm">Pending Review</p>
            <h3 className="text-3xl font-bold text-white mt-2">{formatDuration(pendingHours)}</h3>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-brand-cyan" size={20} /> Daily Timesheets
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Clock In</th>
                <th className="px-6 py-4 font-semibold">Clock Out</th>
                <th className="px-6 py-4 font-semibold">Hours</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatTime(row.clockIn)}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{formatTime(row.clockOut)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{formatDuration(row.totalHours)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      row.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{row.status || 'PENDING'}</span>
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
