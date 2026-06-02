import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Camera, FileText, MessageSquare, ChevronRight, User, Loader2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { SignaturePadField, isSignatureImageDataUrl } from '../../components/ui/SignaturePadField'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import jobPhotoPlaceholder from '../../assets/job-photo-placeholder.svg'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startSignature, setStartSignature] = useState('')
  const [endSignature, setEndSignature] = useState('')
  const [savingStartSignature, setSavingStartSignature] = useState(false)
  const [savingEndSignature, setSavingEndSignature] = useState(false)

  const fetchJob = React.useCallback(async () => {
    try {
      const { data } = await api.get(`/customer/jobs/${id}`)
      setJob(data)
    } catch (error) {
      toast.error('Failed to load job details')
      console.error(error)
      navigate('/dashboard/portal')
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    if (id) fetchJob()
  }, [id, fetchJob])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
         <Loader2 className="animate-spin text-brand-cyan" size={48} />
      </div>
    )
  }

  if (!job) return null

  const progress = job.status === 'IN_PROGRESS' ? 50 : job.status === 'NEAR_COMPLETION' ? 90 : job.status === 'COMPLETED' ? 100 : 25

  const subtotal = job.invoice?.subtotal || (job.invoice?.amount ? parseFloat(job.invoice.amount.toString().replace('$', '').replace(',', '')) : 0)
  const tax = job.invoice?.tax || (subtotal * 0.08)
  const total = job.invoice?.totalAmount || (subtotal + tax)
  const formatSignatureDate = (value) => {
    if (!value) return 'Not signed'
    let parsed = value
    if (typeof parsed === 'string' && parsed.includes(' ') && !parsed.includes('T')) {
      // MySQL DATETIME comes without timezone; treat it as UTC.
      parsed = `${parsed.replace(' ', 'T')}Z`
    }
    const date = new Date(parsed)
    if (Number.isNaN(date.getTime())) return 'Not signed'
    return date.toLocaleString([], { timeZone: 'UTC' })
  }

  const submitStartSignature = async () => {
    if (!startSignature.trim()) return
    setSavingStartSignature(true)
    try {
      await api.post(`/jobs/${job.id}/start-signature`, { signature: startSignature.trim() })
      setStartSignature('')
      await fetchJob()
      toast.success('Start signature saved')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save start signature')
    } finally {
      setSavingStartSignature(false)
    }
  }

  const submitEndSignature = async () => {
    if (!endSignature.trim()) return
    setSavingEndSignature(true)
    try {
      await api.post(`/jobs/${job.id}/end-signature`, { signature: endSignature.trim() })
      setEndSignature('')
      await fetchJob()
      toast.success('Completion signature saved')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save completion signature')
    } finally {
      setSavingEndSignature(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{job.title || 'General Service'}</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2"><span className="font-mono text-brand-cyan">JOB-{job.id}</span> • {user?.name}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
          job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-cyan/10 text-brand-cyan'
        }`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress */}
          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-4">Job Progress</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xl font-bold text-brand-cyan">{progress}%</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Status:</span>
              <div className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm">
                {job.status.replace('_', ' ')}
              </div>
            </div>
          </GlassCard>

          {/* Photos */}
          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="text-brand-cyan" size={18} /> Job Photos
            </h2>
            {job.photos && job.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {job.photos.map((photo) => {
                  const url = photo.url.startsWith('http') ? photo.url : `${import.meta.env.VITE_API_URL}${photo.url}`;
                  return (
                    <div key={photo.id} className="rounded-xl overflow-hidden border border-white/5 hover:border-brand-cyan/30 transition-all cursor-pointer group">
                      <img
                        src={url}
                        alt={`Job photo ${photo.id}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = jobPhotoPlaceholder; }}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No photos uploaded for this job yet.</p>
            )}
          </GlassCard>

          {/* Notes */}
          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="text-brand-purple" size={18} /> Technician Notes
            </h2>
            <div className="space-y-4">
              {job.notes && job.notes.length > 0 ? job.notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <User size={14} className="text-brand-cyan" /> {note.createdBy?.name || job.assignedEmployee?.user?.name || 'Technician'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-300">{note.content}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No notes recorded.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-4">Start Job Signature</h2>
            {job.startSignature ? (
              isSignatureImageDataUrl(job.startSignature) ? (
                <img
                  src={job.startSignature}
                  alt="Start job signature"
                  className="max-h-28 rounded-lg border border-white/10 bg-white p-1 mb-2"
                />
              ) : (
                <p className="text-sm text-slate-400 mb-2">{job.startSignature}</p>
              )
            ) : (
              <p className="text-sm text-slate-400 mb-2">No start signature yet.</p>
            )}
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">
              Signed At: {formatSignatureDate(job.startSignedAt)}
            </p>
            {!job.startSignature && (
              <div className="space-y-3">
                <SignaturePadField
                  value={startSignature}
                  onChange={setStartSignature}
                  height={140}
                />
                <button
                  type="button"
                  onClick={submitStartSignature}
                  disabled={savingStartSignature || !startSignature.trim()}
                  className="w-full py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-bold hover:bg-brand-cyan/20 disabled:opacity-50"
                >
                  {savingStartSignature ? 'Saving...' : 'Submit Start Signature'}
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-bold text-white mb-4">Complete Job Signature</h2>
            {job.endSignature ? (
              isSignatureImageDataUrl(job.endSignature) ? (
                <img
                  src={job.endSignature}
                  alt="Completion job signature"
                  className="max-h-28 rounded-lg border border-white/10 bg-white p-1 mb-2"
                />
              ) : (
                <p className="text-sm text-slate-400 mb-2">{job.endSignature}</p>
              )
            ) : (
              <p className="text-sm text-slate-400 mb-2">No completion signature yet.</p>
            )}
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">
              Signed At: {formatSignatureDate(job.endSignedAt)}
            </p>
            {!job.endSignature && (
              <div className="space-y-3">
                <SignaturePadField
                  value={endSignature}
                  onChange={setEndSignature}
                  height={140}
                />
                <button
                  type="button"
                  onClick={submitEndSignature}
                  disabled={savingEndSignature || !endSignature.trim()}
                  className="w-full py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-bold hover:bg-brand-cyan/20 disabled:opacity-50"
                >
                  {savingEndSignature ? 'Saving...' : 'Submit Completion Signature'}
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-bold text-white mb-4">Job Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-500" />
                <span className="text-slate-300">{job.location || 'Location pending'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-slate-500" />
                <span className="text-slate-300">{new Date(job.scheduledAt || job.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-slate-500" />
                <span className="text-slate-300">Tech: {job.assignedEmployee?.user?.name || 'Unassigned'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-brand-cyan/20 bg-gradient-to-b from-brand-cyan/5 to-transparent">
            <h3 className="font-bold text-white mb-4">Cost Summary</h3>
            {job.invoice ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Tax</span><span className="text-white font-bold">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-white font-bold">Total</span><span className="text-xl font-bold text-brand-cyan">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">Invoice pending generation.</p>
            )}
          </GlassCard>

          <GradientButton className="w-full py-3" onClick={() => navigate('/dashboard/portal/support')}>
            <MessageSquare size={18} className="mr-2 inline" /> Contact Support
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
