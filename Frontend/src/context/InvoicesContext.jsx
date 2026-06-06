import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from './AuthContext'

const InvoicesContext = createContext()

export const InvoicesProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([])
  const { isAuthenticated } = useAuth()

  const mapBackendToFrontend = (apiInv) => {
    const statusMap = {
      'UNPAID': 'Unpaid',
      'PARTIAL': 'Partial',
      'PAID': 'Paid',
      'OVERDUE': 'Overdue',
      'Unpaid': 'Unpaid',
      'Partial': 'Partial',
      'Paid': 'Paid',
      'Overdue': 'Overdue'
    }

    return {
      ...apiInv,
      id: `INV-${String(apiInv.id).padStart(3, '0')}`,
      backendId: apiInv.id,
      customer: apiInv.customer?.name || apiInv.customer || 'Unknown Customer',
      amount: `$${parseFloat(apiInv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: statusMap[apiInv.status] || 'Unpaid',
      date: new Date(apiInv.createdAt).toISOString().split('T')[0],
      dueDate: new Date(apiInv.createdAt).toISOString().split('T')[0], // Backend doesn't have dueDate yet
      items: (apiInv.items || []).map(item => ({
        id: item.id,
        desc: item.desc || item.description,
        qty: Number(item.qty ?? item.quantity ?? 0),
        price: Number(item.price ?? item.unitPrice ?? 0),
        total: Number(item.total || 0)
      })),
      subtotal: Number(apiInv.subtotal || 0),
      tax: Number(apiInv.tax || 0),
      totalAmount: parseFloat(apiInv.total || 0),
      notes: apiInv.notes || ''
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices')
      setInvoices(res.data.map(mapBackendToFrontend))
    } catch (error) {
      console.error('Failed to fetch invoices', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchInvoices()
  }, [isAuthenticated])

  const addInvoice = async (invoiceData) => {
    try {
      let numericTotal = 0;
      if (typeof invoiceData.amount === 'string') {
        numericTotal = parseFloat(invoiceData.amount.replace('$', '').replace(/,/g, ''));
      } else if (invoiceData.totalAmount) {
        numericTotal = invoiceData.totalAmount;
      } else if (invoiceData.amount) {
        numericTotal = invoiceData.amount;
      }

      const payload = {
        customerId: parseInt(invoiceData.customerId),
        total: numericTotal,
        notes: invoiceData.notes || null,
        estimateId: invoiceData.estimateId,
        sendWithEstimate: invoiceData.sendWithEstimate,
        jobId: invoiceData.jobId
      }

      const res = await api.post('/invoices', payload)
      const mapped = mapBackendToFrontend(res.data)
      setInvoices(prev => [mapped, ...prev])
      await fetchInvoices()
      
      if (invoiceData.sendWithEstimate) {
        toast.success('Invoice and Estimate sent together successfully!')
      } else {
        toast.success('Invoice created successfully!')
      }
      return mapped.id
    } catch (error) {
      toast.error('Failed to create invoice')
    }
  }

  const updateInvoiceStatus = async (id, status) => {
    try {
      const backendId = parseInt(id.replace('INV-', ''))
      const backendStatus = status === 'Paid' ? 'PAID' : status === 'Partial' ? 'PARTIAL' : status === 'Overdue' ? 'OVERDUE' : 'UNPAID'
      await api.put(`/invoices/${backendId}`, { status: backendStatus })
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv))
      await fetchInvoices()
      toast.success(`Invoice marked as ${status}`)
    } catch (error) {
      toast.error('Failed to update invoice status')
    }
  }

  const deleteInvoice = async (id) => {
    try {
      const backendId = parseInt(id.replace('INV-', ''))
      await api.delete(`/invoices/${backendId}`)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      await fetchInvoices()
      toast.success('Invoice deleted')
    } catch (error) {
      toast.error('Failed to delete invoice')
    }
  }

  return (
    <InvoicesContext.Provider value={{ invoices, addInvoice, updateInvoiceStatus, deleteInvoice, fetchInvoices }}>
      {children}
    </InvoicesContext.Provider>
  )
}

export const useInvoices = () => useContext(InvoicesContext)
