import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, ShieldCheck, FileText, ChevronRight, 
  CheckCircle2, Clock, XCircle, Search, Plus, 
  Building2, ArrowRight, User, Download
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { ModernInput } from '../../components/ui/ModernInput'
import { useFinancing } from '../../context/FinancingContext'
import { useCustomers } from '../../context/CustomersContext'
import toast from 'react-hot-toast'

export default function Financing() {
  const { applications, providers, applyForFinancing, updateApplicationStatus } = useFinancing()
  const { customers } = useCustomers()
  const [activeTab, setActiveTab] = useState('applications') // 'applications' | 'apply'
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    amount: '',
    annualIncome: '',
    ssn: '',
    provider: 'FieldSync Credit'
  })

  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [custQuery, setCustQuery] = useState('')
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)

  const handleViewAgreement = (app) => {
    setSelectedApp(app)
    setShowAgreementModal(true)
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!formData.customerId) {
      toast.error('Please select a customer')
      return
    }
    try {
      await applyForFinancing({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        annualIncome: parseFloat(formData.annualIncome) || 0,
        term: '12 Months',
        apr: '0%'
      })
      setSubmitted(true)
      toast.success('Your financing application has been submitted!')
      
      // Reset form after success screen or redirect
      setTimeout(() => {
          setSubmitted(false)
          setActiveTab('applications')
          setFormData({ customerId: '', customerName: '', amount: '', annualIncome: '', ssn: '', provider: 'FieldSync Credit' })
      }, 5000)
    } catch (error) {
       // toast handled in context
    }
  }

  const filteredCustomers = (customers || []).filter(c => 
    (c.name || '').toLowerCase().includes(custQuery.toLowerCase()) ||
    String(c.id).toLowerCase().includes(custQuery.toLowerCase())
  )

  if (submitted) {
    return (
        <div className="flex items-center justify-center min-h-[500px]">
            <GlassCard className="max-w-md w-full p-10 text-center animate-in zoom-in-95" glow>
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
                <p className="text-slate-400 mb-8">
                  Your application for <span className="text-brand-cyan font-bold">${parseFloat(formData.amount).toLocaleString()}</span> has been sent. Pre-approval decision typically takes less than 60 seconds.
                </p>
                <div className="space-y-3">
                    <GradientButton className="w-full" onClick={() => {setSubmitted(false); setActiveTab('applications')}}>
                        Return to Dashboard
                    </GradientButton>
                    <button className="text-sm text-slate-500 hover:text-white transition-colors" onClick={() => setSubmitted(false)}>
                        Submit another
                    </button>
                </div>
            </GlassCard>
        </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Financing Center</h1>
          <p className="text-slate-400 mt-1">Manage customer financing and project funding.</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 self-start">
            <button 
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'applications' ? 'bg-brand-cyan text-slate-950 shadow-lg shadow-brand-cyan/20' : 'text-slate-400 hover:text-white'}`}
            >
                Applications
            </button>
            <button 
                onClick={() => setActiveTab('apply')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'apply' ? 'bg-brand-cyan text-slate-950 shadow-lg shadow-brand-cyan/20' : 'text-slate-400 hover:text-white'}`}
            >
                New Application
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'applications' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Review', value: applications.filter(a => a.status === 'PENDING').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    { label: 'Total Approved', value: applications.filter(a => a.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Financing Providers', value: providers.length, icon: Building2, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' },
                ].map((stat, i) => (
                    <GlassCard key={i} className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Applications Table */}
            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Application</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Provider</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-white/2 transition-colors group">
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-white mb-0.5">{app.id}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">{app.date}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-cyan font-bold text-xs uppercase">
                                                {(app.customerName || 'U')[0]}
                                            </div>
                                            <p className="text-sm font-medium text-slate-300">{app.customerName}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-white">${parseFloat(app.amount).toLocaleString()}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold">{app.apr} APR / {app.term}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-slate-400">{app.provider}</span>
                                    </td>
                                    <td className="p-4">
                                        {app.status === 'PENDING' ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => updateApplicationStatus(app.id, 'APPROVED')}
                                                    className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                                                    className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleViewAgreement(app)}
                                                className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-bold tracking-tight"
                                            >
                                                View Agreement <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div 
            key="apply"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4 mb-6">Application Details</h3>
              <form onSubmit={handleApply} className="space-y-6">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Customer</label>
                  <button 
                    type="button"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-left flex items-center justify-between group hover:border-brand-cyan/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <User size={18} className={formData.customerId ? 'text-brand-cyan' : 'text-slate-500'} />
                      <span className={formData.customerId ? 'text-white font-medium' : 'text-slate-500'}>
                        {formData.customerId ? formData.customerName : 'Select Customer'}
                      </span>
                    </div>
                    <Plus size={18} className={`text-slate-600 transition-transform ${showCustomerSearch ? 'rotate-45' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCustomerSearch && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-20 top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-3 border-b border-white/5">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input 
                              autoFocus
                              type="text" 
                              placeholder="Search customers..."
                              value={custQuery}
                              onChange={(e) => setCustQuery(e.target.value)}
                              className="w-full bg-slate-800 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCustomers.map(cust => (
                            <button
                              key={cust.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, customerId: cust.id, customerName: cust.name })
                                setShowCustomerSearch(false)
                                setCustQuery('')
                              }}
                              className="w-full p-3 text-left hover:bg-white/5 flex items-center justify-between group border-b border-white/5 last:border-0"
                            >
                              <div>
                                <p className="text-sm font-bold text-white group-hover:text-brand-cyan">{cust.name}</p>
                                <p className="text-[10px] text-slate-500">{cust.id}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <ModernInput 
                        label="Project Amount" 
                        placeholder="$5,000" 
                        icon={DollarSign}
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                    <ModernInput 
                        label="Annual Income" 
                        placeholder="$65,000" 
                        icon={DollarSign}
                        value={formData.annualIncome}
                        onChange={e => setFormData({...formData, annualIncome: e.target.value})}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-6 items-end">
                    <ModernInput 
                        label="SSN (Last 4)" 
                        placeholder="0000" 
                        type="password"
                        value={formData.ssn}
                        onChange={e => setFormData({...formData, ssn: e.target.value})}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Financing Provider</label>
                        <select 
                            value={formData.provider}
                            onChange={e => setFormData({...formData, provider: e.target.value})}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:ring-1 focus:ring-brand-cyan/30 outline-none"
                        >
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <label className="flex items-start gap-3 text-xs text-slate-500 cursor-pointer">
                        <input type="checkbox" required className="mt-1 rounded bg-slate-900 border-white/10" />
                        <span>I authorize a soft credit check that won't affect my credit score to determine financing eligibility.</span>
                    </label>
                </div>

                <GradientButton className="w-full py-4 block">
                    Submit Application <ChevronRight size={18} />
                </GradientButton>
              </form>
            </GlassCard>

            <div className="space-y-6">
                <GlassCard title="Fast Pre-Approval">
                    <div className="space-y-6">
                       {[
                           { icon: FileText, title: 'Apply Digitally', desc: 'No paperwork required. Instant sync with your profile.' },
                           { icon: ShieldCheck, title: 'Instant Decision', desc: 'Pre-approval in under 60 seconds with soft credit check.' },
                           { icon: DollarSign, title: 'Direct Funding', desc: 'Funds are applied directly to your project invoice.' }
                       ].map((item, i) => (
                           <div key={i} className="flex gap-4">
                               <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan"><item.icon size={20} /></div>
                               <div>
                                   <h4 className="font-bold text-white text-sm">{item.title}</h4>
                                   <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                               </div>
                           </div>
                       ))}
                    </div>
                </GlassCard>

                <div className="p-8 rounded-[24px] bg-gradient-to-br from-indigo-700 via-brand-purple to-indigo-900 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Exclusive Offer</p>
                        <h4 className="text-2xl font-bold text-white tracking-tight">0% APR for 12 Months</h4>
                        <p className="text-sm text-indigo-100/80 mt-3 leading-relaxed">
                            Start your project today and pay $0 interest for a full year. Valid for approved applicants on projects over $2,000.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                            Limited Time <ArrowRight size={14} className="text-brand-cyan animate-pulse" />
                        </div>
                    </div>
                    {/* Decorative Background Blob */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-cyan/20 blur-[50px] rounded-full" />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agreement Modal */}
      <AnimatePresence>
        {showAgreementModal && selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowAgreementModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Financing Agreement</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{selectedApp.id} • {selectedApp.provider}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAgreementModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {/* Visual Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  {[
                    { label: 'Amount', value: `$${selectedApp.amount.toLocaleString()}`, color: 'text-white' },
                    { label: 'Term', value: selectedApp.term, color: 'text-white' },
                    { label: 'APR', value: selectedApp.apr, color: 'text-emerald-400' },
                    { label: 'Monthly', value: `$${(selectedApp.amount / parseInt(selectedApp.term)).toFixed(2)}`, color: 'text-brand-cyan' }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Agreement Text */}
                <div className="space-y-4 text-slate-400 text-xs leading-relaxed font-medium">
                  <h4 className="text-white font-bold text-sm">Terms & Conditions</h4>
                  <p>This Financing Agreement ("Agreement") is made between {selectedApp.customerName} ("Borrower") and {selectedApp.provider} ("Lender") on this day, {selectedApp.date}.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex gap-3">
                       <span className="text-brand-cyan font-bold">01.</span>
                       <p><span className="text-white font-bold">Loan Purpose:</span> The funds provided under this agreement are exclusively for the project costs associated with services provided by FieldSync CRM operators.</p>
                    </div>
                    <div className="flex gap-3">
                       <span className="text-brand-cyan font-bold">02.</span>
                       <p><span className="text-white font-bold">Repayment:</span> Borrower agrees to repay the principal amount of ${selectedApp.amount.toLocaleString()} plus any applicable interest over the term of {selectedApp.term}.</p>
                    </div>
                    <div className="flex gap-3">
                       <span className="text-brand-cyan font-bold">03.</span>
                       <p><span className="text-white font-bold">Interest Rate:</span> A fixed APR of {selectedApp.apr} will be applied throughout the duration of this loan. No prepayment penalties apply.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-200/60 flex gap-3 italic">
                    <ShieldCheck size={14} className="shrink-0" />
                    <p>This is a simulated document for demonstration purposes. In a live environment, this would be a legally binding PDF generated by the financing provider's API.</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                <button 
                  onClick={() => toast.success('Agreement PDF downloaded!')}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <Download size={16} /> Download Copy
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAgreementModal(false)}
                    className="px-6 py-2 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                  >
                    Close
                  </button>
                  <GradientButton onClick={() => {toast.success('Agreement Signed & Notarized'); setShowAgreementModal(false)}}>
                    E-Sign Agreement
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

