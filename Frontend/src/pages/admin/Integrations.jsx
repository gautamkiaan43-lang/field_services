import React, { useState } from 'react'
import { Package, CreditCard, Plus, ExternalLink, CheckCircle2, X } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useEffect } from 'react'

export default function Integrations() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/integrations/suppliers')
      setSuppliers(res.data)
    } catch (error) {
      toast.error('Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }

  const [gateways, setGateways] = useState([
    { id: 1, name: 'Stripe', status: 'Active', icon: '💳', desc: 'Credit card processing' },
    { id: 2, name: 'PayPal', status: 'Active', icon: '🅿️', desc: 'Online payments' },
    { id: 3, name: 'Square', status: 'Inactive', icon: '⬜', desc: 'POS & card reader' },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showConfigureModal, setShowConfigureModal] = useState(null)
  const [configValue, setConfigValue] = useState('')
  const [newIntegration, setNewIntegration] = useState({ name: '', desc: '', type: 'supplier', icon: '🔌' })

  useEffect(() => {
    if (showConfigureModal) {
      const config = showConfigureModal.config || {};
      setConfigValue(config?.apiKey || '');
    } else {
      setConfigValue('');
    }
  }, [showConfigureModal])

  const handleAddIntegration = async (e) => {
    e.preventDefault()
    if (newIntegration.type === 'supplier') {
      try {
        const res = await api.post('/integrations', {
          ...newIntegration,
          category: 'SUPPLIER',
          status: 'Not Connected'
        })
        setSuppliers([...suppliers, res.data])
        toast.success(`${newIntegration.name} added to suppliers`)
      } catch (error) {
        toast.error('Failed to add supplier')
      }
    } else {
      const id = Date.now()
      setGateways([...gateways, { ...newIntegration, id, status: 'Inactive' }])
      toast.success(`${newIntegration.name} added to gateways`)
    }
    setShowAddModal(false)
    setNewIntegration({ name: '', desc: '', type: 'supplier', icon: '🔌' })
  }

  const toggleStatus = async (id, type) => {
    if (type === 'supplier') {
      const supplier = suppliers.find(s => s.id === id)
      const isConnected = supplier.status === 'Connected'
      const newIsConnected = !isConnected
      const newStatus = newIsConnected ? 'Connected' : 'Not Connected'
      
      try {
        await api.patch(`/integrations/${id}`, { isConnected: newIsConnected })
        setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: newStatus } : s))
        if (showConfigureModal?.id === id) {
          setShowConfigureModal(prev => ({ ...prev, status: newStatus }))
        }
        toast.success(`${supplier.name} is now ${newStatus}`)
      } catch (error) {
        toast.error('Failed to update status')
      }
    } else {
      setGateways(gateways.map(g => {
        if (g.id === id) {
          const newStatus = g.status === 'Active' ? 'Inactive' : 'Active'
          toast.success(`${g.name} is now ${newStatus}`)
          return { ...g, status: newStatus }
        }
        return g
      }))
    }
    setShowConfigureModal(null)
  }

  const handleSaveConfig = async () => {
    if (!showConfigureModal) return
    try {
      const existingConfig = showConfigureModal.config || {};

      const res = await api.patch(`/integrations/${showConfigureModal.id}`, {
        config: { ...existingConfig, apiKey: configValue }
      })
      setSuppliers(suppliers.map(s => s.id === showConfigureModal.id ? res.data : s))
      toast.success('Configuration saved')
      setShowConfigureModal(null)
    } catch (error) {
      toast.error('Failed to save configuration')
    }
  }

  const deleteIntegration = async (id, type) => {
    if (type === 'supplier') {
      try {
        await api.delete(`/integrations/${id}`)
        setSuppliers(suppliers.filter(s => s.id !== id))
        toast.success('Supplier removed')
      } catch (error) {
        toast.error('Failed to remove supplier')
      }
    } else {
      setGateways(gateways.filter(g => g.id !== id))
      toast.success('Gateway removed')
    }
    setShowConfigureModal(null)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Integrations</h1>
          <p className="text-slate-400 mt-1">Manage supplier and payment gateway connections.</p>
        </div>
        <GradientButton onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Integration
        </GradientButton>
      </div>

      {/* Categories */}
      <div className="space-y-12">
        {/* Suppliers */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Package className="text-brand-cyan" size={20} /> Material Suppliers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div>
              </div>
            ) : (
              suppliers.map((s) => (
                <GlassCard key={s.id} className="group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-cyan/10 transition-colors">
                        {s.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors">{s.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${
                      s.status === 'Connected' ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {s.status === 'Connected' && <CheckCircle2 size={14} />}
                      {s.status}
                    </span>
                    <button 
                      onClick={() => setShowConfigureModal({ ...s, type: 'supplier' })}
                      className="text-xs font-bold text-brand-cyan hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      {s.status === 'Connected' ? 'Configure' : 'Connect'} <ExternalLink size={12} />
                    </button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </section>

        {/* Payment Gateways */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard className="text-brand-cyan" size={20} /> Payment Gateways
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gateways.map((g) => (
              <GlassCard key={g.id} className="group flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-cyan/10 transition-colors">
                      {g.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors">{g.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${
                    g.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {g.status === 'Active' && <CheckCircle2 size={14} />}
                    {g.status}
                  </span>
                  <button 
                    onClick={() => setShowConfigureModal({ ...g, type: 'gateway' })}
                    className="text-xs font-bold text-brand-cyan hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    Settings <ExternalLink size={12} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Add New Integration</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewIntegration({...newIntegration, type: 'supplier'})}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                      newIntegration.type === 'supplier' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <Package size={20} /> Supplier
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewIntegration({...newIntegration, type: 'gateway'})}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                      newIntegration.type === 'gateway' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <CreditCard size={20} /> Payment
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Integration Name</label>
                    <input 
                      required
                      type="text"
                      value={newIntegration.name}
                      onChange={e => setNewIntegration({...newIntegration, name: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-brand-cyan/20 outline-none"
                      placeholder="e.g. Amazon Business"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Description</label>
                    <input 
                      required
                      type="text"
                      value={newIntegration.desc}
                      onChange={e => setNewIntegration({...newIntegration, desc: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-brand-cyan/20 outline-none"
                      placeholder="Short description of the service"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <GradientButton className="w-full py-3">Add Integration</GradientButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configure Modal */}
      <AnimatePresence>
        {showConfigureModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfigureModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{showConfigureModal.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{showConfigureModal.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{showConfigureModal.type}</p>
                  </div>
                </div>
                <button onClick={() => setShowConfigureModal(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Connection Status</p>
                      <p className="text-xs text-slate-500">Enable or disable this integration</p>
                    </div>
                    <button 
                      onClick={() => toggleStatus(showConfigureModal.id, showConfigureModal.type)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        (showConfigureModal.status === 'Connected' || showConfigureModal.status === 'Active') ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-700'
                      } border`}
                    >
                      <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform ${
                        (showConfigureModal.status === 'Connected' || showConfigureModal.status === 'Active') ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {showConfigureModal.type === 'supplier' && (showConfigureModal.status === 'Connected' || showConfigureModal.status === 'Active') && (
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.2em]">Live Pricing Features</p>
                      {[
                        { label: 'Live Inventory Lookup', desc: 'Real-time stock levels' },
                        { label: 'Automated SKU Pull', desc: 'Sync supplier SKUs with catalogs' },
                        { label: 'Periodic Price Sync', desc: 'Auto-sync every 24 hours' }
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                           <div>
                              <p className="text-xs font-bold text-white">{feat.label}</p>
                              <p className="text-[9px] text-slate-500">{feat.desc}</p>
                           </div>
                           <div className="w-8 h-4 bg-brand-cyan/20 border border-brand-cyan/50 rounded-full relative">
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-cyan rounded-full" />
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] pt-2">API Configuration</p>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Secret Key</label>
                      <input 
                        type="password" 
                        value={configValue}
                        onChange={(e) => setConfigValue(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-brand-cyan outline-none"
                        placeholder="Enter API Secret Key"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <GradientButton 
                    onClick={handleSaveConfig}
                    className="w-full py-2.5"
                  >
                    Save Changes
                  </GradientButton>
                  <button 
                    onClick={() => deleteIntegration(showConfigureModal.id, showConfigureModal.type)}
                    className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-bold hover:bg-rose-500/10 transition-all"
                  >
                    Remove Integration
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

