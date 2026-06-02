import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  History, ShieldCheck, Receipt, MessageSquare,
  MapPin, Clock, ChevronRight, CreditCard,
  FileText, AlertCircle, CheckCircle2, Loader2, Star
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { ModernInput } from '../../components/ui/ModernInput'
import { useAuth } from '../../context/AuthContext'
import { useReviews } from '../../context/ReviewsContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { Facebook, Instagram, Globe as GlobeIcon } from 'lucide-react'

export default function CustomerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeJob, setActiveJob] = useState(null)
  const [pendingEstimates, setPendingEstimates] = useState([])
  const [jobHistory, setJobHistory] = useState([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [socialLinks, setSocialLinks] = useState(null)

  // Review Form State
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const { addReview } = useReviews()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [activeRes, estimatesRes, historyRes, invoicesRes, settingsRes] = await Promise.all([
          api.get('/customer/jobs/active').catch(() => ({ data: null })), // 404 if no active job
          api.get('/customer/estimates'),
          api.get('/customer/jobs/history'),
          api.get('/customer/invoices'),
          api.get('/settings').catch(() => ({ data: { data: {} } }))
        ]);

        setActiveJob(activeRes.data);
        if (settingsRes?.data?.data) {
          setSocialLinks(settingsRes.data.data);
        }
        const mappedEstimates = (estimatesRes.data || []).map(e => ({
          ...e,
          projectTitle: e.notes || e.projectTitle || 'General Service Estimate',
          status: String(e.status || '').toUpperCase(),
          totalAmount: Number(e.totalAmount || 0)
        }));
        setPendingEstimates(mappedEstimates.filter(e =>
          e.status === 'PENDING' || e.status === 'REVISED'
        ));
        setJobHistory((historyRes.data || []).slice(0, 2)); // Get top 2 recent

        const unpaidTotal = (invoicesRes.data || [])
          .filter(inv => inv.status === 'Unpaid')
          .reduce((sum, inv) => {
            const amt = inv.totalAmount || parseFloat((inv.amount || '0').toString().replace('$', '').replace(',', ''));
            return sum + (amt || 0);
          }, 0);
        setTotalOutstanding(unpaidTotal);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSubmitReview = async () => {
    if (!comment.trim()) return toast.error('Please add a comment');
    setIsSubmittingReview(true);
    try {
      await addReview({ rating, comment });
      setComment('');
      setRating(5);
    } catch (error) {
      // toast handled in context
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const progress = activeJob
    ? Math.max(0, Math.min(100, Number(activeJob.progress || 0)))
    : 0;

  const activeJobLocation =
    activeJob?.customer?.address ||
    activeJob?.address ||
    activeJob?.location ||
    'Location pending';

  const activeTechnicianName =
    activeJob?.technician?.user?.name ||
    activeJob?.technician?.name ||
    activeJob?.technician ||
    'Unassigned';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-cyan" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            Hello, {user?.name || 'Customer'}
          </h1>
          <p className="text-slate-400 mt-2">Track your home service projects and payments anytime.</p>
        </div>
        <GradientButton className="h-fit" onClick={() => navigate('/dashboard/portal/support')}>
          <MessageSquare size={18} /> Chat with Support
        </GradientButton>
      </div>

      {/* Social Media Links */}
      {socialLinks && (socialLinks.facebookUrl || socialLinks.instagramUrl || socialLinks.websiteUrl) && (
        <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-white/5 bg-slate-900/30">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GlobeIcon size={16} className="text-brand-cyan" /> Follow Us
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Stay connected for the latest updates and offers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.facebookUrl && (
              <a href={socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
                <Facebook size={18} />
              </a>
            )}
            {socialLinks.instagramUrl && (
              <a href={socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all cursor-pointer">
                <Instagram size={18} />
              </a>
            )}
            {socialLinks.websiteUrl && (
              <a href={socialLinks.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all cursor-pointer">
                <GlobeIcon size={18} />
              </a>
            )}
          </div>
        </GlassCard>
      )}

      {/* Review System - Minimalist Form Card */}
      <GlassCard className="p-6 border-brand-cyan/20 bg-brand-cyan/5">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Star className="text-brand-cyan fill-brand-cyan" size={20} /> Rate Our Service
            </h3>
            <p className="text-xs text-slate-400">Your feedback helps us provide the best experience for you.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  <Star
                    size={24}
                    className={`${s <= rating ? 'text-brand-cyan fill-brand-cyan' : 'text-slate-700'} hover:scale-110 transition-all`}
                  />
                </button>
              ))}
            </div>
            <div className="flex-1 w-full max-w-md flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Tell us what you think..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-brand-cyan/30 focus:outline-none placeholder:text-slate-600"
              />
              <GradientButton
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !comment.trim()}
                className="shrink-0 h-10 px-6 font-bold w-full sm:w-auto"
              >
                {isSubmittingReview ? <Loader2 className="animate-spin" size={16} /> : 'Submit'}
              </GradientButton>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Project Tracker */}
          <GlassCard className="relative overflow-hidden" glow={!!activeJob}>
            {activeJob && (
              <div className="absolute top-0 right-0 p-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-brand-cyan text-slate-900 animate-pulse">
                  LIVE TRACKING
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className={activeJob ? "text-brand-cyan" : "text-slate-500"} size={20} />
              Active Project
            </h3>

            {activeJob ? (
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-48 aspect-square rounded-3xl bg-slate-900 flex items-center justify-center border border-white/5 p-4">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-brand-cyan/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-brand-cyan rounded-full border-t-transparent animate-spin-slow" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{progress}%</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progress</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-white">{activeJob.title}</h4>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                      <MapPin size={14} /> {activeJobLocation}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                      <p className="text-sm font-bold text-brand-cyan">{String(activeJob.status || '').replace('_', ' ') || 'SCHEDULED'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Technician</p>
                      <p className="text-sm font-bold text-white">{activeTechnicianName}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/dashboard/portal/job/${activeJob.id}`)} className="text-sm text-brand-cyan font-bold flex items-center gap-1 hover:underline">
                    View Live Photos <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                <ShieldCheck className="mx-auto text-slate-600 mb-4" size={32} />
                <p className="text-white font-bold">No Active Projects</p>
                <p className="text-xs text-slate-500 mt-1">You do not have any jobs currently in progress.</p>
              </div>
            )}
          </GlassCard>

          {/* Pending Approvals Widget */}
          <GlassCard className={`border-2 transition-all ${pendingEstimates.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className={`${pendingEstimates.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} size={20} />
                Pending Approvals
                {pendingEstimates.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-900">
                    {pendingEstimates.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate('/dashboard/portal/approvals')}
                className="text-sm text-brand-cyan hover:underline"
              >
                View All
              </button>
            </div>

            {pendingEstimates.length > 0 ? (
              <div className="space-y-3">
                {pendingEstimates.slice(0, 2).map(est => (
                  <div
                    key={est.id}
                    onClick={() => navigate('/dashboard/portal/approvals')}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-amber-500/20 hover:border-amber-400/40 hover:bg-amber-500/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <FileText size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {est.projectTitle || est.title || 'General Service Estimate'}
                        </p>
                        <p className="text-[10px] text-slate-500">#{est.id} · {new Date(est.date || est.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white">
                        ${Number(est.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                ))}
                {pendingEstimates.length > 2 && (
                  <button
                    onClick={() => navigate('/dashboard/portal/approvals')}
                    className="w-full text-center text-xs text-amber-400 hover:underline py-2"
                  >
                    + {pendingEstimates.length - 2} more pending approval{pendingEstimates.length - 2 > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">All Caught Up!</p>
                <p className="text-xs text-slate-500 mt-1">No estimates pending your approval.</p>
              </div>
            )}
          </GlassCard>

          {/* Recent History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="text-brand-purple" size={20} /> Project History
            </h3>
            <div className="space-y-4">
              {jobHistory.length > 0 ? jobHistory.map((job) => (
                <GlassCard key={job.id} className="flex items-center justify-between p-6 cursor-pointer hover:border-brand-purple/30 transition-all" onClick={() => navigate(`/dashboard/portal/job/${job.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Receipt size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{job.title || 'Service Work'}</h4>
                      <p className="text-xs text-slate-500">{new Date(job.scheduledAt || job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-all flex items-center gap-2">
                    View <ChevronRight size={16} />
                  </span>
                </GlassCard>
              )) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-slate-500 text-sm">No completed jobs yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <GlassCard className="p-8 border-brand-purple/20 bg-gradient-to-b from-brand-purple/5 to-transparent">
            <h3 className="text-xl font-bold text-white mb-6">Pending Payment</h3>
            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 mb-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 rounded-full blur-3xl -z-10" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Outstanding</p>
              <p className="text-4xl font-bold text-white tracking-tighter">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-4">
              <GradientButton
                onClick={() => navigate('/dashboard/portal/payments')}
                className="w-full py-4 text-slate-900 font-bold bg-white hover:bg-slate-100 shadow-xl shadow-white/10 flex justify-center"
                disabled={totalOutstanding <= 0}
              >
                <CreditCard size={20} className="mr-2 inline" /> Pay Balance
              </GradientButton>
              <button
                onClick={() => navigate('/dashboard/portal/payments')}
                className="w-full py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm"
              >
                View Statements
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-bold text-white mb-6">Need Assistance?</h3>
            <div className="space-y-4">
              <div
                onClick={() => navigate('/dashboard/portal/support')}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Live Chat</p>
                  <p className="text-[10px] text-slate-500">Wait time: ~2 mins</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
