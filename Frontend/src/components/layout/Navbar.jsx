import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, User, ChevronDown, Settings as SettingsIcon, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { Avatar } from '../ui/Avatar'
import api from '../../services/api'

export const Navbar = ({ onMenuClick }) => {
  const { role, user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)

  const notificationRef = React.useRef(null)
  const profileRef = React.useRef(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState([])
  const [isSearching, setIsSearching] = React.useState(false)
  const searchRef = React.useRef(null)

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        try {
          const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
          setSearchResults(data)
        } catch (error) {
          console.error('Search failed', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const closeAll = () => {
    setShowNotifications(false)
    setShowProfile(false)
    setSearchQuery('')
  }

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideNotifications = notificationRef.current && !notificationRef.current.contains(event.target);
      const isOutsideProfile = profileRef.current && !profileRef.current.contains(event.target);
      const isOutsideSearch = searchRef.current && !searchRef.current.contains(event.target);

      if (isOutsideNotifications && (!profileRef.current || isOutsideProfile) && isOutsideSearch) {
        closeAll();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getRoleJobDetailPath = (jobId) => {
    if (!jobId) return null
    const formattedJobId = String(jobId).startsWith('JOB-') ? String(jobId) : `JOB-${jobId}`
    if (role === 'manager') return `/dashboard/manager/jobs/${formattedJobId}`
    if (role === 'technician') return `/dashboard/tech/jobs/${formattedJobId}`
    if (role === 'customer') return `/dashboard/portal/job/${jobId}`
    return `/dashboard/jobs/${formattedJobId}`
  }

  const normalizeNotificationPath = (rawPath) => {
    if (!rawPath || typeof rawPath !== 'string') return null

    const [rawBasePath, rawQuery = ''] = rawPath.split('?')
    const basePath = rawBasePath.trim().replace(/^https?:\/\/[^/]+/i, '')
    if (!basePath) return null

    if (basePath.startsWith('/dashboard/')) return rawPath

    const messageMatch = basePath.match(/^\/messages\/([^/?#]+)/i)
    if (messageMatch?.[1]) {
      return `/dashboard/messages?contactId=${encodeURIComponent(messageMatch[1])}${rawQuery ? `&${rawQuery}` : ''}`
    }

    if (/^\/messages(?:\/)?$/i.test(basePath)) {
      return `/dashboard/messages${rawQuery ? `?${rawQuery}` : ''}`
    }

    const jobMatch = basePath.match(/^\/jobs\/([^/?#]+)/i)
    if (jobMatch?.[1]) {
      return getRoleJobDetailPath(jobMatch[1])
    }

    if (/^\/jobs(?:\/)?$/i.test(basePath)) {
      if (role === 'manager') return '/dashboard/manager/jobs'
      if (role === 'technician') return '/dashboard/tech/daily'
      if (role === 'customer') return '/dashboard/portal/history'
      return '/dashboard/jobs'
    }

    if (/^\/leads(?:\/)?$/i.test(basePath)) return '/dashboard/leads'
    if (/^\/invoices(?:\/.*)?$/i.test(basePath)) return '/dashboard/invoices'
    if (/^\/estimates(?:\/.*)?$/i.test(basePath)) return '/dashboard/estimates'

    if (basePath.startsWith('/')) return `/dashboard${basePath}${rawQuery ? `?${rawQuery}` : ''}`
    return `/dashboard/${basePath}${rawQuery ? `?${rawQuery}` : ''}`
  }

  const resolveNotificationPath = (notif) => {
    const normalizedDirectLink = normalizeNotificationPath(notif?.link || notif?.route)
    if (normalizedDirectLink) return normalizedDirectLink

    const type = String(notif?.type || '').toLowerCase()
    const refId = notif?.jobId || notif?.invoiceId || notif?.targetId || notif?.entityId || notif?.referenceId || notif?.idRef

    if (type.includes('job')) {
      const jobId = notif?.jobId || refId
      if (jobId) return getRoleJobDetailPath(jobId)
      if (role === 'manager') return '/dashboard/manager/jobs'
      if (role === 'technician') return '/dashboard/tech/daily'
      if (role === 'customer') return '/dashboard/portal/history'
      return '/dashboard/jobs'
    }

    if (type.includes('invoice')) {
      return '/dashboard/invoices'
    }

    if (type.includes('estimate') || type.includes('approval')) {
      return role === 'customer' ? '/dashboard/portal/approvals' : '/dashboard/estimates'
    }

    if (type.includes('lead')) {
      return '/dashboard/leads'
    }

    if (type.includes('message') || type.includes('chat')) {
      return '/dashboard/messages'
    }

    return '/dashboard'
  }

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id)
    const targetPath = resolveNotificationPath(notif)
    if (targetPath) {
      navigate(targetPath)
    }
    setShowNotifications(false)
  }

  return (
    <div className="h-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 md:gap-6 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg lg:hidden transition-all flex-shrink-0"
        >
          <Menu size={24} />
        </button>
        
        {/* Mobile Search Icon (visible only on small screens) */}
        <button className="p-2 text-slate-400 hover:text-white md:hidden lg:hidden">
          <Search size={20} />
        </button>

        <div className="relative group max-w-md w-full hidden md:block" ref={searchRef}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-brand-cyan' : 'text-slate-500'}`} size={18} />
          <input 
            type="text" 
            placeholder="Search jobs, customers, or invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all text-sm text-white"
          />

          <AnimatePresence>
            {searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
              >
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <div
                        key={`${result.type}-${idx}`}
                        onClick={() => {
                          navigate(result.path)
                          setSearchQuery('')
                        }}
                        className="p-3 rounded-xl hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-cyan transition-colors">
                            <Search size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">
                              {result.title}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{result.type}</p>
                          </div>
                        </div>
                        <ChevronDown size={14} className="text-slate-600 -rotate-90" />
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-xs">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-40">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              const state = !showNotifications;
              closeAll();
              setShowNotifications(state);
            }}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-slate-900 font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute -right-16 sm:right-0 mt-4 w-[300px] sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 text-white"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <h3 className="font-bold">Notifications</h3>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-brand-cyan hover:underline font-bold uppercase tracking-wider"
                      >
                        Mark all as read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-brand-cyan hover:underline font-bold uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell size={32} className="mx-auto text-slate-700 mb-3" />
                      <p className="text-slate-500 text-sm">No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-xl transition-all cursor-pointer border ${notif.isRead ? 'bg-white/[0.02] border-transparent grayscale' : 'bg-brand-cyan/5 border-brand-cyan/10 ring-1 ring-brand-cyan/5'} hover:bg-white/10 group`}
                      >
                        <div className="flex items-center justify-between mb-1">
                           <p className={`text-sm font-bold ${notif.isRead ? 'text-slate-300' : 'text-white'} group-hover:text-brand-cyan transition-colors`}>
                             {notif.title}
                           </p>
                           {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-cyan" />}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{notif.message}</p>
                        <span className="text-[9px] text-slate-500 mt-2 block font-medium">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-white/5 hidden sm:block"></div>

        {/* Profile (Static) */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none whitespace-nowrap">{user?.name || 'User'}</p>
            <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider mt-1">{role}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-brand-cyan/20 p-0.5 relative flex-shrink-0">
            <Avatar
              name={user?.name || role}
              alt="avatar"
              className="w-full h-full rounded-[10px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
