import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, MapPin, Phone, MessageSquare,
  Camera, Play, Pause, Square, Eye
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { useJobs } from '../../context/JobsContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

export default function DailyJobs() {
  const { jobs, updateStatus, syncJobById } = useJobs()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [activeJob, setActiveJob] = useState(() => localStorage.getItem('active_job_id'))
  const [activeJobStartedAt, setActiveJobStartedAt] = useState(() => {
    const savedJobId = localStorage.getItem('active_job_id')
    if (!savedJobId) return null
    return localStorage.getItem(`active_job_started_at_${savedJobId}`)
  })
  const [timerTick, setTimerTick] = useState(Date.now())
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const isTrackingRef = React.useRef(false)
  const trackingIntervalRef = React.useRef(null)
  const toBackendJobId = React.useCallback((jobId) => {
    if (!jobId) return null
    if (typeof jobId === 'string' && jobId.startsWith('JOB-')) return jobId.replace('JOB-', '')
    return String(jobId)
  }, [])

  // Keep ref in sync for the async geolocation callback
  React.useEffect(() => {
    isTrackingRef.current = isLiveTracking;
  }, [isLiveTracking]);

  const triggerLocationPush = React.useCallback(async (jobId) => {
    const backendJobId = toBackendJobId(jobId)
    if (!backendJobId) return
    if (!navigator.geolocation) return;
    if (!localStorage.getItem('token')) return;
    if (!isTrackingRef.current) return; // Guard against race conditions during stop

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isTrackingRef.current) return; // Double check after position is acquired
        try {
          await api.post(`/jobs/${backendJobId}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        } catch (error) {
          console.error("Failed to share job location", error);
          if (error.response?.status === 401) {
            setIsLiveTracking(false);
            if (trackingIntervalRef.current) {
              clearInterval(trackingIntervalRef.current);
              trackingIntervalRef.current = null;
            }
            toast.error("Session expired. Please log in again.");
          } else if (error.response?.status === 403) {
            localStorage.removeItem(`live_tracking_${jobId}`);
            setIsLiveTracking(false);
            setActiveJob(null);
            if (trackingIntervalRef.current) {
              clearInterval(trackingIntervalRef.current);
              trackingIntervalRef.current = null;
            }
            toast.error("You are not assigned to this job anymore.");
          }
        }
      },
      () => console.error("Unable to retrieve location")
    );
  }, [toBackendJobId]);

  // Sync activeJob to localStorage
  useEffect(() => {
    if (activeJob) {
      localStorage.setItem('active_job_id', activeJob)
      setActiveJobStartedAt((prev) => prev || localStorage.getItem(`active_job_started_at_${activeJob}`))
    } else {
      localStorage.removeItem('active_job_id')
      setActiveJobStartedAt(null)
    }
  }, [activeJob])

  useEffect(() => {
    if (!activeJob) return
    const intervalId = setInterval(() => setTimerTick(Date.now()), 1000)
    return () => clearInterval(intervalId)
  }, [activeJob])

  // Initialize and persist Live Tracking state per job with Backend Sync
  useEffect(() => {
    if (!activeJob) {
      setIsLiveTracking(false)
      return
    }

    // Quick-load from localStorage first
    const savedState = localStorage.getItem(`live_tracking_${activeJob}`) === 'true'
    setIsLiveTracking(savedState)

    // Then sync with Backend as source of truth
    const syncWithBackend = async () => {
      try {
        const backendJobId = toBackendJobId(activeJob)
        if (!backendJobId) return
        const res = await api.get(`/jobs/${backendJobId}/tracking-status`);
        if (res.data.success) {
          const isBackendActive = !!res.data.trackingActive;
          setIsLiveTracking(isBackendActive);
          // Update localStorage to match backend
          if (isBackendActive) {
            localStorage.setItem(`live_tracking_${activeJob}`, 'true');
          } else {
            localStorage.removeItem(`live_tracking_${activeJob}`);
          }
        }
      } catch (err) {
        console.error('Failed to sync tracking status with backend', err);
      }
    };

    syncWithBackend();
  }, [activeJob, toBackendJobId])

  // Manage Tracking Interval
  useEffect(() => {
    if (isLiveTracking && activeJob) {
      if (!trackingIntervalRef.current) {
        triggerLocationPush(activeJob)
        trackingIntervalRef.current = setInterval(() => triggerLocationPush(activeJob), 15000)
      }
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
    }

    return () => {
      // Internal cleanup is handled by condition above, 
      // but unmount cleanup is still good practice
    }
  }, [isLiveTracking, activeJob, triggerLocationPush])

  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [])





  // Technician only sees their assigned jobs
  const myJobs = jobs.filter(j => j.technicianId === user?.employee?.id)

  useEffect(() => {
    if (!activeJob) return;
    const isStillAssigned = myJobs.some(job => job.id === activeJob);
    if (!isStillAssigned) {
      localStorage.removeItem(`live_tracking_${activeJob}`);
      setIsLiveTracking(false);
      setActiveJob(null);
    }
  }, [activeJob, myJobs]);

  useEffect(() => {
    const checkClockStatus = async () => {
      if (!user?.employee?.id) {
        setIsClockedIn(false)
        return
      }
      try {
        const res = await api.get('/timesheets/my-history')
        const history = res.data
        if (history.length > 0 && !history[0].clockOut) {
          setIsClockedIn(true)
        }
      } catch (e) {
        if (e?.response?.status === 403) {
          setIsClockedIn(false)
          return
        }
        console.error('Failed to get timesheet history', e)
      }
    }
    checkClockStatus()
  }, [user])

  const statusColors = {
    'En Route': 'text-blue-400 bg-blue-400/10',
    'On Site': 'text-cyan-400 bg-cyan-400/10',
    'Completed': 'text-emerald-400 bg-emerald-400/10',
    'Pending': 'text-amber-400 bg-amber-400/10',
    'In Progress': 'text-purple-400 bg-purple-400/10',
  }

  const jobHasStartSignature = (j) =>
    typeof j?.startSignature === 'string' && j.startSignature.trim().length > 0

  const handleStartWork = async (jobId) => {
    const fresh = await syncJobById(jobId)
    const job = fresh || jobs.find((j) => j.id === jobId)
    if (!jobHasStartSignature(job)) {
      toast.error('Customer start signature is required before starting work.')
      navigate(`/dashboard/tech/jobs/${jobId}`)
      return
    }
    const startIso = new Date().toISOString()
    localStorage.setItem(`active_job_started_at_${jobId}`, startIso)
    setActiveJobStartedAt(startIso)
    setActiveJob(jobId)
    updateStatus(jobId, 'In Progress')
  }

  const activeJobData = activeJob ? jobs.find((j) => j.id === activeJob) : null
  const resolveActiveJobStartTime = () => {
    if (!activeJob) return null

    const stored = localStorage.getItem(`active_job_started_at_${activeJob}`)
    if (stored) return stored

    // Fallback for sessions restored without local cache.
    if (activeJobData?.status === 'In Progress') {
      return activeJobData.inProgressAt || activeJobData.startedAt || activeJobData.updatedAt || null
    }
    return null
  }

  const formatElapsed = (startAt) => {
    if (!startAt) return '00:00:00'
    const startedMs = new Date(startAt).getTime()
    if (!Number.isFinite(startedMs)) return '00:00:00'
    const elapsedSeconds = Math.max(0, Math.floor((timerTick - startedMs) / 1000))
    const hh = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')
    const mm = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')
    const ss = String(elapsedSeconds % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  const activeSessionStart = resolveActiveJobStartTime()

  const handleAction = (action, job = null) => {
    if (action === 'Message') {
      // Find the user ID for this customer
      const customerUserId = job?.customerUserId || job?.customerId; // Depends on how job object is structured
      if (customerUserId) {
        navigate('/dashboard/messages', { state: { selectedContactId: customerUserId } });
      } else {
        navigate('/dashboard/messages');
      }
      return;
    }
    toast.success(`${action} action triggered!`)
  }

  const handleClockToggle = async () => {
    try {
      if (isClockedIn) {
        await api.post('/timesheets/clock-out', { time: new Date().toISOString() })
        setIsClockedIn(false)
        toast.success("Clocked out successfully")
      } else {
        await api.post('/timesheets/clock-in', { time: new Date().toISOString() })
        setIsClockedIn(true)
        toast.success("Clocked in successfully")
      }
    } catch (e) {
      toast.error('Failed to update attendance status')
    }
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post('/employees/location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success("Location shared with dispatch clearly");
        } catch (error) {
          toast.error("Failed to share location with server");
        } finally {
          setIsSharingLocation(false);
        }
      },
      (error) => {
        setIsSharingLocation(false);
        toast.error("Unable to retrieve your location");
      }
    );
  };

  const toggleLiveTracking = async () => {
    if (!navigator.geolocation) return toast.error("Geolocation is not supported");
    if (!activeJob) return toast.error("No active job session");
    const backendJobId = toBackendJobId(activeJob)
    if (!backendJobId) return toast.error("Invalid active job");

    const newState = !isLiveTracking;

    try {
      if (newState) {
        await api.patch(`/jobs/${backendJobId}/start-tracking`);
        localStorage.setItem(`live_tracking_${activeJob}`, 'true');
        toast.success("Live tracking started. Updating every 15s.");
      } else {
        // Immediate cleanup before the API call to stop race pings
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
        isTrackingRef.current = false; // Kill any current callback pings

        await api.patch(`/jobs/${backendJobId}/stop-tracking`);
        localStorage.removeItem(`live_tracking_${activeJob}`);
        toast.success("Live job tracking stopped");
      }
      setIsLiveTracking(newState);
    } catch (err) {
      toast.error('Failed to update tracking status on server');
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Technician HUD */}
      <GlassCard className="bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 border-white/10" glow>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-cyan p-1 bg-slate-900">
              <Avatar name={user?.name || 'Tech'} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-white">Good Morning, {user?.name?.split(' ')[0] || 'Technician'}!</h1>
              <p className="text-slate-400 mt-1">You have <span className="text-brand-cyan font-bold">{myJobs.filter(j => j.status !== 'Completed').length} jobs</span> scheduled for today.</p>
            </div>
          </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right mr-4 block">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Status</p>
                <p className={`font-bold ${isClockedIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isClockedIn ? 'Active / On Duty' : 'Off Duty'}
                </p>
              </div>
              <button 
                onClick={handleClockToggle}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all w-full sm:w-auto ${
                  isClockedIn 
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                  : 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
              {isClockedIn ? <><Pause size={20} /> Clock Out</> : <><Play size={20} /> Clock In</>}
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-brand-cyan" size={20} /> Today's Schedule
          </h3>
          {myJobs.length > 0 ? myJobs.map((job) => (
            <GlassCard key={job.id} className={`group ${activeJob === job.id ? 'border-brand-cyan bg-brand-cyan/5' : 'border-white/5 shadow-none hover:shadow-lg transition-all'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-brand-cyan font-bold font-mono text-xs">{job.id}</span>
                      <h4 className="text-xl font-bold text-white truncate max-w-[150px] sm:max-w-none">{job.customer}</h4>
                    </div>
                    <span className={`md:hidden px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[job.status] || 'bg-slate-400/10 text-slate-400'}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{job.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <MapPin size={14} className="text-brand-cyan shrink-0" /> <span className="truncate">{job.address || ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <Clock size={14} className="text-brand-cyan shrink-0" /> {job.scheduledTime || 'Scheduled'}
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan" style={{ width: `${job.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">{job.progress}%</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => handleAction('Call', job)} className="p-3 bg-white/5 rounded-xl text-brand-cyan hover:bg-brand-cyan/10 transition-all border border-white/10" title="Call Customer"><Phone size={18} /></button>
                    <button onClick={() => handleAction('Message', job)} className="p-3 bg-white/5 rounded-xl text-brand-purple hover:bg-brand-purple/10 transition-all border border-white/10" title="Message Office"><MessageSquare size={18} /></button>
                    <button onClick={handleShareLocation} className="p-3 bg-white/5 rounded-xl text-emerald-400 hover:bg-emerald-400/10 transition-all border border-white/10" title="Navigate"><MapPin size={18} /></button>
                    <button onClick={() => navigate(`/dashboard/tech/jobs/${job.id}`)} className="p-3 bg-white/5 rounded-xl text-amber-400 hover:bg-amber-400/10 transition-all border border-white/10" title="View Details"><Eye size={18} /></button>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-stretch md:items-end gap-4 md:min-w-[180px] border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                  <span className={`hidden md:inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[job.status] || 'bg-slate-400/10 text-slate-400'}`}>
                    {job.status}
                  </span>
                  {job.status !== 'Completed' ? (
                    <GradientButton
                      onClick={() => handleStartWork(job.id)}
                      disabled={job.status !== 'In Progress' && !jobHasStartSignature(job)}
                      title={!jobHasStartSignature(job) && job.status !== 'In Progress' ? 'Customer start signature required' : undefined}
                      className="w-full py-4 text-sm font-bold uppercase tracking-widest shadow-xl ring-1 ring-white/10"
                      variant={job.status === 'In Progress' ? 'secondary' : 'primary'}
                    >
                      {job.status === 'In Progress' ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                          Working...
                        </span>
                      ) : 'Start Work'}
                    </GradientButton>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-2xl text-center">
                      <span className="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <Clock size={14} /> ✓ Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )) : (
            <GlassCard hover={false}>
              <div className="py-12 text-center">
                <Clock size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-xl font-bold text-white mb-2">No Assigned Jobs</p>
                <p className="text-sm text-slate-500">You currently have no jobs assigned to you.</p>
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-8">
          <GlassCard title="Active Session">
            {activeJob ? (
              <div className="space-y-6 text-center">
                <div className="text-4xl font-bold text-white font-mono tracking-tighter">{formatElapsed(activeSessionStart)}</div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Active Job: {activeJobData?.customer || activeJob}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => toast.success('Session paused')} className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <Pause size={18} /> Pause
                  </button>
                  <button onClick={() => {
                    const activeJobData = jobs.find((j) => j.id === activeJob)
                    const hasEndSignature = typeof activeJobData?.endSignature === 'string' && activeJobData.endSignature.trim().length > 0
                    if (!hasEndSignature) {
                      toast.error('Customer completion signature is required before ending work.')
                      navigate(`/dashboard/tech/jobs/${activeJob}`)
                      return
                    }
                    updateStatus(activeJob, 'Completed');
                    localStorage.removeItem(`live_tracking_${activeJob}`);
                    localStorage.removeItem(`active_job_started_at_${activeJob}`);
                    setActiveJob(null);
                  }} className="flex items-center justify-center gap-2 p-4 bg-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                    <Square size={18} /> Stop
                  </button>
                </div>
                <button onClick={toggleLiveTracking} className={`w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all ${isLiveTracking ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'}`}>
                  {isLiveTracking ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Tracking Live Location...</span> : <span className="flex items-center gap-2"><MapPin size={18} /> Start Live Tracking</span>}
                </button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <Clock size={48} className="text-slate-700 mx-auto" />
                <p className="text-sm text-slate-500">No active job session. </p>
                <p className="text-xs text-slate-600">Select a job to start tracking time.</p>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => navigate('/dashboard/tech/photos')} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-cyan transition-all flex flex-col items-center gap-3">
                <Camera size={24} className="text-brand-cyan" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Photos</span>
              </button>
              <button onClick={() => navigate('/dashboard/tech/materials')} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-purple transition-all flex flex-col items-center gap-3">
                <MessageSquare size={24} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Materials</span>
              </button>
              <button onClick={handleShareLocation} disabled={isSharingLocation} className={`p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-400 transition-all flex flex-col items-center gap-3 col-span-1 sm:col-span-1 ${isSharingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <MapPin size={24} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase text-slate-400">{isSharingLocation ? 'Sharing...' : 'Share Location'}</span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
