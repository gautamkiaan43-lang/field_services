import React from 'react'
import { Calendar, DollarSign, Tag, CreditCard, Hash, FileText, Plus, Minus } from 'lucide-react'

export default function LedgerTable({ transactions = [] }) {
  if (transactions.length === 0) return null

  return (
    <div className="w-full">
      {/* Mobile Transaction View (visible on small screens) */}
      <div className="md:hidden divide-y divide-white/5">
        {transactions.map((t, i) => (
          <div key={i} className="p-5 flex flex-col gap-4 active:bg-white/5 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {t.type === 'DEPOSIT' ? <Plus size={20} /> : <Minus size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.category}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.date}</p>
                </div>
              </div>
              <p className={`text-lg font-black ${t.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.type === 'DEPOSIT' ? '+' : '-'}${t.amount.toFixed(2)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Method</p>
                <p className="text-xs text-slate-300 font-bold flex items-center gap-1">
                  <CreditCard size={10} /> {t.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Reference</p>
                <p className="text-xs text-slate-500 font-mono truncate">{t.reference || 'N/A'}</p>
              </div>
            </div>
            
            {t.note && (
              <div className="flex gap-2 items-start">
                <FileText size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400 italic leading-relaxed">{t.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Laptop Table View (hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <Calendar size={12} /> Date
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                Type
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <Tag size={12} /> Category
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <DollarSign size={12} /> Amount
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <CreditCard size={12} /> Method
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <Hash size={12} /> Reference
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest text-right">
                <div className="flex items-center justify-end gap-2">
                  <FileText size={12} /> Notes
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((t, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-6 text-sm text-slate-300">{t.date}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-300 font-medium">{t.category}</td>
                <td className="py-4 px-6 text-sm font-bold text-white tracking-tight">${t.amount.toFixed(2)}</td>
                <td className="py-4 px-6 text-sm text-slate-300">{t.paymentMethod}</td>
                <td className="py-4 px-6 text-sm text-slate-500 font-mono italic">{t.reference || '---'}</td>
                <td className="py-4 px-6 text-sm text-slate-400 text-right truncate max-w-[200px]" title={t.note}>{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
