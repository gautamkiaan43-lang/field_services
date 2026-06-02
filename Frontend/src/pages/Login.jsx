import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, ChevronRight, Shield, Briefcase, Wrench, Users, Activity, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const roles = [
  { id: 'admin', label: 'ADMIN', icon: Shield, desc: 'Full system access', email: 'admin@fieldsync.com' },
  { id: 'manager', label: 'MANAGER', icon: Briefcase, desc: 'Dispatch & approvals', email: 'manager@fieldsync.com' },
  { id: 'technician', label: 'TECHNICIAN', icon: Wrench, desc: 'Jobs & timesheets', email: 'tech@fieldsync.com' },
  { id: 'customer', label: 'CUSTOMER', icon: Users, desc: 'Approvals & payments', email: 'customer@fieldsync.com' },
]

const features = [
  { icon: Activity, title: 'DASHBOARD ANALYTICS', desc: 'REAL-TIME PERFORMANCE METRICS.' },
  { icon: CheckCircle, title: 'INSTANT VERIFICATION', desc: 'AUTO-SCAN NRC & IDENTITY.' },
  { icon: ShieldCheck, title: 'FRAUD PREVENTION', desc: 'SHARED CROSS-NETWORK BLACKLIST.' },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('admin')
  const [email, setEmail] = useState('admin@fieldsync.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    const roleObj = roles.find(r => r.id === selectedRole)
    if (roleObj) {
      setEmail(roleObj.email)
      setPassword('password123')
    }
  }, [selectedRole])

  React.useEffect(() => {
    document.body.classList.add('scrollbar-hide')
    return () => document.body.classList.remove('scrollbar-hide')
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <div className="min-h-screen flex bg-[#050a10] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden scrollbar-hide">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-[1300px] mx-auto flex flex-col lg:flex-row relative z-10 min-h-screen">
        
        {/* Left Side - Info Panel */}
        <div className="lg:w-1/2 p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-wider">FIELDSYNC PRO</h2>
                <p className="text-[9px] text-blue-400 font-bold tracking-[0.2em]">FIELD SERVICE PORTAL</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] mt-2 ml-1">INFRASTRUCTURE V2.4</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-8">
              GLOBAL<br />
              <span className="text-blue-500">SERVICE</span><br />
              NETWORK.
            </h1>

            <div className="space-y-4 max-w-sm">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group">
                  <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <feature.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold tracking-wider text-slate-300">{feature.title}</h4>
                    <p className="text-[9px] text-slate-500 tracking-wide mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-5 sm:p-8 lg:p-12 bg-[#0a0f18]/80 backdrop-blur-sm flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/[0.05]">
          <div className="max-w-sm w-full mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl font-black tracking-tight mb-1">LOGIN</h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-8">ENTER YOUR CREDENTIALS TO LOGIN</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-slate-400 ml-1">IDENTIFIER</label>
                  <div className="relative group">
                    <input 
                      type="text"
                      placeholder="PHONE OR EMAIL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0d141f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-bold tracking-[0.2em] text-slate-400">SECURE KEY</label>
                    <button type="button" className="text-[9px] font-bold tracking-[0.2em] text-blue-500 hover:text-blue-400">RESET</button>
                  </div>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0d141f] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-[0.98] text-sm"
                  >
                    LOGIN <ChevronRight size={18} />
                  </button>
                </div>
              </form>

              <div className="mt-12">
                <p className="text-[9px] font-bold tracking-[0.2em] text-slate-600 text-center mb-6">QUICK ACCESS NODES</p>
                <div className="grid grid-cols-2 sm:flex sm:justify-between gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id)
                        login({ email: role.email, password: 'password123' })
                      }}
                      className={`flex flex-col items-center gap-2 group transition-all p-2 rounded-xl border border-transparent ${selectedRole === role.id ? 'opacity-100 bg-blue-500/5' : 'opacity-30 hover:opacity-100 hover:bg-white/5'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${selectedRole === role.id ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/10 group-hover:border-white/20'}`}>
                        <role.icon size={20} />
                      </div>
                      <span className="text-[8px] font-bold tracking-widest text-center">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
