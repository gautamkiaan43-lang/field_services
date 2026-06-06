import React, { useState, useRef } from 'react'
import { Camera, Upload, X, ImageIcon, ZoomIn } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { useJobs } from '../../context/JobsContext'
import { useAuth } from '../../context/AuthContext'

export default function PhotoUpload() {
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const { jobs, fetchJobs } = useJobs()
  const { user } = useAuth()

  const myJobs = jobs.filter(j => j.technicianId === user?.id || j.technician === user?.name)

  const allPhotos = myJobs.flatMap(job =>
    (job.photos || []).map((url, idx) => ({
      id: `${job.id}-${idx}`,

      url: url.startsWith('http') ? url : `https://fieldservicesbackend-production.up.railway.app/uploads/${url}`,
      // url: url.startsWith('http') ? url : `http://localhost:5000/uploads/${url}`,

      name: `Photo ${idx + 1}`,
      job: job.id,
      date: job.date
    }))
  )

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (myJobs.length === 0) {
        toast.error('No jobs assigned to upload photos to.')
        return
      }

      const toastId = toast.loading(`Uploading ${files.length} photo(s)...`)
      try {
        const formData = new FormData()
        formData.append('file', files[0])
        const uploadRes = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const uploadedFileName = uploadRes.data.file.filename

        const targetJob = myJobs.find(j => j.status !== 'Completed') || myJobs[0]

        await api.post(`/jobs/${targetJob.backendId}/photos`, {
          url: uploadedFileName
        })

        await fetchJobs()
        toast.success(`Photo uploaded successfully!`, { id: toastId })
      } catch (err) {
        toast.error('Failed to upload photo', { id: toastId })
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Job Photos</h1>
          <p className="text-slate-400 mt-1">Upload and manage job site photos.</p>
        </div>
        <GradientButton onClick={handleUploadClick}>
          <Upload size={18} /> Upload Photos
        </GradientButton>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Upload Area */}
      <GlassCard
        onClick={handleUploadClick}
        className="border-dashed border-2 border-white/10 hover:border-brand-cyan/30 transition-colors cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center mb-4">
            <Camera size={32} className="text-brand-cyan" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Drag & Drop Photos Here</h3>
          <p className="text-sm text-slate-400 mb-4">or click to browse from your device</p>
          <p className="text-xs text-slate-600">Supports: JPG, PNG, WEBP • Max 10MB per file</p>
        </div>
      </GlassCard>

      {/* Photo Gallery */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="text-brand-purple" size={20} /> Photo Gallery
        </h2>
        {allPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allPhotos.map((photo) => (
              <div key={photo.id} className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-brand-cyan/30 transition-all cursor-pointer" onClick={() => setPreview(photo)}>
                <img src={photo.url} alt={photo.name} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-xs font-bold text-white">{photo.name}</p>
                    <p className="text-[10px] text-slate-400">{photo.job} • {photo.date}</p>
                  </div>
                  <div className="ml-auto">
                    <ZoomIn size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No photos uploaded yet.</p>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-12 right-0 text-white hover:text-rose-400 transition-colors">
              <X size={24} />
            </button>
            <img src={preview.url} alt={preview.name} className="w-full rounded-2xl border border-white/10" />
            <div className="mt-4 text-center">
              <p className="font-bold text-white">{preview.name}</p>
              <p className="text-sm text-slate-400">{preview.job} • {preview.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
