import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from './AuthContext'

const JobsContext = createContext()

export const JobsProvider = ({ children }) => {
  const [jobs, setJobs] = useState([])
  const { isAuthenticated } = useAuth()

  const mapBackendToFrontend = (apiJob) => {
    const statusMap = {
      'SCHEDULED': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      // Allow fallback if it already matches frontend string
      'Pending': 'Pending',
      'En Route': 'En Route',
      'On Site': 'On Site',
      'In Progress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };

    return {
      ...apiJob,
      id: `JOB-${apiJob.id}`,
      backendId: apiJob.id,
      customer: apiJob.customer?.name || apiJob.customer || 'Unknown Customer',
      title: apiJob.title,
      status: statusMap[apiJob.status] || 'Pending',
      type: 'Scheduled Service',
      technician: apiJob.technician?.name || apiJob.technician || (apiJob.status === 'COMPLETED' ? 'Internal' : 'Unassigned'),
      technicianId: apiJob.assignedTo || apiJob.technician?.id || null,
      priority: apiJob.priority || 'Medium',
      date: (apiJob.scheduledAt || apiJob.scheduledDate)
        ? new Date(apiJob.scheduledAt || apiJob.scheduledDate).toLocaleDateString()
        : 'TBD',
      address: apiJob.customer?.address || '',
      phone: apiJob.customer?.phone || '',
      email: apiJob.customer?.email || '',
      progress: apiJob.progress || 0,
      notes: apiJob.notes?.map(n => ({
        id: n.id,
        text: n.content,
        by: n.author || 'System',
        time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(n.createdAt).toLocaleDateString()
      })) || [],
      history: apiJob.history?.map(h => ({
        id: h.id,
        action: h.action,
        by: h.by,
        date: new Date(h.createdAt).toLocaleDateString(),
        time: new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: h.type
      })) || [],
      files: apiJob.files?.map(f => ({
        id: f.id,
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size
      })) || [],
      photos: apiJob.photos?.map(p => p.url) || [],
      isInvoiced: !!apiJob.invoice,
      invoiceId: apiJob.invoice?.id ? `INV-${apiJob.invoice.id}` : null,
    }
  }

  const fetchJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/jobs')
      setJobs(res.data.map(mapBackendToFrontend))
    } catch (error) {
      console.error('Failed to fetch jobs', error)
    }
  }, [isAuthenticated])

  const syncJobById = useCallback(async (id) => {
    if (!isAuthenticated) return null
    const backendId = parseInt(String(id).replace(/^JOB-/, ''), 10)
    if (!Number.isInteger(backendId)) return null
    try {
      const res = await api.get(`/jobs/${backendId}`)
      const mapped = mapBackendToFrontend(res.data)
      setJobs((prev) => {
        const has = prev.some((j) => j.id === mapped.id)
        if (!has) return [...prev, mapped]
        return prev.map((j) => (j.id === mapped.id ? mapped : j))
      })
      return mapped
    } catch (error) {
      console.error('Failed to sync job', error)
      return null
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const createJob = async (jobData) => {
    try {
      const payload = {
        title: jobData.title,
        customerId: parseInt(jobData.customerId),
        description: jobData.description || jobData.type,
        scheduledAt: jobData.date ? new Date(jobData.date).toISOString() : undefined,
        items: Array.isArray(jobData.items) ? jobData.items : []
      }
      const res = await api.post('/jobs', payload)
      await fetchJobs()
      toast.success('Job created successfully')
      return `JOB-${res.data.id}`
    } catch (error) {
      toast.error('Failed to create job')
    }
  }

  const deleteJob = async (id) => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      await api.delete(`/jobs/${backendId}`)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Job deleted')
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const updateJob = async (id, updates) => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      const payload = { ...updates }
      if (updates.status) {
        payload.status = updates.status === 'Pending' ? 'SCHEDULED' :
          updates.status === 'In Progress' ? 'IN_PROGRESS' :
            updates.status === 'Completed' ? 'COMPLETED' :
              updates.status === 'Cancelled' ? 'CANCELLED' : undefined
      }
      const res = await api.put(`/jobs/${backendId}`, payload)
      const mapped = mapBackendToFrontend(res.data)
      setJobs(prev => prev.map(j => j.id === id ? mapped : j))
    } catch (error) {
      console.error('Failed to update job', error)
    }
  }

  const updateStatus = async (id, newStatus, by = 'System') => {
    const progressMap = { 'Pending': 0, 'En Route': 20, 'On Site': 40, 'In Progress': 60, 'Completed': 100, 'Cancelled': 0 }
    const newProgress = progressMap[newStatus] ?? 0

    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      const backendStatus = newStatus === 'Completed' ? 'COMPLETED' : 
                          newStatus === 'Cancelled' ? 'CANCELLED' : 
                          newStatus === 'Pending' ? 'SCHEDULED' : 'IN_PROGRESS'
      
      const res = await api.put(`/jobs/${backendId}/status`, { status: backendStatus })
      const mapped = mapBackendToFrontend(res.data)
      setJobs(prev => prev.map(j => j.id === id ? mapped : j))
    } catch (err) {
      toast.error('Failed to sync status with server')
    }
  }

  const cancelJob = (id, by = 'System') => {
    updateStatus(id, 'Cancelled', by)
  }

  const convertToInvoice = async (id, by = 'System') => {
    try {
      await updateStatus(id, 'Completed', by);
      toast.success('Job marked Completed. Invoice automatically generated.');
    } catch (err) {
      toast.error('Failed to mark job complete');
    }
  }

  const updateProgress = async (id, progress, by = 'System') => {
    const statusMap = progress >= 100 ? 'Completed' : progress >= 60 ? 'In Progress' : progress >= 40 ? 'On Site' : progress >= 20 ? 'En Route' : 'Pending'
    
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      const res = await api.put(`/jobs/${backendId}`, { progress })
      const mapped = mapBackendToFrontend(res.data)
      setJobs(prev => prev.map(j => j.id === id ? mapped : j))
      // Trigger status update
      updateStatus(id, statusMap, by)
    } catch (error) {
      console.error('Failed to update progress', error)
    }
  }

  const assignTechnician = async (id, techId, by = 'System') => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      const employeeId = techId === 'Unassigned' || !techId ? null : parseInt(techId)
      const res = await api.put(`/jobs/${backendId}/assign`, { employeeId })
      const mapped = mapBackendToFrontend(res.data)
      setJobs(prev => prev.map(j => j.id === id ? mapped : j))
      toast.success(!employeeId ? 'Technician unassigned' : `Assigned to ${mapped.technician}`)
    } catch (e) {
      toast.error('Failed to assign technician')
    }
  }

  const addNote = async (id, noteText, author) => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      await api.post(`/jobs/${backendId}/notes`, { content: noteText })
      fetchJobs() // Refresh to get the latest history and notes
    } catch (error) {
      toast.error('Failed to add note')
    }
  }

  const addPhoto = async (id, url) => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      await api.post(`/jobs/${backendId}/photos`, { url })
      fetchJobs()
    } catch (error) {
      toast.error('Failed to add photo')
    }
  }

  const removePhoto = (id, photoIndex) => {
    const job = jobs.find(j => j.id === id)
    const url = job?.photos?.[photoIndex]
    if (!url) return

    const backendId = parseInt(id.replace('JOB-', ''))
    api.delete(`/jobs/${backendId}/photos`, { data: { url } })
      .then(() => fetchJobs())
      .catch(() => toast.error('Failed to delete photo'))
  }

  const addFile = async (id, file) => {
    try {
      const backendId = parseInt(id.replace('JOB-', ''))
      await api.post(`/jobs/${backendId}/files`, {
        name: file.name,
        url: file.url,
        type: file.type,
        size: file.size
      })
      fetchJobs()
      toast.success('File attached successfully')
    } catch (error) {
      toast.error('Failed to attach file')
    }
  }

  return (
    <JobsContext.Provider value={{ jobs, createJob, deleteJob, updateJob, updateStatus, cancelJob, convertToInvoice, updateProgress, assignTechnician, addNote, addPhoto, removePhoto, addFile, fetchJobs, syncJobById }}>
      {children}
    </JobsContext.Provider>
  )
}

export const useJobs = () => useContext(JobsContext)
