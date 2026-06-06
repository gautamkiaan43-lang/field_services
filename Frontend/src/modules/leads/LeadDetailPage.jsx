import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, FileText, Loader2, UserPlus, Trash2, CheckCircle2, Plus, RefreshCcw } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import LeadDetailCard from './components/LeadDetailCard'
import LeadStatusBadge from './components/LeadStatusBadge'
import ScheduleProposalModal from './components/ScheduleProposalModal'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useMaterials } from '../../context/MaterialsContext'
import { useJobs } from '../../context/JobsContext'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 1, price: 0 }])
  const { syncAllPrices } = useMaterials()
  const { fetchJobs } = useJobs()

  const fetchLead = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/leads/${id}`)
      setLead(res.data.data)
      const pricingItems = res.data.data?.pricingData?.items || []
      if (pricingItems.length > 0) {
        setItems(pricingItems.map((item, idx) => ({
          id: Date.now() + idx,
          desc: item.description || '',
          qty: Number(item.quantity || 1),
          price: Number(item.unitPrice || 0)
        })))
      }
    } catch (error) {
      console.error('Error fetching lead details:', error)
      toast.error('Lead not found')
      navigate('/dashboard/leads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
  }, [id])

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.patch(`/leads/${id}/status`, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
      fetchLead()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleConvert = async () => {
    try {
      setIsLoading(true)
      const res = await api.post(`/leads/${id}/convert`, { items })
      const newJob = res.data.data
      await fetchJobs()
      toast.success('Lead converted to Job successfully!')
      // Redirect to the new job
      navigate(`/dashboard/jobs/JOB-${newJob.id}`)
    } catch (error) {
      console.error('Error converting lead:', error)
      toast.error('Failed to convert lead to job')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="text-brand-cyan animate-spin mb-4" size={32} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Loading Lead Profile...</p>
      </div>
    )
  }

  if (!lead) return null

  const subtotal = items.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: '', qty: 1, price: 0 }])
  const removeItem = (itemId) => setItems(prev => prev.filter(item => item.id !== itemId))

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={() => navigate('/dashboard/leads')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="font-bold text-sm tracking-widest uppercase">Back to Leads</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-black text-xl md:text-2xl border border-brand-cyan/20 ring-4 ring-brand-cyan/5 flex-shrink-0">
            {lead.firstName?.[0]}{lead.lastName?.[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {lead.firstName} {lead.lastName}
              </h1>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-[10px] md:text-xs font-medium uppercase tracking-widest">
              ID: <span className="text-brand-cyan opacity-80">{id}</span> • Registered on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
          >
            <Calendar size={18} />
            Propose Schedule
          </button>
          
          <GradientButton 
            className="flex-1 xl:flex-none px-6 py-4 rounded-2xl"
            onClick={handleConvert}
            disabled={lead.status === 'CONVERTED'}
          >
            <UserPlus size={18} className="mr-2" />
            {lead.status === 'CONVERTED' ? 'Already Converted' : 'Convert to Job'}
          </GradientButton>
        </div>
      </div>

      {/* Main Content Areas */}
      <LeadDetailCard lead={lead} />

      <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Line Items</h3>
            <div className="flex items-center gap-4">
              <button onClick={syncAllPrices} className="text-emerald-400 text-xs flex items-center gap-1.5 hover:underline whitespace-nowrap">
                <RefreshCcw size={14} /> Sync All Prices
              </button>
              <button onClick={addItem} className="text-brand-cyan text-sm flex items-center gap-1 hover:underline whitespace-nowrap">
                <Plus size={14} /> Add Labor / Custom Item
              </button>
            </div>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end p-3 sm:p-0 rounded-2xl sm:rounded-none bg-white/[0.02] sm:bg-transparent border border-white/5 sm:border-0"
            >
              <div className="flex-1">
                <input
                  placeholder="Description"
                  value={item.desc}
                  onChange={(e) => {
                    const newItems = [...items]
                    newItems[idx].desc = e.target.value
                    setItems(newItems)
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="w-20 sm:w-24">
                  <input
                    placeholder="Qty"
                    type="number"
                    value={item.qty}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[idx].qty = Number(e.target.value)
                      setItems(newItems)
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                  />
                </div>
                <div className="flex-1 sm:w-32">
                  <input
                    placeholder="Price"
                    type="number"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[idx].price = parseFloat(e.target.value) || 0
                      setItems(newItems)
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                  />
                </div>
                <button onClick={() => removeItem(item.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors shrink-0">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-stretch sm:items-end gap-3">
            <div className="flex justify-between sm:w-64 text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-white font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between sm:w-64 text-sm">
              <span className="text-slate-500">Tax (8%)</span>
              <span className="text-white font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between sm:w-64 text-xl border-t border-white/5 pt-3">
              <span className="text-white font-bold underline decoration-brand-cyan decoration-2 underline-offset-8">Total</span>
              <span className="text-brand-cyan font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Internal Management Section */}
      <GlassCard className="p-6 md:p-8 border-white/5" hover={false}>
        <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
          <FileText className="text-brand-cyan" size={20} />
          Lead Management
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Update Lead Status</p>
            <div className="flex flex-wrap gap-2">
              {['REVIEWING', 'REJECTED'].map(status => (
                <button 
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                    lead.status === status 
                      ? 'bg-brand-cyan/20 border-brand-cyan/30 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
             <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col sm:flex-row items-start gap-4">
               <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                 <CheckCircle2 size={24} />
               </div>
               <div>
                  <p className="text-sm md:text-base font-bold text-white mb-2 tracking-tight">Internal Workflow Guide</p>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl italic font-medium">
                    Review lead details and preferred schedule. Suggest an available tech slot using the "Propose Schedule" button above. Once the customer approves, click "Convert to Job" to automatically generate a formal service job and create their customer profile.
                  </p>
               </div>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* Proposal Modal */}
      <ScheduleProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        lead={lead}
        onProposed={fetchLead}
      />
    </div>
  )
}
