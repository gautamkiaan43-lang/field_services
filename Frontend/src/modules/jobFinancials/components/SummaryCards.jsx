import React from 'react'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Receipt } from 'lucide-react'

export default function SummaryCards({ deposits = 0, labor = 0, materials = 0, balance = 0 }) {
  const isOverdrawn = balance <= 0

  const cards = [
    {
      title: 'Total Deposits',
      value: `$${deposits.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Labor Spent',
      value: `$${labor.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20'
    },
    {
      title: 'Material Spent',
      value: `$${materials.toFixed(2)}`,
      icon: Receipt,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'Remaining Balance',
      value: `$${balance.toFixed(2)}`,
      icon: Wallet,
      color: isOverdrawn ? 'text-rose-400' : 'text-brand-cyan',
      bgColor: isOverdrawn ? 'bg-rose-500/10' : 'bg-brand-cyan/10',
      borderColor: isOverdrawn ? 'border-rose-500/20' : 'border-brand-cyan/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl backdrop-blur-xl relative overflow-hidden group"
        >
          <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bgColor} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
          
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center border ${card.borderColor}`}>
              <card.icon className={card.color} size={24} />
            </div>
            {i === 2 && isOverdrawn && (
              <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded-lg border border-rose-500/20">
                Action Req
              </span>
            )}
          </div>
          <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest font-black mb-1">{card.title}</p>
          <h3 className={`text-2xl md:text-3xl font-black ${card.color} tracking-tight`}>{card.value}</h3>
        </div>
      ))}
    </div>
  )
}
