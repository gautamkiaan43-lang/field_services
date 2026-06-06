import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Search, Filter, Plus, ChevronRight, FileText,
  Download, X, ShieldCheck, Printer, Calendar, User,
  ArrowLeft, CreditCard, Send, CheckCircle2, Clock
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { ModernInput } from '../../components/ui/ModernInput'
import { useInvoices } from '../../context/InvoicesContext'
import { useCustomers } from '../../context/CustomersContext'
import { useEstimates } from '../../context/EstimatesContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

export default function InvoicesList() {
  const { invoices, addInvoice, updateInvoiceStatus, deleteInvoice } = useInvoices()
  const { customers } = useCustomers()
  const { estimates } = useEstimates()
  const [searchParams] = useSearchParams()
  const queryEstimateId = searchParams.get('estimateId')

  const [showForm, setShowForm] = useState(!!queryEstimateId)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedEstimate, setSelectedEstimate] = useState(queryEstimateId || '')
  const [sendWithEstimate, setSendWithEstimate] = useState(!!queryEstimateId)
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 1, price: 0 }])
  const [notes, setNotes] = useState('')
  const [businessSettings, setBusinessSettings] = useState({})

  const subtotal = items.reduce((acc, item) => acc + (item.qty * (Number(item.price) || 0)), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Watch for estimate selection to auto-fill items
  useEffect(() => {
    if (selectedEstimate) {
      const estimate = estimates.find(e => e.id === selectedEstimate)
      if (estimate) {
        if (estimate.items) {
          setItems(estimate.items.map((it, idx) => ({
            id: Date.now() + idx,
            desc: it.desc || it.description,
            qty: it.qty || it.quantity,
            price: it.price || it.unitPrice || 0
          })))
        }
        // Auto-select customer if linked to estimate
        const customer = customers.find(c => c.id === estimate.customerId || c.name === estimate.customer)
        if (customer) setSelectedCustomer(customer)
      }
    }
  }, [selectedEstimate, estimates, customers])

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get('/settings/business')
        if (response?.data?.success) {
          setBusinessSettings(response.data.data || {})
        }
      } catch (error) {
        // Keep invoice flow resilient even if branding settings are missing.
        setBusinessSettings({})
      }
    }
    fetchBusinessSettings()
  }, [])

  const handleCreateInvoice = () => {
    if (!selectedCustomer) return toast.error('Please select a customer')
    if (items.some(it => !it.desc)) return toast.error('Please provide descriptions for all items')

    addInvoice({
      customer: selectedCustomer.name,
      customerId: selectedCustomer.id,
      amount: `$${total.toLocaleString()}`,
      status: 'Unpaid',
      dueDate,
      items,
      subtotal,
      tax,
      totalAmount: total,
      sendWithEstimate,
      estimateId: selectedEstimate,
      notes
    })

    setShowForm(false)
    resetForm()
  }

  const resetForm = () => {
    setItems([{ id: Date.now(), desc: '', qty: 1, price: 0 }])
    setSelectedCustomer(null)
    setSelectedEstimate('')
    setDueDate('')
    setNotes('')
  }

  const statusIcons = {
    'Paid': { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    'Unpaid': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Overdue': { icon: X, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Receipt className="text-brand-cyan" size={32} /> Invoices
          </h1>
          <p className="text-slate-400 mt-1">Manage billing, payments, and linking estimates.</p>
        </div>
        <GradientButton onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Create New Invoice</>}
        </GradientButton>
      </div>

      {/* Improved Create Invoice Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="border-brand-cyan/20 p-8">
            <h2 className="text-xl font-bold text-white mb-8 border-b border-white/5 pb-4">New Invoice</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Customer</label>
                <select
                  value={selectedCustomer ? selectedCustomer.id : ''}
                  onChange={(e) => setSelectedCustomer(customers.find(c => c.id === Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Link Estimate (Optional)</label>
                <select
                  value={selectedEstimate}
                  onChange={(e) => setSelectedEstimate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 appearance-none [&>option]:bg-slate-900"
                >
                  <option value="">None</option>
                  {estimates.map(e => <option key={e.id} value={e.id}>{e.id} — {e.customer}</option>)}
                </select>
                {selectedEstimate && (
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 mt-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="sendWithEstimate"
                      checked={sendWithEstimate}
                      onChange={(e) => setSendWithEstimate(e.target.checked)}
                      className="w-5 h-5 rounded border-white/10 bg-slate-900 text-brand-cyan focus:ring-brand-cyan/20 accent-brand-cyan cursor-pointer"
                    />
                    <label htmlFor="sendWithEstimate" className="text-xs font-black text-brand-cyan uppercase tracking-[0.1em] cursor-pointer select-none min-w-0">
                      Send Estimate + Invoice Together
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <ModernInput
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Line Items</h3>
                <button
                  onClick={() => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }])}
                  className="text-brand-cyan text-sm flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex-1 w-full">
                    <ModernInput
                      placeholder="Service Description"
                      value={item.desc}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].desc = e.target.value
                        setItems(newItems)
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
                    <div className="sm:w-20">
                      <ModernInput
                        placeholder="Qty"
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[idx].qty = Number(e.target.value)
                          setItems(newItems)
                        }}
                      />
                    </div>
                    <div className="sm:w-32">
                      <ModernInput
                        placeholder="Price"
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[idx].price = Number(e.target.value)
                          setItems(newItems)
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setItems(items.filter(it => it.id !== item.id))}
                    className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                placeholder="Add invoice notes..."
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-6 border-t border-white/5">
              <div className="text-slate-500 text-xs italic bg-white/5 p-4 rounded-xl border border-white/5">
                Note: Invoices are sent via email and SMS automatically once created.
              </div>
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax (8%)</span>
                  <span className="text-white font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold border-t border-white/5 pt-3">
                  <span className="text-white">Total</span>
                  <span className="text-brand-cyan">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <GradientButton onClick={handleCreateInvoice} className="w-full mt-4">
                  <Send size={18} /> Send Invoice
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Main List Section */}
      <GlassCard className="p-0 overflow-hidden border-white/5">
        <div className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search invoices by ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={16} className="text-slate-500" />
            <div className="flex gap-2">
              {['All', 'Paid', 'Unpaid', 'Overdue'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f
                      ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30'
                      : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                <th className="px-6 py-5">Invoice ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Due Date</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <Receipt size={48} className="mx-auto text-slate-800 mb-4" />
                    <p className="text-slate-500 font-medium">No invoices found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, index) => (
                  <motion.tr
                    key={inv.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className="cursor-pointer group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 font-mono font-bold text-sm text-white group-hover:text-brand-cyan transition-colors">
                        <Receipt size={16} className="text-brand-cyan/60" />
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{inv.customer}</span>
                        <span className="text-[10px] text-slate-500">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white group-hover:scale-105 transition-transform origin-left">{inv.amount}</td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusIcons[inv.status].bg} ${statusIcons[inv.status].color}`}>
                        {React.createElement(statusIcons[inv.status].icon, { size: 10 })}
                        {inv.status}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400 font-medium">{inv.dueDate || inv.date}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-brand-cyan/50 hover:bg-brand-cyan/5">
                          <Download size={16} />
                        </button>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-brand-cyan mr-2" />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            businessSettings={businessSettings}
            onClose={() => setSelectedInvoice(null)}
            onUpdateStatus={(id, status) => {
              updateInvoiceStatus(id, status);
              setSelectedInvoice(prev => ({ ...prev, status }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function InvoiceDetailModal({ invoice, businessSettings, onClose, onUpdateStatus }) {
  const subtotal = invoice.items?.reduce((acc, it) => acc + (it.qty * it.price), 0) || parseFloat(invoice.amount.replace('$', '').replace(',', ''))
  const tax = invoice.tax || subtotal * 0.08
  const total = invoice.totalAmount || subtotal + tax

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl relative scrollbar-hide"
      >
        {/* Modal Header Actions */}
        <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-bold text-white font-mono">{invoice.id} Details</h3>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={invoice.status}
              onChange={(e) => onUpdateStatus(invoice.id, e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 outline-none appearance-none [&>option]:bg-slate-900"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body - Visual Design */}
        <div className="p-8 md:p-12 space-y-12 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.1)_0%,_transparent_50%)]">
          {/* Top Info */}
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-6">
                {businessSettings?.logoUrl ? (
                  <img src={businessSettings.logoUrl} alt="Business logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Receipt size={32} className="text-white" />
                )}
              </div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Billed From</h4>
              <div className="space-y-1 text-sm">
                <p className="text-white font-bold">{businessSettings?.businessName || 'FieldSync Management'}</p>
                {businessSettings?.businessAddress && <p className="text-slate-500">{businessSettings.businessAddress}</p>}
                {businessSettings?.businessPhone && <p className="text-slate-500">{businessSettings.businessPhone}</p>}
                {businessSettings?.businessContactEmail && <p className="text-slate-500">{businessSettings.businessContactEmail}</p>}
              </div>
            </div>
            <div className="text-right space-y-4">
              <h2 className="text-6xl font-black text-white/5 absolute right-12 top-24 pointer-events-none">INVOICE</h2>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.2em]">Billed To</p>
                <p className="text-2xl font-bold text-white underline decoration-brand-cyan decoration-4 underline-offset-8 decoration-white/10">{invoice.customer}</p>
                <p className="text-slate-500 mt-2 font-mono text-xs">{invoice.customerId}</p>
                {['James Wilson', 'Sarah Miller'].includes(invoice.customer) && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-brand-purple uppercase tracking-widest bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full">
                      <ShieldCheck size={12} /> Financing Active
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Notes</h5>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice Date</p>
              <p className="text-sm font-bold text-white flex items-center gap-2"><Calendar size={14} className="text-brand-cyan" /> {invoice.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</p>
              <p className="text-sm font-bold text-white flex items-center gap-2 text-amber-400"><Clock size={14} /> {invoice.dueDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Method</p>
              <p className="text-sm font-bold text-white flex items-center gap-2"><CreditCard size={14} className="text-emerald-400" /> Card / Online</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
              <p className={`text-sm font-bold flex items-center gap-2 ${invoice.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {invoice.status === 'Paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {invoice.status}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] pb-2 border-b border-white/5">Breakdown</h5>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                  <th className="text-left p-4">Description</th>
                  <th className="text-center p-4">Qty</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-t border-white/5 group hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-slate-200">{item.desc}</td>
                    <td className="p-4 text-sm text-slate-400 text-center">{item.qty}</td>
                    <td className="p-4 text-sm text-slate-400 text-right">${Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                    <td className="p-4 text-sm font-bold text-white text-right">${(item.qty * (item.price || item.unitPrice || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col items-end pt-8">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-white font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax (8%)</span>
                <span className="text-white font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-4xl font-black border-t-4 border-brand-cyan pt-6 mt-2">
                <span className="text-white uppercase text-sm self-center tracking-widest opacity-20">Amount Due</span>
                <span className="text-brand-cyan">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-10 flex flex-col items-center gap-4 text-center">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center p-2 opacity-30 select-none pointer-events-none rotate-12">
                  <div className="border border-emerald-500/40 rounded-full w-full h-full flex items-center justify-center text-[8px] font-bold text-emerald-500 uppercase tracking-widest text-center">FieldSync Verified</div>
                </div>
                <p className="text-[10px] text-slate-500 max-w-[200px]">Thank you for your business. Please make payment by the due date to avoid late fees.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

