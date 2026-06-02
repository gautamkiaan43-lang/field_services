import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, CheckCircle2, XCircle, Clock,
    Search, Filter, Eye, User, FileText,
    AlertCircle, ChevronRight, Check, X
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { useVerification } from '../../context/VerificationContext'
import { useAuth } from '../../context/AuthContext'

const UPLOADS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '') + '/uploads/';

export default function AccountVerification() {
    const { requests, approveRequest, rejectRequest } = useVerification()
    const [selectedId, setSelectedId] = useState(null)
    const [filter, setFilter] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')

    const selectedRequest = requests.find(r => r.id === selectedId)

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter
        const matchesSearch = (r.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.userId?.toString().includes(searchTerm)
        return matchesFilter && matchesSearch
    })

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Identity Verifications</h1>
                    <p className="text-slate-400 mt-1">Review and manage account authentication requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                        {requests.filter(r => r.status === 'Approved').length} Verified
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
                        {requests.filter(r => r.status === 'Pending').length} Pending
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List Side */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-4" hover={false}>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
                            />
                        </div>
                        <div className="flex gap-2 mb-6">
                            {['All', 'PENDING', 'APPROVED'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${filter === f ? 'bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide">
                            {filteredRequests.map(req => (
                                <button
                                    key={req.id}
                                    onClick={() => setSelectedId(req.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border group ${selectedId === req.id
                                        ? 'bg-brand-cyan/10 border-brand-cyan/30 text-white'
                                        : 'bg-white/5 border-transparent hover:border-white/10 text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-mono font-bold tracking-widest opacity-60">{req.id}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                            req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>{req.status}</span>
                                    </div>
                                    <p className={`font-bold transition-colors ${selectedId === req.id ? 'text-brand-cyan' : 'group-hover:text-white text-slate-300'}`}>
                                        {req.user?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest font-medium mt-1 opacity-60">{req.user?.role || 'User'}</p>
                                </button>
                            ))}
                            {filteredRequests.length === 0 && (
                                <div className="py-10 text-center text-slate-600">
                                    <User size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs italic">No requests found</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Detail Side */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedRequest ? (
                            <motion.div
                                key={selectedRequest.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <GlassCard className="p-8 md:p-10 border-white/10" hover={false}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[2rem] bg-slate-800 p-1 border border-brand-cyan/30 shadow-2xl shadow-brand-cyan/10">
                                                <Avatar name={selectedRequest.user?.name} className="w-full h-full rounded-[1.8rem]" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedRequest.user?.name}</h2>
                                                <p className="text-brand-cyan text-sm font-medium flex items-center gap-2 mt-1">
                                                    <Shield size={14} /> {selectedRequest.user?.role}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={12} /> Submitted {selectedRequest.submittedAt}
                                            </span>
                                            <span className="text-xs font-mono text-slate-400 mt-1 opacity-60">REF: {selectedRequest.id}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                                                <FileText size={12} /> Government Issue ID
                                            </h4>
                                            <div className="aspect-[1.6/1] rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-950 relative group">
                                                <img src={`${UPLOADS_URL}${selectedRequest.idPhotoUrl}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="ID Document" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all">
                                                        <Eye size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-600 italic text-center">Verify: Name, Expiry & DOB match profiles.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                                                <User size={12} /> Biometric Selfie-match
                                            </h4>
                                            <div className="aspect-[1/1] rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-950 relative group">
                                                <img src={`${UPLOADS_URL}${selectedRequest.selfieUrl}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Selfie" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all">
                                                        <Eye size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-600 italic text-center">Verify: Face matches document photo above.</p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 mb-10 flex items-start gap-4">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <div>
                                            <h5 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Audit Policy</h5>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Ensure the document is a valid government issued ID. If text is blurry or face does not match, reject with a specific reason.
                                            </p>
                                        </div>
                                    </div>

                                    {selectedRequest.status === 'PENDING' ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => rejectRequest(selectedRequest.id, 'Image was too blurry to read.')}
                                                className="p-4 bg-white/5 border border-rose-500/20 text-rose-400 font-bold rounded-[2rem] hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                            <GradientButton
                                                onClick={() => approveRequest(selectedRequest.id)}
                                                className="flex-1 py-4 rounded-[2rem] shadow-lg shadow-emerald-500/20"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <Check size={18} /> Approve
                                                </div>
                                            </GradientButton>
                                        </div>
                                    ) : (
                                        <div className={`p-6 rounded-[2rem] flex items-center justify-center gap-3 font-bold border ${selectedRequest.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-REJECTED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10'
                                            }`}>
                                            {selectedRequest.status === 'APPROVED' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                            Decision: {selectedRequest.status}
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ) : (
                            <GlassCard className="h-[600px] flex flex-col items-center justify-center text-center p-10 border-dashed border-2 border-white/5" hover={false}>
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-700 mb-6">
                                    <Shield size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-400">Review Selection</h3>
                                <p className="text-slate-600 max-w-xs mt-2">Select a verification request from the left panel to begin document audit.</p>
                            </GlassCard>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
