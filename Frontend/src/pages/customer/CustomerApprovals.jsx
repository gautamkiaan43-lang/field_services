import React, { useState, useEffect } from 'react'
import { 
  Shield, FileText, CheckCircle2, XCircle, 
  X, ChevronRight, Calendar, User, Wrench,
  Package, ClipboardList, AlertCircle, Loader2
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { SignaturePadField, isSignatureImageDataUrl } from '../../components/ui/SignaturePadField'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// ── Full Detail Modal ──────────────────────────────────────────────
function EstimateDetailModal({ estimate, businessSettings, signatureInput, onSignatureChange, onClose, onApprove, onReject }) {
  const subtotal = estimate.items?.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0) || 0
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/90 backdrop-blur-md border-b border-white/5 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {estimate.projectTitle || estimate.title || 'General Service Estimate'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">#{estimate.id}</span>
                {(estimate.status?.toUpperCase() === 'PENDING' || estimate.status?.toUpperCase() === 'REVISED' || estimate.status === 'Pending' || estimate.status === 'Revised') && (
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    ● Awaiting Your Approval
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="w-14 h-14 rounded-xl bg-brand-cyan/10 overflow-hidden flex items-center justify-center shrink-0">
              {businessSettings?.logoUrl ? (
                <img src={businessSettings.logoUrl} alt="Business logo" className="w-full h-full object-cover" />
              ) : (
                <FileText size={20} className="text-brand-cyan" />
              )}
            </div>
            <div className="text-sm space-y-1">
              <p className="text-white font-bold">{businessSettings?.businessName || 'FieldSync Pro'}</p>
              {businessSettings?.businessAddress && <p className="text-slate-400">{businessSettings.businessAddress}</p>}
              {businessSettings?.businessPhone && <p className="text-slate-400">{businessSettings.businessPhone}</p>}
              {businessSettings?.businessContactEmail && <p className="text-slate-400">{businessSettings.businessContactEmail}</p>}
            </div>
          </div>

          {/* Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
              <Calendar size={16} className="text-brand-cyan shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Date Issued</p>
                <p className="text-sm font-bold text-white mt-0.5">{new Date(estimate.date || estimate.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
              <User size={16} className="text-brand-purple shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Customer</p>
                <p className="text-sm font-bold text-white mt-0.5">{estimate.customer || 'Customer'}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
              <Wrench size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Service Type</p>
                <p className="text-sm font-bold text-white mt-0.5">{estimate.serviceType || 'General Service'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {estimate.description && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={14} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Scope of Work</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{estimate.description}</p>
            </div>
          )}

          {estimate.notes && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={14} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Notes</p>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{estimate.notes}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={14} className="text-slate-500" />
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Line Items</p>
            </div>
            <div className="rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left p-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Description</th>
                    <th className="text-center p-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Qty</th>
                    <th className="text-right p-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Unit Price</th>
                    <th className="text-right p-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.items && estimate.items.length > 0 ? (
                    estimate.items.map((item, i) => (
                      <tr key={i} className="border-t border-white/5 group hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm text-slate-200">{item.desc}</td>
                        <td className="p-4 text-sm text-slate-400 text-center">{item.qty}</td>
                        <td className="p-4 text-sm text-slate-400 text-right">${Number(item.price || 0).toFixed(2)}</td>
                        <td className="p-4 text-sm font-bold text-white text-right">${(item.qty * (item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 text-sm">
                        Detailed line items to be provided by the service provider.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 ml-auto w-full sm:w-80 space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal > 0 ? subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : estimate.amount}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Tax (8%)</span>
                <span>${subtotal > 0 ? tax.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="font-black text-white">Total</span>
                <span className="font-black text-2xl text-white">
                  ${(Number(estimate.totalAmount) || Number(estimate.amount) || total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms Note */}
          {(estimate.status?.toUpperCase() === 'PENDING' || estimate.status?.toUpperCase() === 'REVISED' || estimate.status === 'Pending' || estimate.status === 'Revised') && (
            <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                By approving this estimate, you agree to the proposed scope of work and pricing. A technician will be scheduled once approval is confirmed. You can reject this estimate if you'd like to negotiate or decline.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {(estimate.status?.toUpperCase() === 'PENDING' || estimate.status?.toUpperCase() === 'REVISED' || estimate.status === 'Pending' || estimate.status === 'Revised') && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">Customer Signature</label>
                <SignaturePadField
                  value={signatureInput}
                  onChange={onSignatureChange}
                  height={150}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={async () => {
                  const success = await onApprove(estimate.id, signatureInput)
                  if (success) onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all font-black border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 size={20} /> APPROVE ESTIMATE
              </button>
              <button 
                onClick={async () => {
                  const success = await onReject(estimate.id, signatureInput)
                  if (success) onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all font-black border border-rose-500/20 shadow-lg shadow-rose-500/10"
              >
                <XCircle size={20} /> REJECT ESTIMATE
              </button>
            </div>
            </div>
          )}

          {estimate.customerSignature && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Saved Signature</p>
              {isSignatureImageDataUrl(estimate.customerSignature) ? (
                <img
                  src={estimate.customerSignature}
                  alt="Customer signature"
                  className="max-h-28 rounded-lg border border-white/10 bg-white p-1"
                />
              ) : (
                <p className="text-sm text-slate-300">{estimate.customerSignature}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Approvals Page ────────────────────────────────────────────
export default function CustomerApprovals() {
  const { user } = useAuth()
  const [estimates, setEstimates] = useState([])
  const [businessSettings, setBusinessSettings] = useState({})
  const [selectedEstimate, setSelectedEstimate] = useState(null)
  const [signatureInput, setSignatureInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const mapEstimates = (data = []) => {
    return data.map(est => ({
      ...est,
      customer: est.customer?.name || est.customer || user?.name || 'Valued Customer',
      projectTitle: est.projectTitle || est.notes || 'General Service Estimate',
      totalAmount: Number(est.totalAmount || 0),
      items: (est.items || []).map(it => ({
        ...it,
        desc: it.description || it.description,
        qty: Number(it.quantity || 0),
        price: Number(it.unitPrice || 0)
      })),
      date: est.createdAt ? new Date(est.createdAt).toLocaleDateString() : est.date
    }))
  }

  const refreshEstimates = async () => {
    const { data } = await api.get('/customer/estimates')
    setEstimates(mapEstimates(data))
  }

  useEffect(() => {
    if (!user || String(user.role || '').toLowerCase() !== 'customer') {
      setIsLoading(false)
      return
    }

    const fetchEstimates = async () => {
      try {
        await refreshEstimates()
        const settingsResponse = await api.get('/settings/business').catch(() => ({ data: { data: {} } }))
        setBusinessSettings(settingsResponse?.data?.data || {})
      } catch (error) {
        toast.error('Failed to load estimates')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEstimates()
  }, [user])

  // Show all Pending estimates for customer to review
  const pendingEstimates = estimates.filter(e => 
    e.status?.toUpperCase() === 'PENDING' || e.status?.toUpperCase() === 'REVISED' || e.status === 'Pending' || e.status === 'Revised'
  )
  const reviewedEstimates = estimates.filter(e => 
    e.status?.toUpperCase() === 'APPROVED' || e.status?.toUpperCase() === 'REJECTED' || e.status === 'Approved' || e.status === 'Rejected'
  )

  const handleApprove = async (id, signature) => {
    try {
      const { data } = await api.patch(`/customer/estimates/${id}/status`, {
        status: 'Approved',
        customerSignature: signature
      })
      setEstimates(estimates.map(e => e.id === id ? { ...e, ...data, status: 'Approved' } : e))
      await refreshEstimates()
      setSignatureInput('')
      toast.success('Estimate Approved! Our team will contact you soon.', {
        icon: '🎉',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      })
      return true
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to approve estimate'
      if (msg.toLowerCase().includes('already been submitted')) {
        await refreshEstimates()
      }
      toast.error(msg)
      return false
    }
  }

  const handleReject = async (id, signature) => {
    try {
      const { data } = await api.patch(`/customer/estimates/${id}/status`, {
        status: 'Rejected',
        customerSignature: signature
      })
      setEstimates(estimates.map(e => e.id === id ? { ...e, ...data, status: 'Rejected' } : e))
      await refreshEstimates()
      setSignatureInput('')
      toast.success('Estimate Rejected.')
      return true
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to reject estimate'
      if (msg.toLowerCase().includes('already been submitted')) {
        await refreshEstimates()
      }
      toast.error(msg)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
         <Loader2 className="animate-spin text-brand-cyan" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pending Approvals</h1>
        <p className="text-slate-400 mt-1">Review the full estimate details and approve or reject below.</p>
      </div>

      {/* Pending Estimates */}
      {pendingEstimates.length > 0 ? (
        <div className="space-y-4">
          {pendingEstimates.map(est => (
            <GlassCard key={est.id} className="border-amber-500/20 bg-amber-500/5 group hover:border-amber-400/40 transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {est.projectTitle || est.title || 'General Service Estimate'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono italic">#{est.id}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">• {new Date(est.date || est.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-0 md:ml-16 bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      {est.items?.length > 0
                        ? `Proposed for ${est.items.length} item${est.items.length > 1 ? 's' : ''} including "${est.items[0].desc}"...`
                        : 'Click "View Full Details" to review the complete scope of work and pricing.'}
                    </p>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex flex-col items-end justify-between gap-4 min-w-[240px]">
                  <div className="text-right flex-1 flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Total Estimated Cost</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                      ${(Number(est.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* View Details CTA */}
                  <button
                    onClick={() => setSelectedEstimate(est)}
                    className="w-full flex justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-brand-cyan/10 hover:border-brand-cyan/30 hover:text-brand-cyan transition-all text-sm font-bold"
                  >
                    View Full Details <ChevronRight size={14} />
                  </button>

                  {/* Quick Approve/Reject */}
                  <div className="flex gap-3 w-full mt-2">
                    <button 
                      onClick={() => {
                        setSelectedEstimate(est)
                        setSignatureInput('')
                        toast('Add your signature in estimate details to approve')
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all text-sm font-black border border-emerald-500/20"
                    >
                      <CheckCircle2 size={16} /> APPROVE
                    </button>
                    <button 
                      onClick={() => handleReject(est.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all text-sm font-black border border-rose-500/20"
                    >
                      <XCircle size={16} /> REJECT
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="border-dashed border-white/10">
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Shield size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">All Caught Up!</h3>
            <p className="text-slate-500 text-sm max-w-xs">You don't have any pending estimates requiring your approval at this time.</p>
          </div>
        </GlassCard>
      )}

      {/* Previously Reviewed */}
      {reviewedEstimates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-500" />
            Previously Reviewed
          </h2>
          <div className="space-y-3">
            {reviewedEstimates.map(est => (
              <div key={est.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onClick={() => setSelectedEstimate(est)}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${est.status === 'Approved' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white">{est.projectTitle || est.title || 'General Service Estimate'}</p>
                    <p className="text-[10px] text-slate-600">#{est.id} · {new Date(est.date || est.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-400">
                     ${typeof est.totalAmount === 'number' ? est.totalAmount.toLocaleString() : est.amount}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${est.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {est.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedEstimate && (
        <EstimateDetailModal
          estimate={selectedEstimate}
          businessSettings={businessSettings}
          signatureInput={signatureInput}
          onSignatureChange={setSignatureInput}
          onClose={() => {
            setSelectedEstimate(null)
            setSignatureInput('')
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
