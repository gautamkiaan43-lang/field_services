import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, ShieldCheck, CreditCard, Wallet, HelpCircle, X } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'

export default function PaymentAllocation({ onClose = () => {} }) {
  const [amount, setAmount] = useState(1500)
  const [laborPercent, setLaborPercent] = useState(40)
  
  const labor = (amount * laborPercent) / 100
  const material = amount - labor

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full mx-auto"
    >
      <GlassCard className="p-8 border-brand-cyan/20" glow>
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Allocate Payment</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500"><X size={20} /></button>
         </div>

         <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 mb-8 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total Received</p>
            <p className="text-3xl font-bold text-white tracking-tighter">${amount.toLocaleString()}</p>
         </div>

         <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Labor Costs</span>
                        <span className="text-[10px] text-slate-500">{laborPercent}% allocation</span>
                    </div>
                    <span className="text-lg font-bold text-brand-cyan">${labor.toFixed(2)}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={laborPercent}
                    onChange={(e) => setLaborPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Material Costs</span>
                        <span className="text-[10px] text-slate-500">{100 - laborPercent}% allocation</span>
                    </div>
                    <span className="text-lg font-bold text-brand-purple">${material.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-lg overflow-hidden">
                    <div className="h-full bg-brand-purple" style={{ width: `${100 - laborPercent}%` }} />
                </div>
            </div>
         </div>

         <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-bold">
                    <CreditCard size={14} /> Card
                </button>
                <button className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-bold">
                    <Wallet size={14} /> Bank
                </button>
                <button className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-brand-purple/20 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white transition-all text-[10px] font-bold">
                    <ShieldCheck size={14} /> Finance
                </button>
            </div>
            <GradientButton className="w-full py-4 shadow-cyan-500/20">
                Confirm Allocation
            </GradientButton>
         </div>
      </GlassCard>
    </motion.div>
  )
}
