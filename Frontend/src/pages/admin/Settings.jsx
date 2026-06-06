import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Shield, Bell, Palette, Globe, Save, Loader2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

function Toggle({ label, desc, on, toggle }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={toggle} 
        className={`w-12 h-7 rounded-full transition-all relative ${on ? 'bg-brand-cyan' : 'bg-slate-700'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [settings, setSettings] = useState({
    companyName: '',
    businessEmail: '',
    phoneNumber: '',
    businessName: '',
    logoUrl: '',
    businessPhone: '',
    businessContactEmail: '',
    businessAddress: '',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyDigest: false,
    adminFullAccess: true,
    managerDispatch: true,
    technicianField: true,
    customerPortal: true,
    twoFactorAuth: false,
    sessionTimeout: true,
    ipWhitelisting: false,
    facebookUrl: '',
    instagramUrl: '',
    websiteUrl: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleSetting = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSave = async () => {
    setSaving(true)
    const toastId = toast.loading('Saving preferences...')
    
    try {
      // Remove ID and timestamps before sending to avoid Prisma issues
      const { id, updatedAt, ...payload } = settings
      const {
        businessName,
        logoUrl,
        businessPhone,
        businessContactEmail,
        businessAddress,
        ...generalPayload
      } = payload

      const [response, businessResponse] = await Promise.all([
        api.put('/settings', generalPayload),
        api.put('/settings/business', {
          businessName,
          logoUrl,
          businessPhone,
          businessContactEmail,
          businessAddress
        })
      ])
      
      if (response.data.success) {
        toast.success('Settings saved successfully!', { id: toastId })
        setSettings(prev => ({
          ...prev,
          ...response.data.data,
          ...(businessResponse?.data?.data || {})
        }))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      event.target.value = ''
      return
    }

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('logo', file)

    try {
      const response = await api.post('/settings/business/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const uploadedLogoUrl = response?.data?.data?.logoUrl
      if (uploadedLogoUrl) {
        setSettings(prev => ({ ...prev, logoUrl: uploadedLogoUrl }))
        toast.success('Logo uploaded successfully')
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to upload logo'
      toast.error(message)
    } finally {
      setUploadingLogo(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-cyan" />
        <p className="text-sm font-medium animate-pulse uppercase tracking-[0.2em]">Synchronizing System Preferences...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1">Configure system preferences and role permissions.</p>
        </div>
        <div className="w-full sm:w-auto">
          <GradientButton 
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Settings */}
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="text-brand-cyan" size={18} /> Role Permissions
          </h2>
          <div className="space-y-3">
            <Toggle 
              label="Admin — Full Access" 
              desc="Can manage all modules, settings, and users." 
              on={settings.adminFullAccess} 
              toggle={() => toggleSetting('adminFullAccess')}
            />
            <Toggle 
              label="Manager — Dispatch & Approvals" 
              desc="Can assign jobs, approve estimates, view reports." 
              on={settings.managerDispatch} 
              toggle={() => toggleSetting('managerDispatch')}
            />
            <Toggle 
              label="Technician — Field Access" 
              desc="Can view assigned jobs, upload photos, log time." 
              on={settings.technicianField} 
              toggle={() => toggleSetting('technicianField')}
            />
            <Toggle 
              label="Customer — Portal Access" 
              desc="Can view job status, approve estimates, make payments." 
              on={settings.customerPortal} 
              toggle={() => toggleSetting('customerPortal')}
            />
          </div>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Bell className="text-brand-purple" size={18} /> Notifications
          </h2>
          <div className="space-y-3">
            <Toggle 
              label="Email Notifications" 
              desc="Send email alerts for new jobs and estimates." 
              on={settings.emailNotifications} 
              toggle={() => toggleSetting('emailNotifications')}
            />
            <Toggle 
              label="SMS Notifications" 
              desc="Send text message alerts for urgent updates." 
              on={settings.smsNotifications} 
              toggle={() => toggleSetting('smsNotifications')}
            />
            <Toggle 
              label="Push Notifications" 
              desc="In-app push notifications for real-time updates." 
              on={settings.pushNotifications} 
              toggle={() => toggleSetting('pushNotifications')}
            />
            <Toggle 
              label="Daily Digest" 
              desc="Send a summary email at end of each business day." 
              on={settings.dailyDigest} 
              toggle={() => toggleSetting('dailyDigest')}
            />
          </div>
        </GlassCard>

        {/* Company Info */}
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="text-emerald-400" size={18} /> Company Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Company Name</label>
              <input 
                value={settings.companyName} 
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Business Email</label>
              <input 
                value={settings.businessEmail} 
                onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Phone Number</label>
              <input 
                value={settings.phoneNumber} 
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Business Name</label>
              <input
                value={settings.businessName || ''}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Logo Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-cyan/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-cyan hover:file:bg-brand-cyan/30"
              />
              {uploadingLogo && (
                <p className="text-xs text-brand-cyan mt-2">Uploading logo...</p>
              )}
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Business logo preview"
                  className="mt-3 h-14 w-14 rounded-xl object-cover border border-white/10 bg-slate-900"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Business Phone</label>
              <input
                value={settings.businessPhone || ''}
                onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Business Email</label>
              <input
                value={settings.businessContactEmail || ''}
                onChange={(e) => handleInputChange('businessContactEmail', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Business Address</label>
              <textarea
                value={settings.businessAddress || ''}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              />
            </div>
          </div>
        </GlassCard>

        {/* Social Media Links */}
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="text-blue-400" size={18} /> Social Media Links
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Facebook URL</label>
              <input 
                value={settings.facebookUrl || ''} 
                onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Instagram URL</label>
              <input 
                value={settings.instagramUrl || ''} 
                onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/yourpage"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 block">Website URL</label>
              <input 
                value={settings.websiteUrl || ''} 
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20" 
              />
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  )
}
