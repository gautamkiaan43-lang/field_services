import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Trash2, Search,
  ShoppingCart, Save, History, FileText, Send,
  User, ChevronRight, RefreshCcw, Loader2, Link2,
  Building, Mail, Phone, MapPin, Calendar, Clock, ShieldCheck, Download
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { ModernInput } from '../../components/ui/ModernInput'
import { useEstimates } from '../../context/EstimatesContext'
import { useCustomers } from '../../context/CustomersContext'
import { useMaterials } from '../../context/MaterialsContext'
import { useInvoices } from '../../context/InvoicesContext'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { jsPDF } from 'jspdf'

export default function CreateEstimate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { estimates, addEstimate, updateEstimate } = useEstimates()
  const { customers } = useCustomers()
  const { searchSupplierAPI, syncAllPrices } = useMaterials()
  const { addInvoice } = useInvoices()

  const isEdit = !!id
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 1, price: 0 }])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [custQuery, setCustQuery] = useState('')
  const [sendWithInvoice, setSendWithInvoice] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [businessSettings, setBusinessSettings] = useState(null)
  const [originalEstimate, setOriginalEstimate] = useState(null)

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await api.get('/settings/business')
        if (response?.data?.success) {
          setBusinessSettings(response.data.data || {})
        }
      } catch (error) {
        console.error('Failed to fetch business settings', error)
      }
    }
    fetchBusinessSettings()
  }, [])

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length > 2) {
        setIsSearching(true)
        try {
          const results = await searchSupplierAPI(search)
          setSearchResults(results)
        } catch (error) {
          toast.error('Failed to fetch live prices')
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search, searchSupplierAPI])

  useEffect(() => {
    if (isEdit) {
      const estimate = estimates.find(e => e.id === id)
      if (estimate) {
        setOriginalEstimate(estimate)
        setProjectTitle(estimate.projectTitle || '')
        setNotes(estimate.notes || '')
        setItems(estimate.items || [])
        const customer = customers.find(c => c.id === estimate.customerId || c.name === estimate.customer)
        if (customer) setSelectedCustomer(customer)
      }
    }
  }, [id, estimates, isEdit, customers])

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const addItem = () => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }])
  const removeItem = (id) => setItems(items.filter(i => i.id !== id))

  const handleSave = (status = 'Pending') => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }
    if (!projectTitle) {
      toast.error('Please enter a project title')
      return
    }

    if (isEdit) {
      updateEstimate(id, {
        customer: selectedCustomer.name,
        customerId: selectedCustomer.id,
        projectTitle,
        notes,
        items,
        subtotal,
        tax,
        amount: `$${total.toLocaleString()}`,
        status: status === 'Draft' ? 'Draft' : 'Pending'
      })
      toast.success('Estimate updated successfully!')
    } else {
      addEstimate({
        customer: selectedCustomer.name,
        customerId: selectedCustomer.id,
        projectTitle,
        notes,
        items,
        subtotal,
        tax,
        total,
        amount: `$${total.toLocaleString()}`,
        status
      }).then((estId) => {
        if (sendWithInvoice && status === 'Pending') {
          addInvoice({
            customer: selectedCustomer.name,
            customerId: selectedCustomer.id,
            amount: `$${total.toLocaleString()}`,
            status: 'Unpaid',
            dueDate: new Date().toISOString().split('T')[0],
            items,
            subtotal,
            tax,
            totalAmount: total,
            sendWithEstimate: true,
            estimateId: estId
          })
        }
      })
      toast.success(status === 'Pending' ? 'Estimate sent to customer!' : 'Estimate saved as draft')
    }
    navigate('/dashboard/estimates')
  }

  const handleSendClick = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }
    if (!projectTitle) {
      toast.error('Please enter a project title')
      return
    }
    setShowPreview(true)
  }

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      let y = 30

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage()
          y = 25
        }
      }

      // Header Brand
      doc.setFontSize(22)
      doc.setTextColor(6, 182, 212) // brand-cyan
      doc.setFont('helvetica', 'bold')
      doc.text(businessSettings?.businessName || 'FieldSync Pro', 20, y)
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.setFont('helvetica', 'normal')
      doc.text('PROJECT PROPOSAL & ESTIMATE', 20, y + 8)
      
      doc.text(`Estimate ID: ${isEdit ? id : 'EST-NEW'}`, pageWidth - 20, y, { align: 'right' })
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, y + 8, { align: 'right' })
      
      y += 22

      // Prepared For & Company Info
      checkPageBreak(50)
      doc.setDrawColor(220)
      doc.setLineWidth(0.5)
      doc.line(20, y, pageWidth - 20, y)
      
      y += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50)
      doc.text('From:', 20, y)
      doc.text('Prepared For:', 110, y)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      let companyY = y + 6
      doc.text(businessSettings?.businessName || 'FieldSync Pro', 20, companyY)
      if (businessSettings?.businessAddress) doc.text(businessSettings.businessAddress, 20, companyY + 5)
      if (businessSettings?.businessPhone) doc.text(businessSettings.businessPhone, 20, companyY + 10)
      if (businessSettings?.businessEmail) doc.text(businessSettings.businessEmail, 20, companyY + 15)

      let customerY = y + 6
      doc.text(selectedCustomer?.name || 'Customer', 110, customerY)
      if (selectedCustomer?.address) doc.text(selectedCustomer.address, 110, customerY + 5)
      if (selectedCustomer?.phone) doc.text(selectedCustomer.phone, 110, customerY + 10)
      if (selectedCustomer?.email) doc.text(selectedCustomer.email, 110, customerY + 15)
      
      y += 30

      // Project Scope
      checkPageBreak(25)
      doc.setFillColor(245, 247, 250)
      doc.rect(20, y, pageWidth - 40, 16, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(6, 182, 212)
      doc.text('Project Scope:', 25, y + 10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50)
      doc.text(projectTitle || 'General Service', 55, y + 10)
      
      y += 26

      // Services Table Header
      checkPageBreak(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text('Service Description', 20, y)
      doc.text('Qty', 110, y)
      doc.text('Price', 135, y)
      doc.text('Total', pageWidth - 20, y, { align: 'right' })
      
      doc.line(20, y + 2, pageWidth - 20, y + 2)
      y += 10

      // Services Items
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100)
      items.forEach((item) => {
        checkPageBreak(12)
        const desc = item.desc || 'Labor / Service'
        doc.text(desc.substring(0, 50), 20, y)
        doc.text(String(item.qty || 1), 110, y)
        doc.text(`$${Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 135, y)
        doc.text(`$${Number(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
        y += 8
      })

      // Materials Section
      const materialsList = originalEstimate?.materials || [];
      if (materialsList.length > 0) {
        y += 10
        checkPageBreak(30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text('Material Name', 20, y)
        doc.text('Qty', 110, y)
        doc.text('Unit Cost', 135, y)
        doc.text('Total Cost', pageWidth - 20, y, { align: 'right' })
        
        doc.line(20, y + 2, pageWidth - 20, y + 2)
        y += 10

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100)
        materialsList.forEach((mat) => {
          checkPageBreak(12)
          const name = mat.name || mat.description || 'Material'
          const qty = Number(mat.qty || mat.quantity || 0)
          const cost = Number(mat.price || mat.unitPrice || mat.cost || mat.unitCost || 0)
          const totalCost = Number(mat.total || (qty * cost))

          doc.text(name.substring(0, 50), 20, y)
          doc.text(String(qty), 110, y)
          doc.text(`$${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 135, y)
          doc.text(`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
          y += 8
        })
      }

      // Pricing Summary & Totals
      y += 10
      checkPageBreak(50)
      const startX = pageWidth - 90
      
      doc.setDrawColor(240)
      doc.line(startX, y, pageWidth - 20, y)
      y += 6

      const addSummaryRow = (label, val) => {
        if (val > 0) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100)
          doc.text(label, startX, y)
          doc.setFont('helvetica', 'bold')
          doc.text(`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
          y += 6
        }
      }

      const servicesSubtotalVal = Number(originalEstimate?.servicesSubtotal || originalEstimate?.serviceSubtotal || subtotal || 0);
      const materialsSubtotalVal = Number(originalEstimate?.materialsSubtotal || originalEstimate?.materialSubtotal || materialsList.reduce((acc, m) => acc + (Number(m.qty || m.quantity || 0) * Number(m.price || m.unitPrice || m.cost || m.unitCost || 0)), 0));
      const discountVal = Number(originalEstimate?.discount || 0);
      const taxVal = Number(originalEstimate?.taxAmount || originalEstimate?.tax || (originalEstimate ? 0 : tax) || 0);
      const depositVal = Number(originalEstimate?.deposit || 0);
      const grandTotalVal = Number(originalEstimate?.grandTotal || originalEstimate?.total || originalEstimate?.totalAmount || (originalEstimate ? (servicesSubtotalVal + materialsSubtotalVal + taxVal - discountVal - depositVal) : total) || 0);

      addSummaryRow('Services Subtotal:', servicesSubtotalVal)
      addSummaryRow('Materials Subtotal:', materialsSubtotalVal)
      if (discountVal > 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text('Discount:', startX, y)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(22, 163, 74) // green
        doc.text(`-$${discountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
        y += 6
      }
      doc.setTextColor(100)
      addSummaryRow('Tax:', taxVal)
      if (depositVal > 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text('Deposit:', startX, y)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(217, 119, 6) // amber
        doc.text(`-$${depositVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
        y += 6
      }

      doc.setDrawColor(6, 182, 212) // brand-cyan
      doc.setLineWidth(1)
      doc.line(startX, y, pageWidth - 20, y)
      y += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text('Grand Total:', startX, y)
      doc.setTextColor(6, 182, 212)
      doc.text(`$${grandTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - 20, y, { align: 'right' })
      
      y += 15

      // Estimate Message
      if (notes || originalEstimate?.message) {
        y += 5
        checkPageBreak(30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text('Estimate Message', 20, y)
        doc.line(20, y + 2, pageWidth - 20, y + 2)
        y += 8
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100)
        const msg = notes || originalEstimate.message
        const splitMsg = doc.splitTextToSize(msg, pageWidth - 40)
        doc.text(splitMsg, 20, y)
        y += splitMsg.length * 5 + 5
      }

      // Terms & Conditions
      if (originalEstimate?.terms || originalEstimate?.termsAndConditions) {
        y += 5
        checkPageBreak(30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text('Terms & Conditions', 20, y)
        doc.line(20, y + 2, pageWidth - 20, y + 2)
        y += 8
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(120)
        const terms = originalEstimate.terms || originalEstimate.termsAndConditions
        const splitTerms = doc.splitTextToSize(terms, pageWidth - 40)
        doc.text(splitTerms, 20, y)
        y += splitTerms.length * 4.5 + 5
      }

      // Customer Acceptance
      y += 5
      checkPageBreak(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text('Customer Approval Information', 20, y)
      doc.line(20, y + 2, pageWidth - 20, y + 2)
      y += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Customer Name: ${selectedCustomer?.name || 'Customer'}`, 20, y)
      doc.text(`Estimate Number: ${isEdit ? id : 'EST-NEW'}`, 20, y + 5)
      doc.text(`Valid Until: 30 Days from Issue`, 20, y + 10)
      y += 20

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('This is an estimate only. Final prices may vary based on project scope changes.', pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      doc.save(`${isEdit ? id : 'EST_NEW'}_Proposal.pdf`)
      toast.success('Proposal PDF downloaded')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Failed to generate PDF')
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(custQuery.toLowerCase()) ||
    String(c.id).toLowerCase().includes(custQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {showPreview ? (() => {
        const materialsList = originalEstimate?.materials || [];
        const servicesSubtotalVal = Number(originalEstimate?.servicesSubtotal || originalEstimate?.serviceSubtotal || subtotal || 0);
        const materialsSubtotalVal = Number(originalEstimate?.materialsSubtotal || originalEstimate?.materialSubtotal || materialsList.reduce((acc, m) => acc + (Number(m.qty || m.quantity || 0) * Number(m.price || m.unitPrice || m.cost || m.unitCost || 0)), 0));
        const discountVal = Number(originalEstimate?.discount || 0);
        const taxVal = Number(originalEstimate?.taxAmount || originalEstimate?.tax || (originalEstimate ? 0 : tax) || 0);
        const depositVal = Number(originalEstimate?.deposit || 0);
        const grandTotalVal = Number(originalEstimate?.grandTotal || originalEstimate?.total || originalEstimate?.totalAmount || (originalEstimate ? (servicesSubtotalVal + materialsSubtotalVal + taxVal - discountVal - depositVal) : total) || 0);

        return (
          <div className="space-y-8 max-w-6xl mx-auto pb-20 print:p-0 print:m-0">
            {/* Preview Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-white/10 rounded-3xl print:hidden">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-brand-cyan" size={22} /> Estimate Preview
                </h2>
                <p className="text-slate-400 text-xs mt-1">Review the customer-facing estimate document before sending.</p>
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/5 font-medium text-sm"
                >
                  <ArrowLeft size={16} /> Back / Edit
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-brand-cyan rounded-xl transition-all border border-white/5 font-medium text-sm"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  onClick={() => handleSave('Pending')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-teal to-brand-cyan hover:from-brand-teal/95 hover:to-brand-cyan/95 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm"
                >
                  <Send size={16} /> Send Estimate
                </button>
              </div>
            </div>

            {/* Simulated True A4 PDF page container */}
            <div className="mx-auto max-w-[21cm] bg-white text-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:rounded-none">
              {/* Top Accent Bar */}
              <div className="h-3 w-full bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-purple" />
              
              <div className="p-8 md:p-14 space-y-12">
                {/* Document Header */}
                <div className="flex flex-col md:flex-row justify-between gap-8 pb-8 border-b border-slate-100">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/10 overflow-hidden">
                      {businessSettings?.logoUrl ? (
                        <img src={businessSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building size={36} className="text-white" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{businessSettings?.businessName || 'FieldSync Pro'}</h1>
                      <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-1">Professional Field Services</p>
                    </div>
                  </div>
                  <div className="md:text-right space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-brand-cyan border border-cyan-100 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      <ShieldCheck size={12} className="text-brand-cyan" /> Customer Copy
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Estimate Number</p>
                      <p className="text-xl font-bold text-slate-900 font-mono">{isEdit ? id : 'EST-NEW'}</p>
                    </div>
                  </div>
                </div>

                {/* Addresses & Meta Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From (Company Details)</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="font-bold text-slate-800">{businessSettings?.businessName || 'FieldSync Pro'}</p>
                      {businessSettings?.businessAddress && (
                        <p className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{businessSettings.businessAddress}</span>
                        </p>
                      )}
                      {businessSettings?.businessPhone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{businessSettings.businessPhone}</span>
                        </p>
                      )}
                      {businessSettings?.businessEmail && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="break-all">{businessSettings.businessEmail}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prepared For</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="font-bold text-slate-800">{selectedCustomer?.name || 'Customer'}</p>
                      {selectedCustomer?.address && (
                        <p className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{selectedCustomer.address}</span>
                        </p>
                      )}
                      {selectedCustomer?.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{selectedCustomer.phone}</span>
                        </p>
                      )}
                      {selectedCustomer?.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="break-all">{selectedCustomer.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 uppercase font-semibold">Date Issued</span>
                        <span className="text-slate-700 font-bold flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                        <span className="text-slate-400 uppercase font-semibold">Validity</span>
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Clock size={12} className="text-amber-500" />
                          30 Days
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200/60 pt-3">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Estimated Total</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">${grandTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {/* Project Title Callout */}
                <div className="p-4 bg-slate-50 border-l-4 border-brand-cyan rounded-r-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Project Scope</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{projectTitle}</p>
                </div>

                {/* Line Items Table */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Service Line Items</h3>
                  
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 font-bold w-12 text-center">#</th>
                          <th className="py-3 font-bold px-4">Item Description</th>
                          <th className="py-3 font-bold text-center w-24">Quantity</th>
                          <th className="py-3 font-bold text-right w-32">Unit Price</th>
                          <th className="py-3 font-bold text-right w-32">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 text-slate-700 text-sm">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="align-top">
                            <td className="py-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800">{item.desc || 'Labor / Service'}</p>
                            </td>
                            <td className="py-4 text-center font-medium text-slate-600">{item.qty}</td>
                            <td className="py-4 text-right font-medium text-slate-600">${Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-right font-bold text-slate-800">${Number(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked List View */}
                  <div className="block sm:hidden space-y-3">
                    {items.map((item, idx) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-[10px] bg-slate-200/60 text-slate-500 font-bold px-2 py-0.5 rounded font-mono">#{idx + 1}</span>
                          <p className="text-sm font-bold text-slate-800 flex-1 text-right">{item.desc || 'Labor / Service'}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-2">
                          <span>Qty: <span className="font-bold text-slate-700">{item.qty}</span> &bull; Rate: <span className="font-bold text-slate-700">${Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                          <span className="font-bold text-slate-800 text-sm">${Number(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Section */}
                {materialsList.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Materials</h3>
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <th className="py-3 font-bold w-12 text-center">#</th>
                            <th className="py-3 font-bold px-4">Material Name</th>
                            <th className="py-3 font-bold text-center w-24">Quantity</th>
                            <th className="py-3 font-bold text-right w-32">Unit Cost</th>
                            <th className="py-3 font-bold text-right w-32">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 text-slate-700 text-sm">
                          {materialsList.map((mat, idx) => {
                            const qty = Number(mat.qty || mat.quantity || 0);
                            const cost = Number(mat.price || mat.unitPrice || mat.cost || mat.unitCost || 0);
                            const totalCost = Number(mat.total || (qty * cost));
                            return (
                              <tr key={idx} className="align-top">
                                <td className="py-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-800">{mat.name || mat.description || 'Material'}</p>
                                </td>
                                <td className="py-4 text-center font-medium text-slate-600">{qty}</td>
                                <td className="py-4 text-right font-medium text-slate-600">${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 text-right font-bold text-slate-800">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Stacked List View */}
                    <div className="block sm:hidden space-y-3">
                      {materialsList.map((mat, idx) => {
                        const qty = Number(mat.qty || mat.quantity || 0);
                        const cost = Number(mat.price || mat.unitPrice || mat.cost || mat.unitCost || 0);
                        const totalCost = Number(mat.total || (qty * cost));
                        return (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-2">
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-[10px] bg-slate-200/60 text-slate-500 font-bold px-2 py-0.5 rounded font-mono">#{idx + 1}</span>
                              <p className="text-sm font-bold text-slate-800 flex-1 text-right">{mat.name || mat.description || 'Material'}</p>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-2">
                              <span>Qty: <span className="font-bold text-slate-700">{qty}</span> &bull; Cost: <span className="font-bold text-slate-700">${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                              <span className="font-bold text-slate-800 text-sm">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Totals Box */}
                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <div className="w-full lg:w-80 space-y-3">
                    {servicesSubtotalVal > 0 && (
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Services Subtotal</span>
                        <span className="font-semibold text-slate-800">${servicesSubtotalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {materialsSubtotalVal > 0 && (
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Materials Subtotal</span>
                        <span className="font-semibold text-slate-800">${materialsSubtotalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {discountVal > 0 && (
                      <div className="flex justify-between items-center text-sm text-emerald-600">
                        <span>Discount</span>
                        <span className="font-semibold text-emerald-600">-${discountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {taxVal > 0 && (
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Tax</span>
                        <span className="font-semibold text-slate-800">${taxVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {depositVal > 0 && (
                      <div className="flex justify-between items-center text-sm text-amber-600">
                        <span>Deposit</span>
                        <span className="font-semibold text-amber-600">-${depositVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Grand Total</span>
                      <span className="text-3xl font-black text-slate-900">${grandTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Estimate Message Section */}
                {(notes || originalEstimate?.message) && (
                  <div className="space-y-3 pt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Estimate Message</h3>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {notes || originalEstimate?.message}
                    </div>
                  </div>
                )}

                {/* Terms & Conditions Section */}
                {(originalEstimate?.terms || originalEstimate?.termsAndConditions) && (
                  <div className="space-y-3 pt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Terms & Conditions</h3>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs leading-relaxed whitespace-pre-wrap">
                      {originalEstimate.terms || originalEstimate.termsAndConditions}
                    </div>
                  </div>
                )}

                {/* Customer Acceptance Section */}
                <div className="space-y-4 pt-8 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Customer Approval Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Customer Name</span>
                      <p className="font-bold text-slate-800">{selectedCustomer?.name || 'Customer'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Estimate Number</span>
                      <p className="font-bold text-slate-800 font-mono">{isEdit ? id : 'EST-NEW'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Valid Until</span>
                      <p className="font-bold text-slate-800">30 Days from Issue</p>
                    </div>
                  </div>
                </div>

                {/* Professional Footer Info */}
                <div className="pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold leading-relaxed max-w-md mx-auto">
                  Thank you for the opportunity to estimate your project.
                  <br />
                  This estimate is valid for 30 days. Final invoice may vary based on material costs and scope adjustments.
                </div>
              </div>
            </div>
          </div>
        );
      })() : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/estimates')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Estimates
            </button>
            <div className="flex gap-3 sm:ml-auto">
              <GradientButton variant="secondary" className="flex-1 sm:flex-none" onClick={() => handleSave('Draft')}>
                <Save size={18} /> {isEdit ? 'Update Draft' : 'Save Draft'}
              </GradientButton>
              <GradientButton className="flex-1 sm:flex-none" onClick={handleSendClick}>
                <Send size={18} /> {isEdit ? 'Update & Send' : 'Send'}
              </GradientButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <GlassCard className="p-8">
                <h2 className="text-xl font-bold text-white mb-8 border-b border-white/5 pb-4">
                  {isEdit ? 'Edit Estimate' : 'Estimate Details'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Customer</label>
                    <button
                      onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-left flex items-center justify-between group hover:border-brand-cyan/50 transition-all font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <User size={18} className={selectedCustomer ? 'text-brand-cyan' : 'text-slate-500'} />
                        <span className={selectedCustomer ? 'text-white font-medium' : 'text-slate-500'}>
                          {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                        </span>
                      </div>
                      <ChevronRight size={18} className={`text-slate-600 transition-transform ${showCustomerSearch ? 'rotate-90' : ''}`} />
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
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setShowCustomerSearch(false)
                                  setCustQuery('')
                                }}
                                className="w-full p-3 text-left hover:bg-white/5 flex items-center justify-between group border-b border-white/5 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-bold text-white group-hover:text-brand-cyan">{cust.name}</p>
                                  <p className="text-[10px] text-slate-500">{cust.id}</p>
                                </div>
                                <span className="text-[10px] text-slate-600 font-mono">{cust.phone}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ModernInput
                    label="Project Title"
                    placeholder="e.g. Bathroom Renovation"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                      placeholder="Add estimate notes..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl mb-6">
                  <input
                    type="checkbox"
                    id="sendWithInvoice"
                    checked={sendWithInvoice}
                    onChange={(e) => setSendWithInvoice(e.target.checked)}
                    className="w-5 h-5 rounded border-white/10 bg-slate-900 text-brand-cyan focus:ring-brand-cyan/20 accent-brand-cyan cursor-pointer"
                  />
                  <label htmlFor="sendWithInvoice" className="text-xs font-black text-brand-cyan uppercase tracking-[0.1em] cursor-pointer select-none min-w-0">
                    Also Generate and Send Invoice Together
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end p-3 sm:p-0 rounded-2xl sm:rounded-none bg-white/[0.02] sm:bg-transparent border border-white/5 sm:border-0"
                      >
                        {/* Description — full width */}
                        <div className="flex-1">
                          <ModernInput
                            placeholder="Description"
                            value={item.desc}
                            onChange={(e) => {
                              const newItems = [...items]
                              newItems[idx].desc = e.target.value
                              setItems(newItems)
                            }}
                          />
                        </div>
                        {/* Qty + Price + Delete — side by side on mobile */}
                        <div className="flex gap-2 items-end">
                          <div className="w-20 sm:w-24">
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
                          <div className="flex-1 sm:w-32">
                            <ModernInput
                              placeholder="Price"
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[idx].price = parseFloat(e.target.value) || 0
                                setItems(newItems)
                              }}
                            />
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-3 text-slate-600 hover:text-rose-500 transition-colors shrink-0"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-stretch sm:items-end gap-3">
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
              </GlassCard>
            </div>

            <div className="space-y-8">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="text-brand-purple" size={18} /> Live Supplier Search
                  </h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live</span>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search Home Depot / Lowe's..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-brand-cyan/30 focus:outline-none text-white"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={14} className="text-brand-cyan animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                  {search.length < 3 ? (
                    <div className="text-center py-10">
                      <History size={32} className="mx-auto mb-3 text-slate-700" />
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Type to search live catalogs</p>
                    </div>
                  ) : searchResults.length === 0 && !isSearching ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-500">No results found for "{search}"</p>
                    </div>
                  ) : (
                    searchResults.map((mat, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group cursor-pointer"
                        onClick={() => {
                          const existing = items.find(it => it.desc === mat.name)
                          if (existing) {
                            setItems(items.map(it => it.desc === mat.name ? { ...it, qty: it.qty + 1 } : it))
                          } else {
                            setItems([...items, { id: Date.now(), desc: mat.name, qty: 1, price: parseFloat(mat.price) }])
                          }
                          toast.success(`Linked ${mat.name} price`)
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white group-hover:text-brand-cyan transition-colors">{mat.name}</span>
                          <Link2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">{mat.sku}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold">${mat.price}</span>
                            <span className={`px-1.5 py-0.5 rounded bg-slate-800 font-bold ${mat.stock === 'In Stock' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>{mat.stock}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-widest font-bold">Source: {mat.source}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <History className="text-brand-cyan" size={18} /> Version History
                </h3>
                <div className="space-y-4">
                  {[
                    { v: 'v1', status: 'New Estimate', date: 'Today' }
                  ].map((ver, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-cyan">{ver.v}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{ver.status}</p>
                          <p className="text-[10px] text-slate-500">{ver.date}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

