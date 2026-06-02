import React, { useState, useEffect } from 'react'
import {
  DollarSign, Briefcase, Users, TrendingUp,
  BarChart3, FileText, ChevronDown
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import api from '../../services/api'

export default function Reports() {
  const [timeframe, setTimeframe] = useState('6m')
  const [stats, setStats] = useState([])
  const [revenueHistory, setRevenueHistory] = useState([])
  const [jobStats, setJobStats] = useState([])
  const [recentPayments, setRecentPayments] = useState([])

  const fetchReportsData = async () => {
    try {
      const [kpiRes, revRes, jobRes, payRes] = await Promise.all([
        api.get('/analytics/admin-kpis'),
        api.get('/analytics/revenue'),
        api.get('/analytics/job-stats'),
        api.get('/payments')
      ]);
      setStats(kpiRes.data);
      setRevenueHistory(revRes.data);
      setJobStats(jobRes.data);
      setRecentPayments(payRes.data.slice(0, 5).map(p => ({
        id: p.id,
        customer: p.invoice?.job?.customer?.name || 'Unknown',
        method: p.method || 'Credit Card',
        date: new Date(p.createdAt).toLocaleDateString(),
        amount: `$${p.amount.toLocaleString()}`,
        status: 'Completed'
      })));
    } catch (e) {
      console.error('Failed to fetch reports data', e);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const revenueData = timeframe === '6m' ? revenueHistory.slice(0, 6) : revenueHistory;
  const maxAmount = revenueData.length > 0 ? Math.max(...revenueData.map(r => r.amount)) : 1000;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Track revenue, jobs, and team performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={i} className="p-0 border-white/5 overflow-hidden">
            <div className={`h-1.5 w-full bg-gradient-to-r ${stat.color}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{stat.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`}>
                  {stat.label.includes('Revenue') ? <DollarSign size={16} className="text-white" /> :
                    stat.label.includes('Job') ? <Briefcase size={16} className="text-white" /> :
                      stat.label.includes('Customer') ? <Users size={16} className="text-white" /> :
                        <TrendingUp size={16} className="text-white" />}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Chart */}
      <GlassCard>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-brand-cyan" size={20} /> Monthly Revenue
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeframe('6m')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${timeframe === '6m' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeframe('1y')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${timeframe === '1y' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              1 Year
            </button>
          </div>
        </div>
        <div className="flex items-end gap-2 md:gap-4 h-64 overflow-x-auto scrollbar-hide">
          {revenueData.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">${(item.amount / 1000).toFixed(0)}k</span>
              <div className="w-full relative group">
                <div
                  className="w-full bg-gradient-to-t from-brand-teal to-brand-cyan rounded-t-xl transition-all group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:from-brand-cyan group-hover:to-cyan-400"
                  style={{ height: `${(item.amount / maxAmount) * 200}px` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-bold">{item.month}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Job Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Briefcase className="text-brand-purple" size={18} /> Jobs by Status
          </h2>
          <div className="space-y-4">
            {jobStats.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium">{item.status}</span>
                  <span className="text-white font-bold">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="text-brand-cyan" size={18} /> Recent Payments
          </h2>
          <div className="space-y-3">
            {recentPayments.map(pay => (
              <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-bold text-white">{pay.customer}</p>
                  <p className="text-xs text-slate-500">{pay.method} • {pay.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{pay.amount}</p>
                  <span className={`text-[10px] font-bold uppercase ${pay.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>{pay.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
