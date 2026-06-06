import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { useJobs } from './JobsContext'
import { useInvoices } from './InvoicesContext'

const CustomersContext = createContext()

export const CustomersProvider = ({ children }) => {
  const [customers, setCustomers] = useState([])
  const { isAuthenticated } = useAuth()
  const jobsCtx = useJobs()
  const invoicesCtx = useInvoices()

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers()
    }
  }, [isAuthenticated])

  const addCustomer = async (customer) => {
    try {
      const res = await api.post('/customers', customer)
      setCustomers(prev => [res.data, ...prev])
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs()
      if (typeof invoicesCtx?.fetchInvoices === 'function') await invoicesCtx.fetchInvoices()
      return res.data
    } catch (error) {
      toast.error('Failed to add customer')
      throw error
    }
  }

  const updateCustomer = async (id, updates) => {
    try {
      const res = await api.put(`/customers/${id}`, updates)
      setCustomers(prev => prev.map(c => c.id === id ? res.data : c))
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs()
      if (typeof invoicesCtx?.fetchInvoices === 'function') await invoicesCtx.fetchInvoices()
      return res.data
    } catch (error) {
      toast.error('Failed to update customer')
      throw error
    }
  }

  const deleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`)
      setCustomers(prev => prev.filter(c => c.id !== id))
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs()
      if (typeof invoicesCtx?.fetchInvoices === 'function') await invoicesCtx.fetchInvoices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer')
      throw error
    }
  }

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, fetchCustomers }}>
      {children}
    </CustomersContext.Provider>
  )
}

export const useCustomers = () => useContext(CustomersContext)
