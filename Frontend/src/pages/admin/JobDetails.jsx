import React, { useState, useRef } from 'react'
import {
  ArrowLeft, MapPin, Phone, Mail, Clock, Users,
  CheckCircle2, Circle, MessageSquare, Camera,
  Plus, Upload, Trash2, Edit3, ChevronRight, Wrench,
  X, ZoomIn, FileText, Download, Send, AlertCircle, Shield, Eye, AlertTriangle,
  DollarSign, ArrowRight, Play, Pause, Square
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { GlassCard } from '../../components/ui/GlassCard.jsx'
import { GradientButton } from '../../components/ui/GradientButton.jsx'
import { SignaturePadField, isSignatureImageDataUrl } from '../../components/ui/SignaturePadField.jsx'
import { useJobs } from '../../context/JobsContext'
import { useAuth } from '../../context/AuthContext'
import { useFinancing } from '../../context/FinancingContext'
import { useEmployees } from '../../context/EmployeesContext'
import { useMessages } from '../../context/MessagesContext'
import api from '../../services/api'
import L from 'leaflet'
import { toast as hotToast } from 'react-hot-toast'
import jobPhotoPlaceholder from '../../assets/job-photo-placeholder.svg'
import { Avatar } from '../../components/ui/Avatar'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, user: authUser } = useAuth()
  const { jobs, updateJob, updateStatus, updateProgress, assignTechnician, addNote, addPhoto, removePhoto, deleteJob, cancelJob, convertToInvoice, addFile, fetchJobs, syncJobById } = useJobs()
  const { employees } = useEmployees()
  const { applications } = useFinancing()
  const { socket } = useMessages()
  const isMounted = useRef(true)

  React.useEffect(() => {
    return () => { isMounted.current = false }
  }, [])

  const technicians = Array.isArray(employees) ? employees.filter(e => e.role === 'Technician') : []
  const backendJobId = typeof id === 'string' && id.startsWith('JOB-') ? id.replace('JOB-', '') : id

  const job = jobs.find(j => j.id === id)
  const customerFinancing = job && Array.isArray(applications) ? applications.find(a => a.customerName === job.customer) : null

  React.useEffect(() => {
    if (!job && id && isMounted.current) {
      fetchJobs()
    }
  }, [job, id, fetchJobs])

  const [activeTab, setActiveTab] = useState('Overview')
  const [newNote, setNewNote] = useState('')
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [startSignature, setStartSignature] = useState('')
  const [endSignature, setEndSignature] = useState('')
  const [savingStartSignature, setSavingStartSignature] = useState(false)
  const [savingEndSignature, setSavingEndSignature] = useState(false)
  const fileInputRef = useRef(null)

  const [jobLocation, setJobLocation] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const polylineInstanceRef = useRef(null)
  const [trackingEvents, setTrackingEvents] = useState([])
  const [now, setNow] = useState(new Date())
  const [routeTrail, setRouteTrail] = useState([])

  // Phase 10: Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(-1)
  const playbackIntervalRef = useRef(null)
  const playbackMarkerInstanceRef = useRef(null)

  // Helper to add activity events
  const addTrackingEvent = (type, message, timestamp = new Date()) => {
    if (!isMounted.current) return;
    setTrackingEvents(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(timestamp)
    }, ...prev].slice(0, 10))
  }

  // Timer for relative time updates
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (isMounted.current) setNow(new Date());
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => {
    let intervalId;
    const fetchLocation = () => {
      api.get(`/jobs/${backendJobId}/location`)
        .then(res => {
          if (!isMounted.current) return;
          setJobLocation(res.data);
          if (res.data.latitude && res.data.longitude) {
            setRouteTrail(prev => {
              const newPt = { lat: res.data.latitude, lng: res.data.longitude, recordedAt: res.data.lastLocationUpdate || new Date().toISOString() };
              if (prev.length > 0) {
                const lastPt = prev[prev.length - 1];
                if (lastPt.lat === newPt.lat && lastPt.lng === newPt.lng) return prev;
              }
              return [...prev, newPt].slice(-100);
            });
          }
        })
        .catch((err) => {
          if (!isMounted.current) return;
          if (err?.response?.status === 404) {
            setJobLocation(null)
            return
          }
          console.log('Location fetch failed.', err)
        })
    };

    const fetchLocationHistory = () => {
      api.get(`/jobs/${backendJobId}/location-history`)
        .then(res => {
          if (!isMounted.current) return;
          if (Array.isArray(res.data)) {
            setRouteTrail(res.data.map(pt => ({ lat: pt.latitude, lng: pt.longitude, recordedAt: pt.recordedAt })));
          }
        })
        .catch((err) => {
          if (!isMounted.current) return;
          if (err?.response?.status === 404) {
            setRouteTrail([])
            return
          }
          console.log('Location history fetch failed.', err)
        });
    };

    const hasTrackingData = Boolean(job?.trackingActive || job?.lastLocationUpdate || job?.lastLatitude || job?.lastLongitude);

    if (job && hasTrackingData) {
      fetchLocation();
      fetchLocationHistory();
      intervalId = setInterval(fetchLocation, 15000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [backendJobId, job])

  React.useEffect(() => {
    if (jobLocation?.lastLocationUpdate) {
      // Initial historical sync (optional, can be noisy)
    }
  }, [jobLocation?.lastLocationUpdate])

  // Phase 5: Real-time Socket sync
  React.useEffect(() => {
    if (!socket || !id) return;

    const onLocationUpdate = (data) => {
      // Comparison handles potential string/int jobId mismatch
      if (String(data.jobId) === String(id) || (typeof id === 'string' && id.includes(String(data.jobId)))) {
        console.log('[Socket] Instant Location Update:', data);
        if (isMounted.current) {
          setJobLocation(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
            lastLocationUpdate: data.lastLocationUpdate,
            trackingActive: prev?.trackingActive !== undefined ? prev.trackingActive : true
          }));

          setRouteTrail(prev => {
            const newPt = { lat: data.latitude, lng: data.longitude, recordedAt: data.lastLocationUpdate };
            if (prev.length > 0) {
              const lastPt = prev[prev.length - 1];
              if (lastPt.lat === newPt.lat && lastPt.lng === newPt.lng) return prev;
            }
            return [...prev, newPt].slice(-100);
          });

          addTrackingEvent('location', 'Location Updated', data.lastLocationUpdate);
        }
      }
    };

    const onTrackingUpdate = (data) => {
      if (String(data.jobId) === String(id) || (typeof id === 'string' && id.includes(String(data.jobId)))) {
        console.log('[Socket] Tracking Status Changed:', data);
        if (isMounted.current) {
          setJobLocation(prev => ({
            ...prev,
            trackingActive: data.trackingActive
          }));

          const eventMsg = data.trackingActive ? 'Tracking Started' : 'Tracking Stopped';
          addTrackingEvent('status', eventMsg, data.trackingStartedAt || data.trackingStoppedAt);
        }
      }
    };

    socket.on('job:locationUpdated', onLocationUpdate);
    socket.on('job:trackingStatusChanged', onTrackingUpdate);

    return () => {
      socket.off('job:locationUpdated', onLocationUpdate);
      socket.off('job:trackingStatusChanged', onTrackingUpdate);
    };
  }, [socket, id]);

  React.useEffect(() => {
    if (jobLocation?.latitude && jobLocation?.longitude && mapRef.current) {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([jobLocation.latitude, jobLocation.longitude], 14);
        L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenFreeMap'
        }).addTo(mapInstanceRef.current);

        // Render historical route trail
        const latLngs = routeTrail.map(pt => [pt.lat, pt.lng]);
        polylineInstanceRef.current = L.polyline(latLngs, {
          color: '#0ea5e9', weight: 4, opacity: 0.8, dashArray: '8, 8'
        }).addTo(mapInstanceRef.current);

        markerInstanceRef.current = L.marker([jobLocation.latitude, jobLocation.longitude]).addTo(mapInstanceRef.current)
          .bindPopup(`<div style="text-align:center;font-weight:bold;">Current Job Location<br/><span style="font-weight:normal;color:#64748b;font-size:12px;">Active Session</span></div>`);

        markerInstanceRef.current.openPopup();
      } else {
        // Only auto-pan to real-time marker if playback is off
        if (playbackIndex < 0) {
          mapInstanceRef.current.setView([jobLocation.latitude, jobLocation.longitude], 14);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([jobLocation.latitude, jobLocation.longitude]);
        }
        if (polylineInstanceRef.current) {
          const latLngs = routeTrail.map(pt => [pt.lat, pt.lng]);
          polylineInstanceRef.current.setLatLngs(latLngs);
        }
      }
    }
  }, [jobLocation, routeTrail, playbackIndex]);

  React.useEffect(() => {
    return () => {
      try {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        if (playbackMarkerInstanceRef.current) {
          playbackMarkerInstanceRef.current.remove();
          playbackMarkerInstanceRef.current = null;
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.remove();
          markerInstanceRef.current = null;
        }
        if (polylineInstanceRef.current) {
          polylineInstanceRef.current.remove();
          polylineInstanceRef.current = null;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {
        // Ignore teardown races from rapid route transitions/strict mode double effects
      }
    };
  }, []);

  // Phase 10: Playback Player Logic
  React.useEffect(() => {
    if (isPlaying) {
      if (playbackIndex < 0) setPlaybackIndex(0);

      playbackIntervalRef.current = setInterval(() => {
        setPlaybackIndex(prev => {
          const next = prev + 1;
          if (next >= routeTrail.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, 1000); // 1 point per second playback speed
    } else {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    }
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, routeTrail.length]);

  // Phase 10: Playback Marker logic
  React.useEffect(() => {
    if (playbackIndex >= 0 && routeTrail.length > playbackIndex && mapInstanceRef.current) {
      const pt = routeTrail[playbackIndex];
      const timeStr = formatSafeTime(pt.recordedAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (!playbackMarkerInstanceRef.current) {
        // Red marker for playback to differentiate from live marker
        const icon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        playbackMarkerInstanceRef.current = L.marker([pt.lat, pt.lng], { icon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current)
          .bindPopup(`<div style="text-align:center;font-weight:bold;color:#ef4444;">Playback Position<br/><span style="font-weight:normal;color:#64748b;font-size:12px;">${timeStr}</span></div>`);

        playbackMarkerInstanceRef.current.openPopup();
      } else {
        playbackMarkerInstanceRef.current.setLatLng([pt.lat, pt.lng])
          .getPopup().setContent(`<div style="text-align:center;font-weight:bold;color:#ef4444;">Playback Position<br/><span style="font-weight:normal;color:#64748b;font-size:12px;">${timeStr}</span></div>`);
      }

      // Auto pan smoothly to playback marker
      mapInstanceRef.current.panTo([pt.lat, pt.lng]);

    } else if (playbackIndex < 0 && playbackMarkerInstanceRef.current) {
      try {
        playbackMarkerInstanceRef.current.remove();
      } catch (e) {
        // Ignore if marker/map was already removed by another cleanup path
      }
      playbackMarkerInstanceRef.current = null;
      // Re-pan to live marker upon exit
      if (jobLocation?.latitude && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([jobLocation.latitude, jobLocation.longitude]);
      }
    }
  }, [playbackIndex, routeTrail, jobLocation]);

  // Helper functions for Tracking Health (Phase 6)
  const getTrackingHealth = () => {
    const isTrackingActive = jobLocation?.trackingActive !== undefined ? jobLocation.trackingActive : job?.trackingActive;

    if (!jobLocation?.lastLocationUpdate) {
      return { label: "Waiting", color: "text-slate-500 bg-slate-500/10", seconds: null };
    }

    const lastSeen = (() => {
      let ts = jobLocation.lastLocationUpdate;
      let parsed = ts;
      if (typeof ts === 'string' && ts.includes(' ') && !ts.includes('T')) {
        parsed = ts.replace(' ', 'T') + (ts.endsWith('Z') ? '' : 'Z');
      }
      return new Date(parsed);
    })();

    const secondsSinceUpdate = Math.floor((now - lastSeen) / 1000);

    // Internal Debug: console.log(`[Health] Seconds: ${secondsSinceUpdate}, Active: ${isTrackingActive}`);    
    if (!isTrackingActive) {
      return { label: "Stopped", color: "text-slate-500 bg-slate-500/10", seconds: secondsSinceUpdate };
    }

    if (secondsSinceUpdate > 45) {
      return {
        label: "Delayed",
        color: "text-amber-500 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
        seconds: secondsSinceUpdate
      };
    }

    return {
      label: "Live",
      color: "text-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      seconds: secondsSinceUpdate
    };
  };

  const formatLastSeen = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return 'N/A';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatSafeTime = (value, options = { hour: '2-digit', minute: '2-digit' }) => {
    if (!value) return 'N/A';
    let parsed = value;
    if (typeof parsed === 'string' && parsed.includes(' ') && !parsed.includes('T')) {
      parsed = parsed.replace(' ', 'T') + (parsed.endsWith('Z') ? '' : 'Z');
    }
    const date = new Date(parsed);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString([], options);
  };

  if (!job) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-brand-cyan hover:underline text-sm">← Go Back</button>
      </div>
    </div>
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // --- Permissions ---
  const canEditProgress = role === 'manager' || role === 'technician'
  const canChangeStatus = role === 'manager' || role === 'technician'
  const canAssign = role === 'manager'
  const canDelete = role === 'admin'
  const canUploadPhotos = role === 'manager' || role === 'technician'
  const jobPhotos = Array.isArray(job.photos) ? job.photos : []
  const jobNotes = Array.isArray(job.notes) ? job.notes : []
  const jobFiles = Array.isArray(job.files) ? job.files : []
  const jobHistory = Array.isArray(job.history) ? job.history : []
  const canAddNotes = role === 'manager' || role === 'technician'
  const canConvert = role === 'admin'
  const canCancel = role === 'admin' || role === 'manager'
  const isViewOnly = role === 'customer'
  const roleKey = String(role || '').toLowerCase()
  const canSubmitSignatures = roleKey === 'technician' || roleKey === 'customer'
  const showStartSignaturePad = roleKey === 'technician' || (roleKey === 'customer' && !job.startSignature)
  const showEndSignaturePad = roleKey === 'technician' || (roleKey === 'customer' && !job.endSignature)
  const hasStartSignatureSaved =
    typeof job?.startSignature === 'string' && job.startSignature.trim().length > 0

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

  const goBack = () => {
    if (role === 'manager') navigate('/dashboard/manager/jobs')
    else if (role === 'technician') navigate('/dashboard/tech/daily')
    else if (role === 'customer') navigate('/dashboard/portal')
    else navigate('/dashboard/jobs')
  }

  const steps = [
    { label: 'Pending', done: job.progress >= 0 && job.status !== 'Pending' || job.progress > 0 },
    { label: 'En Route', done: job.progress >= 20 },
    { label: 'On Site', done: job.progress >= 40 },
    { label: 'In Progress', done: job.progress >= 60 },
    { label: 'Completed', done: job.progress >= 100 },
  ]

  const statusColors = {
    'Pending': 'text-amber-400 bg-amber-400/10',
    'En Route': 'text-blue-400 bg-blue-400/10',
    'On Site': 'text-cyan-400 bg-cyan-400/10',
    'In Progress': 'text-purple-400 bg-purple-400/10',
    'Completed': 'text-emerald-400 bg-emerald-400/10',
    'Cancelled': 'text-rose-400 bg-rose-400/10',
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    const author = authUser?.name || 'System'
    addNote(id, newNote, author)
    setNewNote('')
    showToast('Note added successfully')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      addFile(id, { name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB' })
      showToast('File attached successfully')
    }
  }

  const handleJobPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = hotToast.loading('Uploading photo...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const uploadedFileName = uploadRes?.data?.file?.filename
      if (!uploadedFileName) throw new Error('Upload succeeded but no filename returned')

      await addPhoto(id, uploadedFileName)
      hotToast.success('Photo uploaded', { id: toastId })
    } catch (err) {
      hotToast.error('Failed to upload photo', { id: toastId })
    } finally {
      e.target.value = ''
    }
  }

  const handleConvert = () => {
    convertToInvoice(id, role)
    showToast('Job converted to invoice successfully')
    setTimeout(() => navigate('/dashboard/invoices'), 1000)
  }

  const handleAction = (type, person) => {
    showToast(`${type}ing ${person}...`)
  }

  const confirmDelete = () => {
    deleteJob(id)
    navigate('/dashboard/jobs')
  }

  const handleCancelJob = () => {
    cancelJob(id, role)
    showToast('Job has been cancelled', 'warning')
  }

  const handleStartSignatureSubmit = async () => {
    if (!startSignature.trim()) return
    setSavingStartSignature(true)
    try {
      await api.post(`/jobs/${backendJobId}/start-signature`, { signature: startSignature.trim() })
      await syncJobById(id)
      await fetchJobs()
      setStartSignature('')
      showToast('Start signature saved successfully')
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save start signature', 'warning')
    } finally {
      setSavingStartSignature(false)
    }
  }

  const handleEndSignatureSubmit = async () => {
    if (!endSignature.trim()) return
    setSavingEndSignature(true)
    try {
      await api.post(`/jobs/${backendJobId}/end-signature`, { signature: endSignature.trim() })
      await fetchJobs()
      setEndSignature('')
      showToast('Completion signature saved successfully')
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save completion signature', 'warning')
    } finally {
      setSavingEndSignature(false)
    }
  }

  const tabs = role === 'customer'
    ? ['Overview', 'Photos', 'Updates']
    : ['Overview', 'Photos', 'Notes', 'History']

  return (
    <div className="space-y-8 pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200]">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
            {toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group py-1">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Jobs
        </button>
        <div className="flex gap-2 sm:gap-3 items-center flex-wrap w-full md:w-auto">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${role === 'admin' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
            role === 'manager' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' :
              role === 'technician' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' :
                'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
            }`}>
            <Shield size={10} />{role}
          </span>

          {canConvert && !job.isInvoiced && (
            <button onClick={handleConvert} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[11px] font-bold hover:bg-white/10 transition-all">
              <FileText size={14} /> Convert
            </button>
          )}

          {(role === 'admin' || role === 'manager') && (
            <button
              onClick={() => navigate(`/dashboard/jobs/${id}/financials`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[11px] font-bold hover:bg-brand-cyan/20 transition-all"
            >
              <DollarSign size={14} /> Financials
            </button>
          )}

          {job.isInvoiced && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 size={14} /> Invoiced
            </span>
          )}

          {canCancel && job.status !== 'Cancelled' && (
            <button onClick={() => setShowCancelConfirm(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 text-[11px] font-bold hover:bg-rose-500/10 transition-all">
              <X size={14} /> Cancel
            </button>
          )}

          {canDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500 text-white text-[11px] font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-all">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info Card */}
          <GlassCard className="p-5 sm:p-8" hover={false}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Wrench className="text-brand-cyan" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{job.id}</h1>
                    {canChangeStatus ? (
                      <select
                        value={job.status}
                        onChange={e => updateStatus(id, e.target.value, role)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border focus:outline-none cursor-pointer ${statusColors[job.status] || 'text-slate-400 bg-slate-400/10'} border-white/10 appearance-none [&>option]:bg-slate-900`}
                      >
                        {['Pending', 'En Route', 'On Site', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                          <option
                            key={s}
                            value={s}
                            disabled={s === 'In Progress' && !hasStartSignatureSaved && job.status !== 'In Progress'}
                            className="bg-slate-900 text-white"
                          >
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[job.status] || 'text-slate-400 bg-slate-400/10'}`}>
                        {job.status}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 mt-1 uppercase text-xs font-bold tracking-widest leading-relaxed">{job.title}</p>
                </div>
              </div>
              <div className="text-left lg:text-right w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">Priority Level</p>
                <div className="flex items-center lg:justify-end gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${job.priority === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : job.priority === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-500'}`} />
                  <p className={`font-bold tracking-tight ${job.priority === 'High' ? 'text-rose-400' : job.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>{job.priority} Priority</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400 group"><Users size={18} /> <span className="text-sm font-bold uppercase tracking-widest group-hover:text-brand-cyan transition-colors">Customer</span></div>
                <div>
                  <p className="text-white font-bold">{job.customer}</p>
                  <p className="text-sm text-slate-500 mt-1 flex items-start gap-1"><MapPin size={12} className="mt-1 flex-shrink-0" /> <span className="leading-tight">{job.address || 'No address specified'}</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400 group"><Clock size={18} /> <span className="text-sm font-bold uppercase tracking-widest group-hover:text-brand-cyan transition-colors">Scheduled</span></div>
                <div>
                  <p className="text-white font-bold">{job.date}</p>
                  <p className="text-sm text-slate-500 mt-1">{job.scheduledTime || 'Scheduled'}</p>
                </div>
              </div>
              <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 text-slate-400 group"><Phone size={18} /> <span className="text-sm font-bold uppercase tracking-widest group-hover:text-brand-cyan transition-colors">Contact</span></div>
                <div>
                  <p className="text-white font-bold">{job.phone || ''}</p>
                  <p className="text-sm text-slate-500 mt-1 truncate">{job.email || ''}</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex gap-8 border-b border-white/5 px-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-brand-cyan' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan" />}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'Overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <GlassCard hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white tracking-tight">Job Progress</h3>
                    <span className="text-2xl font-bold text-brand-cyan">{job.progress}%</span>
                  </div>
                  <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden mb-2 group">
                    {/* Visual Bar */}
                    <div
                      style={{ width: `${job.progress}%` }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-teal to-brand-cyan rounded-full transition-all duration-300"
                    />

                    {/* Invisible Interactive Overlay (if allowed) */}
                    {canEditProgress && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={job.progress}
                        onChange={e => updateProgress(id, parseInt(e.target.value), role)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">
                      {canEditProgress ? 'Tap or drag anywhere on bar to update' : (isViewOnly ? 'Progress managed by service team' : 'View-only access')}
                    </p>
                    {canEditProgress && <span className="text-[10px] text-brand-cyan/60 font-mono italic">Status auto-syncs</span>}
                  </div>
                  <div className="mt-8 relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/5" />
                    <div className="space-y-6">
                      {steps.map((step) => (
                        <div key={step.label} className="flex gap-6 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step.done ? 'bg-brand-cyan border-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-900 border-white/10'
                            }`}>
                            {step.done ? <CheckCircle2 size={16} className="text-slate-900" /> : <Circle size={16} className="text-slate-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.label}</h4>
                            <p className="text-xs text-slate-600 mt-0.5 font-bold tracking-widest uppercase">{step.done ? 'Completed' : 'Pending'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* PHOTOS TAB */}
            {activeTab === 'Photos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {canUploadPhotos && (
                    <label className="aspect-square rounded-[20px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 hover:border-brand-cyan/30 transition-all text-slate-500 hover:text-white group">
                      <input type="file" className="hidden" accept="image/*" onChange={handleJobPhotoUpload} />
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-cyan group-hover:text-slate-900 transition-all"><Upload size={24} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest">Upload Photo</span>
                    </label>
                  )}
                  {jobPhotos.map((url, i) => {
                    const uploadsBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
                      .replace('/api', '') + '/uploads/'
                    const resolvedUrl = (typeof url === 'string' && url.startsWith('http')) ? url : `${uploadsBase}${url}`
                    return (
                      <div key={resolvedUrl} className="aspect-square rounded-[20px] overflow-hidden relative group border border-white/5 hover:border-brand-cyan/30 transition-all shadow-lg">
                        <img
                          src={resolvedUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = jobPhotoPlaceholder; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 sm:p-4">
                          <div className="flex justify-between items-center">
                            <button onClick={() => setPreview(resolvedUrl)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 text-white"><ZoomIn size={16} /></button>
                            {canUploadPhotos && <button onClick={() => removePhoto(id, i)} className="p-2 bg-rose-500/20 backdrop-blur-md rounded-lg hover:bg-rose-500 text-rose-400 hover:text-white"><Trash2 size={16} /></button>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'Notes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {canAddNotes && (
                  <GlassCard className="border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/5 to-transparent" hover={false}>
                    <h3 className="font-bold text-white mb-4 tracking-tight">Add a Note</h3>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-slate-300 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 resize-none text-sm" placeholder="Write a note about this job..." />
                    <div className="mt-3 flex justify-end">
                      <GradientButton onClick={handleAddNote} className="py-2"><Plus size={16} /> Add Note</GradientButton>
                    </div>
                  </GlassCard>
                )}
                <div className="space-y-4">
                  {jobNotes.map(note => (
                    <div key={note.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-white">{note.by}</span>
                        <span className="text-[10px] font-mono text-slate-600 uppercase font-bold tracking-widest">{note.date} • {note.time}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPDATES TAB (Customer) */}
            {activeTab === 'Updates' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {jobNotes.map(note => (
                  <div key={note.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan"><MessageSquare size={16} /></div>
                    <div>
                      <p className="text-sm text-white font-medium">{note.text}</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">by {note.by} • {note.date} at {note.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'History' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {jobHistory.length > 0 ? jobHistory.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${event.type === 'status' ? 'text-brand-cyan' :
                      event.type === 'assignment' ? 'text-purple-400' :
                        event.type === 'invoice' ? 'text-emerald-400' :
                          event.type === 'warning' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                      {event.type === 'status' ? <Clock size={16} /> :
                        event.type === 'assignment' ? <Users size={16} /> :
                          event.type === 'invoice' ? <FileText size={16} /> :
                            <AlertCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{event.action}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-widest">by {event.by} • {event.date} at {event.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-slate-500 italic text-sm">No history recorded yet.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Technician Contact Card */}
          <GlassCard hover={false} className="p-6">
            <h3 className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">Technician Assigned</h3>
            {canAssign ? (
              <div className="space-y-4">
                <select value={job.technicianId || "Unassigned"} onChange={e => assignTechnician(id, e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none appearance-none [&>option]:bg-slate-900">
                  <option value="Unassigned">Unassigned</option>
                  {job.technician === 'Internal' && <option value="Internal">Internal</option>}
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {job.technician !== 'Unassigned' && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Avatar name={job.technician} className="w-12 h-12 rounded-xl bg-slate-800" />
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{job.technician}</h4>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleAction('Call', job.technician)} className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan hover:bg-brand-cyan transition-all hover:text-slate-900"><Phone size={14} /></button>
                        <button onClick={() => handleAction('SMS', job.technician)} className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple hover:bg-brand-purple transition-all hover:text-white"><MessageSquare size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-cyan p-0.5">
                  <Avatar name={job.technician} className="w-full h-full object-cover rounded-[10px]" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{job.technician}</h4>
                  {job.technician !== 'Unassigned' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAction('Call', job.technician)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-all"><Phone size={14} /></button>
                      <button onClick={() => handleAction('SMS', job.technician)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-brand-purple hover:bg-brand-purple/10 transition-all"><MessageSquare size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h3 className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">Customer Signatures</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-white mb-1">Start Job Signature</p>
                {job.startSignature ? (
                  isSignatureImageDataUrl(job.startSignature) ? (
                    <img
                      src={job.startSignature}
                      alt="Start signature"
                      className="max-h-24 rounded-lg border border-white/10 bg-white p-1 mb-2"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 mb-2">{job.startSignature}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-500 mb-2">No start signature yet</p>
                )}
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-3">
                  Signed At: {formatSignatureDate(job.startSignedAt)}
                </p>
                {canSubmitSignatures && showStartSignaturePad && (
                  <div className="space-y-2">
                    {roleKey === 'technician' && (
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Have the customer draw here on this device before work begins
                        {job.startSignature ? ' (submitting replaces the saved start signature).' : '.'}
                      </p>
                    )}
                    <SignaturePadField
                      value={startSignature}
                      onChange={setStartSignature}
                      height={120}
                    />
                    <button
                      type="button"
                      onClick={handleStartSignatureSubmit}
                      disabled={savingStartSignature || !startSignature.trim()}
                      className="w-full py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold hover:bg-brand-cyan/20 disabled:opacity-50"
                    >
                      {savingStartSignature ? 'Saving...' : 'Submit Start Signature'}
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-bold text-white mb-1">Complete Job Signature</p>
                {job.endSignature ? (
                  isSignatureImageDataUrl(job.endSignature) ? (
                    <img
                      src={job.endSignature}
                      alt="Completion signature"
                      className="max-h-24 rounded-lg border border-white/10 bg-white p-1 mb-2"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 mb-2">{job.endSignature}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-500 mb-2">No completion signature yet</p>
                )}
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-3">
                  Signed At: {formatSignatureDate(job.endSignedAt)}
                </p>
                {canSubmitSignatures && showEndSignaturePad && (
                  <div className="space-y-2">
                    {roleKey === 'technician' && (
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Have the customer draw here after work is finished
                        {job.endSignature ? ' (submitting replaces the saved completion signature).' : '.'}
                      </p>
                    )}
                    <SignaturePadField
                      value={endSignature}
                      onChange={setEndSignature}
                      height={120}
                    />
                    <button
                      type="button"
                      onClick={handleEndSignatureSubmit}
                      disabled={savingEndSignature || !endSignature.trim()}
                      className="w-full py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold hover:bg-brand-cyan/20 disabled:opacity-50"
                    >
                      {savingEndSignature ? 'Saving...' : 'Submit Completion Signature'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Job Location Map Section with Presence and Health */}
          <GlassCard hover={false} className="p-6 border-brand-cyan/20 bg-gradient-to-br from-brand-cyan/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-brand-cyan" /> Live Tracking
                    </h3>
                    <div className="mt-2 flex items-center gap-3">
                      {jobLocation?.latitude ? (() => {
                        const health = getTrackingHealth();
                        return (
                          <>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5 ${health.color}`}>
                              {health.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Last Seen: <span className={health.seconds !== null && health.seconds < 10 ? 'text-emerald-400' : 'text-slate-300'}>
                                {formatLastSeen(health.seconds)}
                              </span>
                            </span>
                          </>
                        );
                      })() : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Live tracking not started yet
                        </span>
                      )}
                    </div>
                  </div>
                  {jobLocation?.lastLocationUpdate && (
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      {new Date(jobLocation.lastLocationUpdate).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {routeTrail.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl mb-4 shadow-lg backdrop-blur-sm">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${isPlaying ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30'}`}
                        title={isPlaying ? 'Pause Playback' : 'Play Route History'}
                      >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                      </button>

                      <button
                        onClick={() => { setIsPlaying(false); setPlaybackIndex(-1); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20 shadow-md"
                        title="Reset Playback"
                      >
                        <Square size={14} fill="currentColor" />
                      </button>

                      <div className="flex-1 flex flex-col justify-center sm:border-l border-white/10 sm:pl-4 py-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-widest">Route Playback</span>
                          <span className="text-[11px] font-mono font-bold text-brand-cyan">
                            {playbackIndex >= 0 ? `${playbackIndex + 1} / ${routeTrail.length}` : `${routeTrail.length} Points Recorded`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 border border-white/10 h-2.5 rounded-full mt-2.5 overflow-hidden">
                          {playbackIndex >= 0 && routeTrail[playbackIndex] ? (
                            <div 
                              style={{ width: `${((playbackIndex + 1) / routeTrail.length) * 100}%` }}
                              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
                            />
                          ) : (
                            <div className="h-full bg-slate-800" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 z-0 shadow-inner mt-2">
                    <div
                      ref={mapRef}
                      className="h-full w-full"
                      style={{ backgroundColor: '#0f172a' }}
                    />
                    {!jobLocation?.latitude && (
                      <div className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          Live tracking not started yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>


          {/* Financing Info */}
          <GlassCard hover={false} className="p-6 border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-slate-500 uppercase font-bold tracking-widest">Financing Status</h3>
              <DollarSign size={14} className="text-brand-purple" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Application</span>
                <span className={`text-xs font-bold ${!customerFinancing ? 'text-slate-500' :
                  customerFinancing.status === 'Approved' ? 'text-emerald-400' :
                    customerFinancing.status === 'Pending' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                  {!customerFinancing ? 'None' : customerFinancing.status}
                </span>
              </div>
              {customerFinancing && customerFinancing.status === 'Approved' ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Approved Funds</p>
                  <p className="text-lg font-bold text-white">${Number(customerFinancing.amount || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{customerFinancing.provider} • {customerFinancing.apr} APR</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => window.alert('Funding process initiated')}
                      className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                    >
                      Apply Funds
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/financing')}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                    >
                      View Agreement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-brand-purple/10 border border-brand-purple/20 mt-2">
                  <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest mb-1">PROMOTION</p>
                  <p className="text-xs font-bold text-white">0% APR for 12 Months</p>
                  <button
                    onClick={() => navigate('/dashboard/financing')}
                    className="mt-2 text-[10px] font-bold text-brand-purple hover:text-white transition-colors flex items-center gap-1"
                  >
                    Apply for Financing <ArrowRight size={10} />
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6"><X size={32} className="text-amber-500" /></div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Cancel Job?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">Are you sure you want to cancel <span className="text-brand-cyan font-bold">{job.id}</span>? History and notes will be preserved.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm">Back</button>
              <button onClick={() => { handleCancelJob(); setShowCancelConfirm(false); }} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 text-sm">Cancel Job</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6"><Trash2 size={32} className="text-rose-500" /></div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Delete Job?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">You are about to delete <span className="text-brand-cyan font-bold">{job.id}</span>. This action cannot be reversed.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-6 rounded-xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20 text-sm active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-12 right-0 text-white hover:text-rose-400 transition-colors"><X size={32} /></button>
            <img src={preview} alt="" className="w-full h-auto rounded-3xl border border-white/10 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
