import React from 'react'
import { User, Phone, Mail, MapPin, Wrench, FileText, Calendar, Clock, ClipboardList } from 'lucide-react'
import { GlassCard } from '../../../components/ui/GlassCard'

export default function LeadDetailCard({ lead }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Customer Info */}
      <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
        <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
          <User className="text-brand-cyan" size={20} />
          Customer Information
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan flex-shrink-0">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Full Name</p>
              <p className="text-base md:text-lg font-bold text-white tracking-tight truncate">{lead.firstName} {lead.lastName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Phone className="text-slate-500 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Phone</p>
                <p className="text-sm font-bold text-white tracking-tight truncate">{lead.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
              <Mail className="text-slate-500 flex-shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Email</p>
                <p className="text-sm font-bold text-white tracking-tight truncate" title={lead.email}>{lead.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Service Address</p>
              <p className="text-sm font-bold text-white leading-relaxed">
                {lead.address}<br />
                {lead.city}, {lead.state} {lead.zipCode}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Service Request & Schedule */}
      <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
        <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
          <ClipboardList className="text-brand-cyan" size={20} />
          Service Request Details
        </h3>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan flex-shrink-0">
              <Wrench size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest leading-none mb-1">Service Type</p>
              <p className="text-base md:text-lg font-bold text-white tracking-tight">{lead.serviceType}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-h-[100px]">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-3">Job Description</p>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {lead.jobDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-slate-500" size={14} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Preferred Date</p>
              </div>
              <p className="text-sm font-bold text-white tracking-tight">{lead.preferredDate}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-slate-500" size={14} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Preferred Slot</p>
              </div>
              <p className="text-sm font-bold text-white tracking-tight">{lead.preferredTimeSlot}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
