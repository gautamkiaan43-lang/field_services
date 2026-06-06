import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, CreditCard, Building2, Wallet, CheckCircle2,
  Clock, X, ArrowLeft, Printer, ShieldCheck, Calendar,
  ChevronRight, Lock, Send, Download, HelpCircle, Loader2
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { ModernInput } from '../../components/ui/ModernInput'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { jsPDF } from 'jspdf'

export default function Payments() {
  const { user } = useAuth()

  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [method, setMethod] = useState('card')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [businessSettings, setBusinessSettings] = useState({})

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data } = await api.get('/customer/invoices')
        // Insert user name dynamically if missing
        const mappedData = data.map(inv => ({ ...inv, customer: inv.customer || user?.name }))
        setInvoices(mappedData)
      } catch (error) {
        toast.error('Failed to load invoices')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInvoices()
  }, [user])

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get('/settings/business')
        if (response?.data?.success) {
          setBusinessSettings(response.data.data || {})
        }
      } catch (error) {
        setBusinessSettings({})
      }
    }
    fetchBusinessSettings()
  }, [])

  // Set the first unpaid invoice as the active one for the sidebar by default
  useEffect(() => {
    if (!activePaymentInvoice && invoices.length > 0) {
      const firstUnpaid = invoices.find(inv => inv.status === 'Unpaid')
      if (firstUnpaid) setActivePaymentInvoice(firstUnpaid)
    }
  }, [invoices, activePaymentInvoice])

  const handlePayment = async () => {
    if (!activePaymentInvoice) return

    setIsProcessing(true)
    try {
      await api.post(`/customer/invoices/${activePaymentInvoice.id}/pay`)

      // Update local state
      setInvoices(invoices.map(inv => inv.id === activePaymentInvoice.id ? { ...inv, status: 'Paid' } : inv))

      setIsProcessing(false)
      setIsSuccess(true)
      toast.success('Payment processed successfully!')

      // Reset after success
      setTimeout(() => {
        setIsSuccess(false)
        setActivePaymentInvoice(null)
      }, 3000)
    } catch (error) {
      setIsProcessing(false)
      toast.error('Failed to process payment. Please try again.')
      console.error(error)
    }
  }

  const generateStatementPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // Header
    doc.setFontSize(22)
    doc.setTextColor(0, 183, 222) // Adjusted cyan color
    doc.text('FieldSync Pro', 20, 30)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Billing Statement', 20, 38)
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 38, { align: 'right' })

    // Customer Info
    doc.setDrawColor(230)
    doc.line(20, 45, pageWidth - 20, 45)

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('Statement For:', 20, 55)
    doc.setFont('helvetica', 'normal')
    doc.text(user?.name || 'Customer', 20, 62)
    doc.text(user?.email || '', 20, 68)

    // Summary
    const unpaidTotal = invoices.filter(i => i.status === 'Unpaid').reduce((acc, i) => {
      const amt = i.totalAmount || parseFloat((i.amount || '0').toString().replace('$', '').replace(',', ''))
      return acc + (isNaN(amt) ? 0 : amt)
    }, 0)

    doc.setFillColor(245, 245, 245)
    doc.rect(pageWidth - 85, 50, 65, 25, 'F')
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('TOTAL OUTSTANDING', pageWidth - 80, 58)
    doc.setFontSize(16)
    doc.setTextColor(0, 183, 222)
    doc.text(`$${unpaidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 80, 68)

    // Table Header
    let y = 85
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Invoice ID', 20, y)
    doc.text('Date', 50, y)
    doc.text('Description', 80, y)
    doc.text('Status', 145, y)
    doc.text('Amount', pageWidth - 20, y, { align: 'right' })

    doc.setLineWidth(0.5)
    doc.line(20, y + 2, pageWidth - 20, y + 2)
    y += 10

    // Table Rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    invoices.forEach(inv => {
      if (y > 275) {
        doc.addPage()
        y = 30
      }
      doc.text((inv.id || '').toString(), 20, y)
      doc.text(new Date(inv.date || inv.createdAt).toLocaleDateString(), 50, y)
      doc.text((inv.desc || inv.items?.[0]?.desc || inv.job?.title || 'Service Work').substring(0, 30), 80, y)
      doc.text(inv.status || 'N/A', 145, y)
      const amt = inv.totalAmount || parseFloat((inv.amount || '0').toString().replace('$', '').replace(',', ''))
      doc.text(`$${(isNaN(amt) ? 0 : amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
      y += 8
    })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Thank you for your business. For any billing inquiries, please contact support.', pageWidth / 2, 285, { align: 'center' })

    doc.save(`${(user?.name || 'Customer').replace(/\s+/g, '_')}_Statement.pdf`)
    toast.success('Statement PDF generated successfully!')
  }

  const amountToPay = activePaymentInvoice
    ? (typeof activePaymentInvoice.totalAmount === 'number' ? activePaymentInvoice.totalAmount : parseFloat((activePaymentInvoice.amount || '0').toString().replace('$', '').replace(',', '')))
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-brand-cyan" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Receipt className="text-brand-cyan" size={32} /> Payments
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage your billing history and settle outstanding invoices.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trust Status</p>
              <p className="text-xs font-bold text-white uppercase italic">Verified Partner</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Invoices List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Receipt className="text-brand-cyan" size={14} /> Your Billing History
            </h2>
            <button 
              onClick={generateStatementPDF}
              className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              <Download size={12} /> Statement PDF
            </button>
          </div>

          <div className="space-y-4">
            {invoices.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Receipt size={48} className="mx-auto text-slate-800 mb-4" />
                <p className="text-slate-500">No invoices generated yet.</p>
              </GlassCard>
            ) : (
              invoices.map(inv => (
                <motion.div
                  key={inv.id}
                  whileHover={{ scale: 1.01 }}
                  className="relative overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <GlassCard className={`p-6 border-white/5 group-hover:border-brand-cyan/30 transition-all ${inv.status === 'Paid' ? 'bg-emerald-500/[0.02]' : 'bg-amber-500/[0.02]'
                    }`}>
                    {/* Background ID for extra tech feel */}
                    <span className="absolute -right-4 -bottom-4 text-7xl font-black text-white/[0.02] select-none uppercase tracking-tighter">
                      {inv.id}
                    </span>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-5 w-full sm:w-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${inv.status === 'Paid'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20'
                          }`}>
                          {inv.status === 'Paid' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-lg">{inv.desc || inv.items?.[0]?.desc || inv.job?.title || 'Service Invoice'}</h4>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-1 opacity-70">
                            #{inv.id} &bull; <Calendar className="inline-block" size={10} /> {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <p className="text-2xl font-black text-white">
                            ${typeof inv.totalAmount === 'number' ? inv.totalAmount.toLocaleString() : inv.amount}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {inv.status === 'Unpaid' && (
                            <GradientButton
                              className="py-2.5 px-6 rounded-xl hover:scale-105 transition-all text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActivePaymentInvoice(inv)
                                // Scroll to payment sidebar on mobile
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                              }}
                            >
                              <CreditCard size={14} /> Pay Now
                            </GradientButton>
                          )}
                          <button className="p-2.5 rounded-xl border border-white/5 text-slate-600 group-hover:text-white group-hover:border-white/20 transition-all">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Payment Sidebar */}
        <div className="lg:col-span-4 sticky top-8">
          <GlassCard className="border-brand-cyan/20 bg-gradient-to-b from-brand-cyan/5 to-slate-900/50 p-8 min-h-[500px] flex flex-col justify-between overflow-hidden relative">
            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                  <p className="text-slate-400 text-sm">Thank you for your payment. Your invoice status has been updated.</p>
                  <GradientButton className="mt-8 py-2 px-8" onClick={() => setIsSuccess(false)}>Done</GradientButton>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Checkout</h3>
                <ShieldCheck className="text-brand-cyan/50" size={24} />
              </div>

              <AnimatePresence mode="wait">
                {!activePaymentInvoice ? (
                  <motion.div
                    key="no-invoice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-slate-700">
                      <CreditCard size={32} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Select an unpaid invoice to make a payment.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activePaymentInvoice.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 relative">
                      <button
                        onClick={() => setActivePaymentInvoice(null)}
                        className="absolute right-3 top-3 p-1 text-slate-700 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Paying For</p>
                      <p className="text-white font-bold">#{activePaymentInvoice.id} &bull; {activePaymentInvoice.desc || activePaymentInvoice.job?.title || 'Service'}</p>
                      <div className="flex justify-between items-end mt-6">
                        <p className="text-xs text-brand-cyan font-bold italic">Secure Transaction</p>
                        <p className="text-4xl font-black text-white tracking-tighter">${amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Select Method</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: 'card', icon: CreditCard, label: 'Card' },
                          { key: 'bank', icon: Building2, label: 'Bank' },
                          { key: 'wallet', icon: Wallet, label: 'Wallet' },
                        ].map(m => (
                          <button
                            key={m.key}
                            onClick={() => setMethod(m.key)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest ${method === m.key
                              ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-lg shadow-cyan-500/10'
                              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                              }`}
                          >
                            <m.icon size={20} />
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {method === 'card' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <ModernInput label="Card Number" placeholder="0000 0000 0000 0000" icon={Lock} />
                          <div className="grid grid-cols-2 gap-4">
                            <ModernInput label="Expiry (MM/YY)" placeholder="12/26" />
                            <ModernInput label="CVC" placeholder="***" type="password" />
                          </div>
                        </motion.div>
                      )}

                      {method !== 'card' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-8 text-center text-slate-500 italic text-xs border border-dashed border-white/10 rounded-2xl"
                        >
                          {method.toUpperCase()} portal integration coming soon. Use card for instant processing.
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase justify-center mb-2">
                <Lock size={12} className="text-emerald-500" /> End-to-End Encrypted
              </div>
              <GradientButton
                className={`w-full py-4 text-base font-bold shadow-lg shadow-cyan-500/10 ${isProcessing ? 'opacity-80' : ''}`}
                onClick={handlePayment}
                disabled={!activePaymentInvoice || isProcessing}
                loading={isProcessing}
              >
                {isProcessing ? 'Verifying...' : `Secure Checkout • $${amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </GradientButton>
              <p className="text-[10px] text-slate-600 text-center font-medium">By clicking checkout, you agree to the Terms of Service.</p>
            </div>

            {/* Tech Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-purple/5 rounded-full blur-3xl -z-10" />
          </GlassCard>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            businessSettings={businessSettings}
            onClose={() => setSelectedInvoice(null)}
            isCustomerView={true}
            onPay={() => {
              setActivePaymentInvoice(selectedInvoice);
              setSelectedInvoice(null);
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function InvoiceDetailModal({ invoice, businessSettings, onClose, isCustomerView, onPay }) {
  const subtotal = invoice.subtotal || invoice.items?.reduce((acc, it) => acc + (it.qty * it.price), 0) || parseFloat((invoice.amount || '0').toString().replace('$', '').replace(',', ''))
  const tax = invoice.tax || subtotal * 0.08
  const total = invoice.totalAmount || subtotal + tax

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-2xl relative scrollbar-hide"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-black text-white uppercase tracking-tight">Invoice Detail</h3>
              <p className="text-[10px] font-mono text-slate-500 font-bold">#{invoice.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hidden sm:block">
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 md:p-14 space-y-16">
          {/* Brand Header */}
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="Business logo" className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  <Receipt size={40} className="text-white" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Issued By</p>
                <p className="text-2xl font-black text-white">{businessSettings?.businessName || 'FieldSync Pro'}</p>
                {businessSettings?.businessAddress && (
                  <p className="text-slate-400 text-sm">{businessSettings.businessAddress}</p>
                )}
                {businessSettings?.businessPhone && (
                  <p className="text-slate-400 text-sm">{businessSettings.businessPhone}</p>
                )}
                {businessSettings?.businessContactEmail && (
                  <p className="text-slate-400 text-sm">{businessSettings.businessContactEmail}</p>
                )}
              </div>
            </div>
            <div className="text-left md:text-right flex flex-col justify-end">
              <h2 className="text-8xl font-black text-white/[0.03] absolute right-16 top-40 pointer-events-none select-none">INVOICE</h2>
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 px-4 py-1.5 rounded-full">
                  <ShieldCheck size={16} className="text-brand-cyan" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Verified Transaction</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Billed To</p>
                  <p className="text-3xl font-black text-white mt-1 underline decoration-brand-cyan/30 decoration-8 underline-offset-4">{invoice.customer || 'Customer'}</p>
                  <p className="text-slate-500 text-xs mt-2 font-bold font-mono">ID: {invoice.customerId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Status</p>
              <div className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${invoice.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                {invoice.status === 'Paid' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                {invoice.status}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Issue Date</p>
              <p className="text-xs font-black text-white uppercase">{new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Due Date</p>
              <p className="text-xs font-black text-amber-500 uppercase">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Amount</p>
              <p className="text-xl font-black text-white tracking-tighter">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] pb-4 border-b border-white/5">Service Breakdown</h5>
            <div className="divide-y divide-white/5">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, i) => (
                  <div key={i} className="py-8 flex justify-between items-center group">
                    <div className="space-y-2">
                      <p className="text-lg font-black text-white group-hover:text-brand-cyan transition-colors">{item.desc}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Quantity: <span className="text-slate-300">{item.qty}</span> &bull; Rate: <span className="text-slate-300">${(item.price || item.rate || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white font-mono tracking-tighter">${(item.qty * (item.price || item.rate || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 flex justify-between items-center">
                  <p className="text-lg font-black text-white">{invoice.desc || invoice.job?.title || 'General Service'}</p>
                  <p className="text-2xl font-black text-white font-mono tracking-tighter">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 pt-10">
            <div className="w-full md:max-w-xs p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <HelpCircle className="text-slate-600" size={24} />
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                Have questions about this invoice? Contact support or reply to this billing statement.
              </p>
            </div>
            <div className="w-full md:w-80 space-y-5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
                <span className="text-lg font-bold text-white font-mono tracking-tighter">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tax (8%)</span>
                <span className="text-lg font-bold text-white font-mono tracking-tighter">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t-4 border-brand-cyan">
                <span className="text-lg font-black text-white uppercase tracking-tighter">Total Due</span>
                <span className="text-5xl font-black text-brand-cyan tracking-tighter shadow-cyan-500/10 shadow-lg">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {invoice.status === 'Unpaid' && isCustomerView && (
                <GradientButton className="w-full mt-10 py-5 text-lg font-black uppercase tracking-widest" onClick={onPay}>
                  Proceed to Payment
                </GradientButton>
              )}
            </div>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-purple" />
      </motion.div>
    </motion.div>
  )
}
