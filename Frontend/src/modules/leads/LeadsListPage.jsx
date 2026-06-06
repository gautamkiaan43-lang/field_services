import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, ClipboardList, TrendingUp, Download } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import LeadsTable from './components/LeadsTable'
import LeadsEmptyState from './components/LeadsEmptyState'
import CreateLeadModal from './components/CreateLeadModal'
import api from '../../services/api'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function LeadsListPage() {
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const location = useLocation()

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/leads')
      setLeads(res.data.data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get('/leads/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Leads exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export leads')
    }
  }

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads()
  }, [location.pathname])

  useEffect(() => {
    const onFocus = () => fetchLeads()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  })

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="text-brand-cyan" size={32} />
            Leads
          </h1>
          <p className="text-slate-400 mt-2">Monitor and schedule incoming service inquiries.</p>
        </div>

        <div className="flex gap-3">
          <GlassCard className="px-4 py-2 flex items-center gap-3 bg-white/5 border-white/5" hover={false}>
            <TrendingUp size={16} className="text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Total Inquiries</p>
              <p className="text-lg font-bold text-white mt-1 leading-none">{leads.length}</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Filters & Actions Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-cyan transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all font-medium"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none min-w-[160px]">
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full appearance-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 cursor-pointer"
             >
                <option value="ALL" style={{ backgroundColor: '#1e293b', color: 'white' }}>All Statuses</option>
                <option value="NEW" style={{ backgroundColor: '#1e293b', color: 'white' }}>New</option>
                <option value="REVIEWING" style={{ backgroundColor: '#1e293b', color: 'white' }}>Reviewing</option>
                <option value="CONVERTED" style={{ backgroundColor: '#1e293b', color: 'white' }}>Converted</option>
                <option value="REJECTED" style={{ backgroundColor: '#1e293b', color: 'white' }}>Rejected</option>
             </select>
             <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
          </div>

          <button 
            onClick={handleDownload}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
            title="Download Leads CSV"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <GradientButton 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-4 rounded-2xl"
          >
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">Create Lead</span>
            <span className="sm:hidden">Create</span>
          </GradientButton>
        </div>
      </div>

      {/* Main Content Area */}
      <GlassCard className="border-white/5 overflow-hidden" hover={false}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Leads...</p>
          </div>
        ) : filteredLeads.length > 0 ? (
          <LeadsTable leads={filteredLeads} />
        ) : (
          <LeadsEmptyState />
        )}
      </GlassCard>

      {/* Modals */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchLeads}
      />
    </div>
  )
}
