import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Wrench, Calendar, Eye, MapPin } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import { GlassCard } from '../../../components/ui/GlassCard'

export default function LeadsTable({ leads = [] }) {
  const navigate = useNavigate()

  if (leads.length === 0) return null

  return (
    <div className="w-full">
      {/* Mobile Card View (visible on small screens, hidden on md+) */}
      <div className="md:hidden space-y-4 px-4 pb-6">
        {leads.map((lead) => (
          <GlassCard 
            key={lead.id} 
            className="p-5 border-white/5 active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold">
                  {lead.firstName?.[0]}{lead.lastName?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{lead.firstName} {lead.lastName}</h3>
                  <LeadStatusBadge status={lead.status} />
                </div>
              </div>
              <button className="p-2 bg-white/5 rounded-lg text-slate-400">
                <Eye size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Wrench size={10} /> Service
                </p>
                <p className="text-xs text-white font-medium truncate">{lead.serviceType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} /> Preferred
                </p>
                <p className="text-xs text-white font-medium">{lead.preferredDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Phone size={10} /> Phone
                </p>
                <p className="text-xs text-slate-400 font-medium">{lead.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={10} /> City
                </p>
                <p className="text-xs text-slate-400 font-medium truncate">{lead.city}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Laptop Table View (hidden on small screens, visible on md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2 underline decoration-brand-cyan/20 underline-offset-4">
                  <User size={12} /> Full Name
                </div>
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2 underline decoration-brand-cyan/20 underline-offset-4">
                  <Phone size={12} /> Phone
                </div>
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2 underline decoration-brand-cyan/20 underline-offset-4">
                  <Mail size={12} /> Email
                </div>
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2 underline decoration-brand-cyan/20 underline-offset-4">
                  <Wrench size={12} /> Service
                </div>
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <div className="flex items-center gap-2 underline decoration-brand-cyan/20 underline-offset-4">
                  <Calendar size={12} /> Preferred Date
                </div>
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                Status
              </th>
              <th className="py-5 px-6 text-[10px] text-slate-500 uppercase font-black tracking-widest text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-brand-cyan/[0.03] transition-all cursor-pointer group border-l-2 border-transparent hover:border-brand-cyan"
                onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
              >
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold text-xs">
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 uppercase tracking-widest">
                        <MapPin size={8} /> {lead.city}, {lead.state}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-sm text-slate-300 font-medium">
                  {lead.phone}
                </td>
                <td className="py-5 px-6 text-sm text-slate-400">
                  {lead.email}
                </td>
                <td className="py-5 px-6">
                  <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-widest border border-white/5">
                    {lead.serviceType}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <p className="text-sm text-white font-bold">{lead.preferredDate}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">Slots: {lead.preferredTimeSlot}</p>
                </td>
                <td className="py-5 px-6">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="py-5 px-6 text-right">
                  <button className="p-2 hover:bg-brand-cyan/20 rounded-xl text-slate-500 hover:text-brand-cyan transition-all">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
