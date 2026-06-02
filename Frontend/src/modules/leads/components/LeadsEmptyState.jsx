import React from 'react'
import { ClipboardList } from 'lucide-react'

export default function LeadsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 text-slate-500">
        <ClipboardList size={40} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Leads Found</h3>
      <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
        When potential customers submit an inquiry through the public intake form, they will appear here for review and scheduling.
      </p>
    </div>
  )
}
