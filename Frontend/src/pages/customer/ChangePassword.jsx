import React, { useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/auth/change-password', form)
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Change Password</h1>
        <p className="text-slate-400 mt-1">Update your client portal password securely.</p>
      </div>

      <GlassCard className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-widest block">
              Current Password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-widest block">
              New Password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-widest block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20"
              minLength={8}
              required
            />
          </div>

          <div className="pt-2">
            <GradientButton type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Lock size={18} /> Updating...</> : <><Save size={18} /> Update Password</>}
            </GradientButton>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
