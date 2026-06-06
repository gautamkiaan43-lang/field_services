import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Mail, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { GradientButton } from '../components/ui/GradientButton'
import { ModernInput } from '../components/ui/ModernInput'
import { toast } from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  
  const handleRegister = (e) => {
    e.preventDefault()
    // Mock registration logic
    toast.success('Registration successful! Please login to continue.')
    setTimeout(() => {
      navigate('/login')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl"
      >
        <button 
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
        </button>

        <GlassCard className="p-10 border-white/10" glow>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400">Join FieldSync Pro and streamline your service business.</p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput label="First Name" placeholder="John" icon={User} required />
                <ModernInput label="Last Name" placeholder="Smith" icon={User} required />
            </div>
            
            <ModernInput label="Email Address" placeholder="john@example.com" icon={Mail} required type="email" />
            <ModernInput label="Password" type="password" placeholder="••••••••" icon={Lock} required />
            
            <div className="pt-4">
                <GradientButton type="submit" className="w-full py-4 text-lg">
                  Register Now <ChevronRight size={20} />
                </GradientButton>
            </div>

            <p className="text-center text-sm text-slate-500 pt-4">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-brand-cyan hover:underline font-bold"
              >
                Sign In
              </button>
            </p>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}
