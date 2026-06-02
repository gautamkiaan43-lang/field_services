import React from 'react'

const statusStyles = {
  'NEW': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'REVIEWING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'PROPOSED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'SCHEDULED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'REJECTED': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'CONVERTED': 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20'
}

export default function LeadStatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${style}`}>
      {status}
    </span>
  )
}
