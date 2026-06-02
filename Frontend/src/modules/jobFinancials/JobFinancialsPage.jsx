import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Calculator, Receipt, AlertCircle, Loader2, RefreshCcw, ArrowLeft } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import EmptyState from './components/EmptyState'
import SummaryCards from './components/SummaryCards'
import LedgerTable from './components/LedgerTable'
import AddDepositModal from './components/AddDepositModal'
import AddExpenseModal from './components/AddExpenseModal'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

export default function JobFinancialsPage() {
  const [searchParams] = useSearchParams()
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Support both query param and route param
  const rawJobId = id || searchParams.get('jobId')
  const jobId = rawJobId?.replace('JOB-', '')

  const [ledgerData, setLedgerData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  const fetchLedger = async () => {
    if (!jobId) return
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get(`/job-ledger/${jobId}/ledger`)
      setLedgerData(res.data.data)
    } catch (err) {
      console.error('Error fetching ledger:', err)
      setError(err.response?.data?.message || 'Failed to load financial data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [jobId])

  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
          <AlertCircle size={40} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">No Job Selected</h2>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          To view financials, please open this page with a valid <code className="bg-white/5 px-2 py-1 rounded text-brand-cyan">jobId</code> query parameter.
          <br /><br />
          <span className="text-xs uppercase tracking-widest font-bold opacity-50">Example:</span>
          <br />
          <span className="text-sm font-mono text-slate-500">/job-financials-test?jobId=1</span>
        </p>
      </div>
    )
  }

  if (isLoading && !ledgerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="text-brand-cyan animate-spin mb-4" size={40} />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Financials...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertCircle size={40} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Error Loading Data</h2>
        <p className="text-rose-400/60 mb-6">{error}</p>
        <button 
          onClick={fetchLedger}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all"
        >
          <RefreshCcw size={18} /> Retry
        </button>
      </div>
    )
  }

  const { summary = {}, entries = [] } = ledgerData || {}

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Navigation */}
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row gap-8 xl:items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Calculator className="text-brand-cyan flex-shrink-0" size={32} />
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Job Financials
            </h1>
          </div>
          <p className="text-slate-400 mt-2 text-sm md:text-base font-medium">
            Track real-time profitability and transactions for Job <span className="text-brand-cyan">#{rawJobId}</span>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 font-black text-sm uppercase tracking-widest hover:bg-rose-500/20 transition-all shadow-lg shadow-rose-500/5 active:scale-[0.98]"
          >
            <Minus size={18} /> Add Expense
          </button>
          <GradientButton 
            onClick={() => setShowDepositModal(true)}
            className="flex-1 xl:flex-none py-4 px-8 shadow-2xl shadow-brand-cyan/20 active:scale-[0.98]"
          >
            <Plus size={18} className="mr-2" /> Add Deposit
          </GradientButton>
        </div>
      </div>

      {/* Alert Section */}
      {summary.remainingBalance <= 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-500"
        >
          <AlertCircle size={20} />
          <p className="font-bold text-sm uppercase tracking-wider">All funds have been used</p>
        </motion.div>
      )}

      {/* Summary Section */}
      <SummaryCards 
        deposits={summary.totalDeposits || 0} 
        labor={summary.totalLabor || 0} 
        materials={summary.totalMaterials || 0} 
        balance={summary.remainingBalance || 0} 
      />

      {/* Ledger Section */}
      <GlassCard className="border-white/5 overflow-hidden" hover={false}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
              <Receipt className="text-brand-cyan" size={16} />
            </div>
            <h2 className="text-lg font-bold text-white">Financial Ledger</h2>
          </div>
          <div className="text-xs text-slate-500 uppercase font-black tracking-widest">
            {entries.length} Transactions
          </div>
        </div>

        <div className="p-0">
          {entries.length > 0 ? (
            <LedgerTable transactions={entries} />
          ) : (
            <EmptyState />
          )}
        </div>
      </GlassCard>

      {/* Modals */}
      <AnimatePresence>
        {showDepositModal && (
          <AddDepositModal 
            isOpen={showDepositModal} 
            jobId={jobId}
            onClose={() => setShowDepositModal(false)}
            onSave={fetchLedger}
          />
        )}
        {showExpenseModal && (
          <AddExpenseModal 
            isOpen={showExpenseModal} 
            jobId={jobId}
            onClose={() => setShowExpenseModal(false)}
            onSave={fetchLedger}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
