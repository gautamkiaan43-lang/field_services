import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const GradientButton = ({ 
  children, 
  className, 
  variant = 'primary', 
  loading, 
  isLoading, 
  disabled,
  ...props 
}) => {
  const isPending = loading || isLoading

  const variants = {
    primary: "bg-gradient-to-r from-brand-teal to-brand-cyan text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]",
    secondary: "bg-white/10 text-white backdrop-blur-sm border border-white/10 hover:bg-white/20",
    outline: "bg-transparent border border-brand-cyan/50 text-brand-cyan hover:bg-brand-cyan/10",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
  }

  return (
    <motion.button
      whileHover={!isPending && !disabled ? { scale: 1.02, boxShadow: "0 0 20px rgba(34,211,238,0.4)" } : {}}
      whileTap={!isPending && !disabled ? { scale: 0.98 } : {}}
      disabled={isPending || disabled}
      className={cn(
        "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  )
}
