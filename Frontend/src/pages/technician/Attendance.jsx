import React, { useState, useEffect } from 'react'
import { Clock, Play, Pause, CheckCircle2, Calendar } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

export default function Attendance() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [timer, setTimer] = useState('00:00:00')
  const [history, setHistory] = useState([])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/timesheets/my-history')
      setHistory(res.data)
      if (res.data.length > 0 && !res.data[0].clockOut) {
        setIsClockedIn(true)
      } else {
        setIsClockedIn(false)
        setTimer('00:00:00')
      }
    } catch (e) {
      console.error('Failed to load attendance history', e)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    let interval;
    if (isClockedIn && history.length > 0 && !history[0].clockOut) {
      const startTime = new Date(history[0].clockIn).getTime()
      interval = setInterval(() => {
        const diff = Date.now() - startTime
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
        setTimer(`${h}:${m}:${s}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isClockedIn, history])

  const handleClockToggle = async () => {
    try {
      if (isClockedIn) {
        await api.post('/timesheets/clock-out', { time: new Date().toISOString() })
        toast.success("Clocked out successfully")
      } else {
        await api.post('/timesheets/clock-in', { time: new Date().toISOString() })
        toast.success("Clocked in successfully")
      }
      fetchHistory()
    } catch (e) {
      toast.error('Failed to update attendance status')
    }
  }

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Attendance</h1>
          <p className="text-slate-400 mt-1">Track your daily clock-in/out and attendance history.</p>
        </div>
      </div>

      <GlassCard className="bg-gradient-to-r from-brand-cyan/10 to-brand-purple/10 border-white/10" glow>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Current Session</p>
            <div className="text-5xl font-bold text-white font-mono tracking-tighter">{timer}</div>
            <p className={`text-sm mt-2 font-bold ${isClockedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isClockedIn ? '● Clocked In — Active' : '○ Not Clocked In'}
            </p>
          </div>
          <button
            onClick={handleClockToggle}
            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg transition-all ${
              isClockedIn
                ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                : 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isClockedIn ? <><Pause size={24} /> Clock Out</> : <><Play size={24} /> Clock In</>}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="border-white/5 p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-brand-cyan" size={20} /> Attendance History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Clock In</th>
                <th className="px-6 py-4 font-semibold">Clock Out</th>
                <th className="px-6 py-4 font-semibold">Total Hours</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((ts) => (
                <tr key={ts.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">
                    {new Date(ts.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{formatTime(ts.clockIn)}</td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{formatTime(ts.clockOut)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-cyan">
                    {formatDuration(ts.totalHours)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ts.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{ts.status || 'PENDING'}</span>
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
