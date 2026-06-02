import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from './AuthContext'
import { useJobs } from './JobsContext'

const EstimatesContext = createContext()

export const EstimatesProvider = ({ children }) => {
  const [estimates, setEstimates] = useState([])
  const { isAuthenticated } = useAuth()
  const jobsCtx = useJobs()

  const mapBackendToFrontend = (apiEst) => {
    const statusMap = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REVISED': 'Revised',
      'REJECTED': 'Rejected'
    };

    return {
      ...apiEst,
      id: `EST-${String(apiEst.id).padStart(3, '0')}`,
      backendId: apiEst.id,
      customer: apiEst.customer?.name || apiEst.customer || 'Unknown Customer',
      status: statusMap[apiEst.status] || apiEst.status || 'Pending',
      projectTitle: apiEst.projectTitle || apiEst.notes || `${apiEst.customer?.name || ''} Project`,
      amount: `$${parseFloat(apiEst.totalAmount || 0).toLocaleString()}`,
      total: parseFloat(apiEst.totalAmount || 0),
      notes: apiEst.notes || '',
      items: (apiEst.items || []).map(item => ({
        id: item.id,
        desc: item.description,
        qty: item.quantity,
        price: parseFloat(item.unitPrice),
        total: parseFloat(item.total)
      })),
      date: new Date(apiEst.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      history: []
    }
  }

  const fetchEstimates = async () => {
    try {
      const res = await api.get('/estimates')
      setEstimates(res.data.map(mapBackendToFrontend))
    } catch (error) {
      console.error('Failed to fetch estimates', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchEstimates()
  }, [isAuthenticated])

  const addEstimate = async (estimateData) => {
    try {
      const payload = {
        customerId: parseInt(estimateData.customerId),
        projectTitle: estimateData.projectTitle,
        notes: estimateData.notes || null,
        items: estimateData.items, // Service maps fields
        total: estimateData.total || parseFloat(String(estimateData.amount || '0').replace('$', '').replace(/,/g, '')),
        status: estimateData.status === 'Draft' ? 'PENDING' : 'PENDING' // status logic
      }
      const res = await api.post('/estimates', payload)
      const mapped = mapBackendToFrontend(res.data)
      setEstimates(prev => [mapped, ...prev])
      await fetchEstimates()
      return mapped.id
    } catch (error) {
      console.error('Add Error:', error)
      toast.error('Failed to create estimate')
    }
  }

  const updateEstimateStatus = async (id, status) => {
    try {
      const backendId = parseInt(id.replace('EST-', ''))
      if (status === 'Approved') {
        await api.post(`/estimates/${backendId}/approve`)
        if (typeof jobsCtx?.fetchJobs === 'function') {
          await jobsCtx.fetchJobs()
        }
      } else {
        const payload = {
          status: status === 'Rejected' ? 'REJECTED' : 'PENDING'
        }
        await api.patch(`/estimates/${backendId}`, payload)
      }
      await fetchEstimates()
      toast.success(`Estimate ${status.toLowerCase()}`)
    } catch (err) {
      toast.error('Failed to update estimate status')
    }
  }

  const updateEstimate = async (id, updatedData) => {
    try {
      const backendId = parseInt(id.replace('EST-', ''))
      const payload = {
        projectTitle: updatedData.projectTitle,
        notes: updatedData.notes ?? null,
        items: updatedData.items,
        total: typeof updatedData.total === 'string' ? parseFloat(updatedData.total.replace('$', '').replace(',', '')) : updatedData.total,
        status: updatedData.status
      }
      const res = await api.patch(`/estimates/${backendId}`, payload)
      const mapped = mapBackendToFrontend(res.data)
      setEstimates(prev => prev.map(est => est.id === id ? mapped : est))
      await fetchEstimates()
      toast.success('Estimate updated successfully')
    } catch (error) {
      console.error('Update Error:', error)
      toast.error('Failed to update estimate')
    }
  }

  const deleteEstimate = async (id) => {
    try {
      const backendId = parseInt(id.replace('EST-', ''))
      await api.delete(`/estimates/${backendId}`)
      setEstimates(prev => prev.filter(est => est.id !== id))
      await fetchEstimates()
    } catch (error) {
      toast.error('Failed to delete estimate')
    }
  }

  const convertToJob = async (estimateId) => {
    // Backend handles auto-creation. We just tell it to approve.
    try {
      await updateEstimateStatus(estimateId, 'Approved');
      if (typeof jobsCtx?.fetchJobs === 'function') {
        await jobsCtx.fetchJobs()
      }
      toast.success('Estimate approved. Job generated in backend.');
    } catch (err) {
      toast.error('Failed to convert estimate');
    }
  }

  return (
    <EstimatesContext.Provider value={{ estimates, addEstimate, updateEstimate, updateEstimateStatus, deleteEstimate, convertToJob, fetchEstimates }}>
      {children}
    </EstimatesContext.Provider>
  )
}

export const useEstimates = () => useContext(EstimatesContext)
