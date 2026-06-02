import React from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export const MainLayout = ({ children }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden flex">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        flex flex-col h-screen flex-1 transition-all duration-300 overflow-x-hidden
        ${isCollapsed ? 'lg:pl-20' : 'lg:pl-60'}
      `}>
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
