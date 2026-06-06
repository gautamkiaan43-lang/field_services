import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const ModernInput = ({ label, icon: Icon, className, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-400 ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          className={cn(
            "w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan/50 text-white placeholder:text-slate-600",
            Icon && "pl-11",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
}
