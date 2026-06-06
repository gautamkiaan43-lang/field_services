import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Clock, X } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { useJobs } from '../../context/JobsContext'
import { useNavigate } from 'react-router-dom'
import CalendarEventModal from './CalendarEventModal'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

export default function CalendarView() {
  const { jobs } = useJobs()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('Month')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [dbEvents, setDbEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/calendar/events')
      setDbEvents(res.data)
    } catch (error) {
      toast.error('Failed to fetch calendar events')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []

    // Add prev month empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateString: null, currentMonth: false })
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const yearStr = year;
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateString = `${yearStr}-${monthStr}-${dayStr}`;
      days.push({ day: i, dateString, currentMonth: true })
    }

    // Add next month empty cells
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        days.push({ day: null, dateString: null, currentMonth: false })
      }
    }

    return days
  }

  const getDaysInWeek = (date) => {
    const current = new Date(date)
    const day = current.getDay() // 0-6
    const diff = current.getDate() - day // Sunday
    const startOfWeek = new Date(current.setDate(diff))

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateString = `${yearStr}-${monthStr}-${dayStr}`;
      days.push({ day: d.getDate(), dateString, currentMonth: true })
    }
    return days
  }

  const calendarDays = viewMode === 'Month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate)

  const handlePrev = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const prev = new Date(currentDate)
      prev.setDate(prev.getDate() - 7)
      setCurrentDate(prev)
    }
  }

  const handleNext = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + 7)
      setCurrentDate(next)
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const today = new Date()
  const isToday = (dateString) => {
    if (!dateString) return false
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}` === dateString
  }

  const getDayJobs = (dateString) => {
    if (!dateString) return []
    // System jobs from context
    const systemJobs = (jobs || []).filter(job => job.date === dateString)

    // Real calendar events from DB
    const manualEvents = dbEvents.filter(event => {
      if (!event.date) return false;
      try {
        // More robust comparison - strip time manually
        const d = new Date(event.date);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === dateString;
      } catch (err) {
        return false;
      }
    }).map(e => ({
      ...e,
      id: `EV-${e.id}`, // Add a prefix for manual events
      customer: e.customer?.name || e.title,
      isManual: true
    }))
    return [...systemJobs, ...manualEvents]
  }

  const handleSaveEvent = async (eventData) => {
    try {
      await api.post('/calendar/events', eventData)
      setShowEventModal(false)
      fetchEvents() // Refresh from DB
      toast.success('Event scheduled successfully')
    } catch (error) {
      toast.error('Failed to save event to database')
    }
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Calendar</h1>
          <p className="text-slate-400 mt-1">Schedule and manage team dispatched jobs.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handlePrev} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-all text-xs sm:text-sm">
              <ChevronLeft size={16} /> Prev
            </button>
            <button onClick={handleNext} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-all text-xs sm:text-sm">
              Next <ChevronRight size={16} />
            </button>
          </div>
          <GradientButton className="w-full sm:w-auto flex-1 sm:flex-none" onClick={() => setShowEventModal(true)}>
            <Plus size={18} /> New Event
          </GradientButton>
        </div>
      </div>

      <GlassCard className="p-0 sm:p-6 overflow-hidden sm:overflow-visible">
        <div className="flex items-center justify-between p-4 sm:p-0 sm:mb-6 border-b border-white/5 sm:border-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="text-brand-cyan" size={20} />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="hidden sm:flex gap-2">
            <button
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'Month' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setViewMode('Month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'Week' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setViewMode('Week')}
            >
              Week
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar sm:overflow-visible p-4 sm:p-0">
          <div className="min-w-[800px] grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {/* Headers */}
            {daysOfWeek.map(day => (
              <div key={day} className="bg-slate-900 p-4 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</span>
              </div>
            ))}

            {/* Grid */}
            {calendarDays.map((cell, i) => {
              const dayJobs = getDayJobs(cell.dateString)
              const todayFlag = isToday(cell.dateString)

              return (
                <div key={i} className={`min-h-[120px] max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-slate-900 p-2 transition-colors ${cell.currentMonth ? 'hover:bg-white/[0.02]' : 'opacity-50'
                  } ${todayFlag ? 'ring-2 ring-brand-cyan inset-0 z-10 relative bg-brand-cyan/5' : ''}`}>
                  {cell.day && (
                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-1 ${todayFlag ? 'bg-brand-cyan text-slate-900' : 'text-white'
                      }`}>
                      {cell.day}
                    </span>
                  )}

                  <div className="space-y-1">
                    {dayJobs.map((job, idx) => {
                      const isHighPrior = job.priority === 'High'
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedEvent(job)}
                          className={`p-1.5 rounded text-[10px] font-medium leading-tight cursor-pointer shadow-sm ${isHighPrior ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan'
                            } border truncate`}
                          title={`${job.id}: ${job.customer}`}
                        >
                          {job.id} - {job.customer}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${selectedEvent.priority === 'High' ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-brand-teal to-brand-cyan'}`} />
              <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg ${selectedEvent.priority === 'High' ? 'bg-rose-500/10 shadow-rose-500/10' : 'bg-brand-cyan/10 shadow-cyan-500/10'}`}>
                <CalendarIcon className={selectedEvent.priority === 'High' ? 'text-rose-400' : 'text-brand-cyan'} size={24} />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{selectedEvent.id}</h3>
              <p className="text-slate-400 text-sm mb-6">{selectedEvent.customer}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Clock size={16} className="text-slate-500" />
                  <span>{selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <MapPin size={16} className="text-slate-500" />
                  <span>{selectedEvent.address || 'Address not specified'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center mx-px">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                  </div>
                  <span>{selectedEvent.status}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <GradientButton className="flex-1 py-3" onClick={() => navigate(`/dashboard/manager/jobs`)}>
                  View Job Details
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Event Creation Modal */}
      <CalendarEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
      />
    </div>
  )
}
