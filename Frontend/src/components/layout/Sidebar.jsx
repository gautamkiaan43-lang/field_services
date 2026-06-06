import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, FileText, Receipt, Users,
  Settings, BarChart3, MessageSquare, HelpCircle, LogOut,
  Calendar, Wrench, Clock, Shield, Package, Share2, DollarSign,
  ChevronLeft, ChevronRight, X, History, ClipboardList
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMessages } from '../../context/MessagesContext'

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Leads', path: '/dashboard/leads' },
    { icon: Briefcase, label: 'Jobs', path: '/dashboard/jobs' },
    { icon: FileText, label: 'Estimates', path: '/dashboard/estimates' },
    { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Users, label: 'Customers', path: '/dashboard/customers' },
    { icon: Briefcase, label: 'Employees', path: '/dashboard/employees' },
    { icon: Shield, label: 'Verification', path: '/dashboard/verification' },
    { icon: DollarSign, label: 'Financing', path: '/dashboard/financing' },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    { icon: Package, label: 'Integrations', path: '/dashboard/integrations' },
    { icon: HelpCircle, label: 'AI Assistant', path: '/dashboard/ai-assistant' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  manager: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/manager' },
    { icon: ClipboardList, label: 'Leads', path: '/dashboard/leads' },
    { icon: Briefcase, label: 'Jobs', path: '/dashboard/manager/jobs' },
    { icon: Calendar, label: 'Dispatch', path: '/dashboard/manager/dispatch' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/manager/calendar' },
    { icon: Shield, label: 'Approvals', path: '/dashboard/manager/approvals' },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
  ],
  technician: [
    { icon: Briefcase, label: 'Daily Jobs', path: '/dashboard/tech/daily' },
    { icon: Clock, label: 'Attendance', path: '/dashboard/tech/attendance' },
    { icon: Package, label: 'Photos', path: '/dashboard/tech/photos' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/tech/timesheets' },
    { icon: Wrench, label: 'Materials', path: '/dashboard/tech/materials' },
    { icon: Shield, label: 'Verify Identity', path: '/dashboard/verify-account' },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
  ],
  customer: [
    { icon: Briefcase, label: 'Portal', path: '/dashboard/portal' },
    { icon: History, label: 'Job History', path: '/dashboard/portal/history' },
    { icon: Shield, label: 'Approvals', path: '/dashboard/portal/approvals' },
    { icon: Receipt, label: 'Payments', path: '/dashboard/portal/payments' },
    { icon: Settings, label: 'Change Password', path: '/dashboard/portal/change-password' },
    { icon: HelpCircle, label: 'Support', path: '/dashboard/portal/support' },
  ]
}

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { role, logout } = useAuth()
  const { unreadCount } = useMessages()
  const items = menuItems[role] || []

  const sidebarClasses = `
    h-screen bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-2xl border-r border-white/5 
    flex flex-col fixed top-0 z-50 transition-all duration-300
    ${isCollapsed ? 'w-20' : 'w-60'}
    ${isMobileMenuOpen ? 'left-0' : '-left-full lg:left-0'}
  `

  return (
    <div className={sidebarClasses}>
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/5 mb-2`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="min-w-[40px] w-10 h-10 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-white" size={20} />
          </div>
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
            className="whitespace-nowrap overflow-hidden"
          >
            <h2 className="font-bold text-white tracking-tight leading-none text-sm">FieldSync</h2>
            <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider mt-1">Dashboard</p>
          </motion.div>
        </div>

        {/* Toggle Button - Desktop Only */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Close Button - Mobile Only */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2.5 rounded-xl bg-white/5 text-white border border-white/10 shadow-lg active:scale-95 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {isCollapsed && (
        <div className="hidden lg:flex justify-center p-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all shadow-lg shadow-cyan-500/10"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {items.map((item) => {
          const isMessages = item.label === 'Messages' || item.label === 'Support';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/dashboard/manager' || item.path === '/dashboard/portal'}
              onClick={() => setIsMobileMenuOpen(false)}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                ${isCollapsed ? 'lg:justify-center' : ''}
              `}
            >
              <item.icon size={20} className="min-w-[20px] transition-transform group-hover:scale-110" />

              {!isCollapsed && (
                <motion.span
                  initial={false}
                  animate={{
                    opacity: 1,
                    width: 'auto',
                    display: 'block'
                  }}
                  className="font-medium whitespace-nowrap text-sm flex-1"
                >
                  {item.label}
                </motion.span>
              )}

              {isMessages && unreadCount > 0 && (
                <div className={`
                  ${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}
                  min-w-[18px] h-[18px] px-1 bg-brand-cyan rounded-full flex items-center justify-center 
                  text-[10px] font-bold text-slate-900 shadow-[0_0_10px_rgba(34,211,238,0.4)] animate-pulse
                `}>
                  {unreadCount}
                </div>
              )}
            </NavLink>
          );
        })}

      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
            text-rose-400 hover:bg-rose-500/10 group
            ${isCollapsed ? 'lg:justify-center' : ''}
          `}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} className="min-w-[20px] group-hover:rotate-12 transition-transform" />
          <motion.span
            initial={false}
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : 'auto',
              display: isCollapsed ? 'none' : 'block'
            }}
            className="font-medium whitespace-nowrap text-sm"
          >
            Logout
          </motion.span>
        </button>
      </div>
    </div>
  )
}
