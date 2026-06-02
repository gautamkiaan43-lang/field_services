import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Camera, Upload, CheckCircle2, AlertCircle, X, Image as ImageIcon, Clock, RefreshCcw } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useVerification } from '../../context/VerificationContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function IDVerification() {
  const { user } = useAuth()
  const verificationContent = useVerification()
  const requests = verificationContent?.requests || []
  const submitVerification = verificationContent?.submitVerification
  const approveRequest = verificationContent?.approveRequest

  const [step, setStep] = useState(1)
  const [isRetrying, setIsRetrying] = useState(false)
  const [idPhoto, setIdPhoto] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Check if user already has a pending or approved request
  const existingRequest = requests.find(r => r.userId === (user?.id || 'EMP-102'))
  const activeRequest = isRetrying ? null : existingRequest

  useEffect(() => {
    if (activeRequest && step !== 3) {
      setStep(3)
    }
  }, [activeRequest, step])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera Access Error:', err)
      toast.error('Could not access camera. Please check permissions.')
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const photoData = canvas.toDataURL('image/png')
      setSelfie(photoData)
      stopCamera()
    }
  }

  useEffect(() => {
    if (activeRequest && step !== 3) {
      setStep(3)
    }
  }, [activeRequest, step])

  const handleIdUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setIdPhoto(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSelfieUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSelfie(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsRetrying(false)
      submitVerification({
        userId: user?.id || 'EMP-102',
        userName: user?.name || 'Alex Rivera',
        userRole: user?.role || 'Technician',
        idPhotoUrl: idPhoto,
        selfieUrl: selfie
      })
      setIsSubmitting(false)
      setStep(3)
    }, 1500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-cyan">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Identity Verification</h1>
        <p className="text-slate-400 mt-1">Verify your identity to complete account onboarding.</p>
      </div>

      <div className="flex justify-center gap-10 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-brand-cyan' : 'text-slate-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step === i ? 'border-brand-cyan bg-brand-cyan text-slate-900' :
                step > i ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan' : 'border-slate-800'
              }`}>{step > i ? <CheckCircle2 size={16} /> : i}</div>
            <span className="text-xs font-bold uppercase tracking-widest">{i === 1 ? 'ID Card' : i === 2 ? 'Selfie' : 'Status'}</span>
          </div>
        ))}
      </div>

      <GlassCard className="p-10 text-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <label className="aspect-[1.6/1] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 bg-slate-900/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
                <input type="file" className="hidden" accept="image/*" onChange={handleIdUpload} />
                {idPhoto ? (
                  <img src={idPhoto} className="w-full h-full object-cover" alt="ID Preview" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-cyan transition-all">
                      <Upload size={32} />
                    </div>
                    <div className="text-slate-400">
                      <p className="font-bold">Front of Identity Card</p>
                      <p className="text-xs mt-1">National ID, Passport or License</p>
                    </div>
                  </>
                )}
                {idPhoto && (
                  <button onClick={(e) => { e.preventDefault(); setIdPhoto(null); }} className="absolute top-4 right-4 p-2 bg-rose-500 rounded-xl text-white shadow-lg"><X size={16} /></button>
                )}
              </label>
              <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-amber-500 text-left">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs leading-relaxed">Ensure all details including Name, DOB and Photo are clearly visible without glare.</p>
              </div>
              <GradientButton className="w-full py-4 text-slate-900 font-bold" disabled={!idPhoto} onClick={() => setStep(2)}>
                Capture Selfie
              </GradientButton>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="relative">
                <div className="w-64 h-64 rounded-full border-4 border-brand-cyan/20 mx-auto overflow-hidden relative bg-slate-900 shadow-2xl shadow-brand-cyan/10">
                  {isCameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                  ) : selfie ? (
                    <img src={selfie} className="w-full h-full object-cover" alt="Selfie Preview" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Camera size={48} className="text-slate-700 animate-pulse" />
                    </div>
                  )}
                  
                  {/* Hidden canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Overlays/Controls */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  {!isCameraActive && !selfie ? (
                    <GradientButton className="px-8 py-3 rounded-xl flex items-center gap-2" onClick={startCamera}>
                      <Camera size={18} /> Open Camera
                    </GradientButton>
                  ) : isCameraActive ? (
                    <div className="flex gap-4">
                      <button 
                        className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all flex items-center gap-2"
                        onClick={stopCamera}
                      >
                        Cancel
                      </button>
                      <button 
                        className="px-10 py-3 rounded-xl bg-brand-cyan text-slate-900 font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2"
                        onClick={capturePhoto}
                      >
                        <CheckCircle2 size={18} /> Take Photo
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="text-brand-cyan font-bold flex items-center gap-2 hover:underline"
                      onClick={() => { setSelfie(null); startCamera(); }}
                    >
                      <RefreshCcw size={16} /> Retake Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="max-w-xs mx-auto">
                <h3 className="text-xl font-bold text-white">Face Verification</h3>
                <p className="text-sm text-slate-400 mt-2">Hold your device at eye level. This ensures you are the owner of the ID provided.</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button 
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all" 
                  onClick={() => { stopCamera(); setStep(1); }}
                >
                  Go Back
                </button>
                <GradientButton className="flex-[2] py-4" disabled={!selfie || isSubmitting || isCameraActive} onClick={handleSubmit}>
                  {isSubmitting ? 'Processing...' : 'Submit Documents'}
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 space-y-6">
              {activeRequest?.status === 'APPROVED' ? (
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={40} />
                </div>
              ) : activeRequest?.status === 'REJECTED' ? (
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
                  <X size={40} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full flex items-center justify-center mx-auto text-brand-cyan">
                  <Clock size={40} className="animate-pulse" />
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeRequest?.status === 'APPROVED' ? 'Identity Verified' :
                    activeRequest?.status === 'REJECTED' ? 'Verification Failed' : 'Review in Progress'}
                </h2>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto">
                  {activeRequest?.status === 'APPROVED' ? 'Your account is fully authenticated. You now have access to all system features.' :
                    activeRequest?.status === 'REJECTED' ? `Reason: ${activeRequest.reason}. Please try again with clearer documents.` :
                      'Our team is reviewing your documents. You will be notified once the audit is complete (usually within 24h).'}
                </p>
              </div>

              {activeRequest?.status === 'PENDING' && (
                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-4 italic text-center">Demo Mode</p>
                  <button
                    onClick={() => approveRequest(activeRequest.id)}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-brand-cyan font-bold hover:bg-brand-cyan/10 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Simulate Admin Approval
                  </button>
                </div>
              )}

              {activeRequest?.status === 'REJECTED' && (
                <GradientButton className="w-full py-4 mt-4" onClick={() => { setIsRetrying(true); setIdPhoto(null); setSelfie(null); setStep(1); }}>
                  Retry Verification
                </GradientButton>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  )
}

