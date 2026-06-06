import React from 'react'
import { FileText } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
        <FileText size={32} className="text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No financial data available</h3>
      <p className="text-slate-400 max-w-xs mx-auto text-sm">
        Start by adding your first deposit or expense to track the financial progress of this job.
      </p>
    </div>
  )
}
