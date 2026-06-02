import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const GlassCard = ({ children, className, hover = true, glow = false, ...props }) => {
  const outerClassName = cn(
    "glass-dark rounded-[20px] p-6 relative overflow-hidden",
    glow && "after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[0_0_15px_rgba(34,211,238,0.1)]",
    className
  )
  return (
    <div
      {...props}
      className={cn(
        outerClassName,
        "transition-all duration-300 ease-out",
        hover && "hover:-translate-y-1 hover:scale-[1.01] cursor-pointer"
      )}
    >
      <div className={cn(
        "relative z-10",
        outerClassName.includes('flex-col') && "flex flex-col h-full",
        outerClassName.includes('h-full') && "h-full"
      )}>
        {children}
      </div>
      
      {/* Subtle background glow decorator */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
    </div>
  )
}
