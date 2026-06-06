import React from 'react'
import { Shield, ChevronRight, Calculator, Clock, Star } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import LeadForm from './components/LeadForm'

export default function PublicLeadIntakePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-brand-cyan/30">
      
      {/* Dynamic Header Background Effect */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-brand-cyan/5 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        
        {/* Branding & Welcome */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan mb-4 animate-bounce-slow">
            <Star size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest">Premium Service Network</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            Book your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-brand-cyan to-white">service</span> now.
          </h1>
          
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed italic">
            Professional field services on demand. Submit your details below and our team will get back to you with a schedule within 24 hours.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
            <div className="flex items-center gap-2 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <Shield className="text-brand-cyan" size={16} /> Fast Approval
            </div>
            <div className="flex items-center gap-2 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <Clock className="text-brand-cyan" size={16} /> 24h Response
            </div>
            <div className="flex items-center gap-2 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <Calculator className="text-brand-cyan" size={16} /> Transparent Pricing
            </div>
          </div>
        </div>

        {/* The Intake Form */}
        <div className="space-y-4">
          <LeadForm />
        </div>

        {/* Footer info */}
        <div className="mt-20 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">
                © 2026 FieldSync Pro • Secure Lead Intake System • All Rights Reserved
            </p>
        </div>
      </div>
    </div>
  )
}
