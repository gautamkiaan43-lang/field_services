import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { JobsProvider } from './context/JobsContext'
import { CustomersProvider } from './context/CustomersContext'
import { EmployeesProvider } from './context/EmployeesContext'
import { EstimatesProvider } from './context/EstimatesContext'
import { InvoicesProvider } from './context/InvoicesContext'
import { MaterialsProvider } from './context/MaterialsContext'
import { FinancingProvider } from './context/FinancingContext'
import { VerificationProvider } from './context/VerificationContext'
import { ReviewsProvider } from './context/ReviewsContext'
import { MessagesProvider } from './context/MessagesContext'
import { NotificationProvider } from './context/NotificationContext'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import { MainLayout } from './components/layout/MainLayout'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import JobsList from './pages/admin/JobsList'
import JobDetails from './pages/admin/JobDetails'
import EstimatesList from './pages/admin/EstimatesList'
import CreateEstimate from './pages/admin/CreateEstimate'
import Communication from './pages/admin/Communication'
import InvoicesList from './pages/admin/InvoicesList'
import Financing from './pages/admin/Financing'
import IDVerification from './pages/admin/IDVerification'
import AccountVerification from './pages/admin/AccountVerification'
import Customers from './pages/admin/Customers'
import Employees from './pages/admin/Employees'
import Reports from './pages/admin/Reports'
import Integrations from './pages/admin/Integrations'
import Settings from './pages/admin/Settings'
import AIAssistant from './pages/admin/AIAssistant'

// Leads Module
import LeadsListPage from './modules/leads/LeadsListPage'
import LeadDetailPage from './modules/leads/LeadDetailPage'
import PublicLeadIntakePage from './modules/leads/PublicLeadIntakePage'

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerJobs from './pages/manager/ManagerJobs'
import Dispatch from './pages/manager/Dispatch'
import CalendarView from './pages/manager/CalendarView'
import Approvals from './pages/manager/Approvals'

// Technician Pages
import DailyJobs from './pages/technician/DailyJobs'
import Attendance from './pages/technician/Attendance'
import PhotoUpload from './pages/technician/PhotoUpload'
import Timesheets from './pages/technician/Timesheets'
import PartsAndMaterials from './pages/technician/PartsAndMaterials'

// Customer Pages
import CustomerPortal from './pages/customer/Portal'
import JobHistory from './pages/customer/JobHistory'
import CustomerApprovals from './pages/customer/CustomerApprovals'
import Payments from './pages/customer/Payments'
import Support from './pages/customer/Support'
import JobDetail from './pages/customer/JobDetail'
import ChangePassword from './pages/customer/ChangePassword'

import PaymentAllocation from './components/ui/PaymentAllocation'
import JobFinancialsPage from './modules/jobFinancials/JobFinancialsPage'
import Landing from './pages/Landing'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Redirects customer to Portal, others see Admin Dashboard
const RoleBasedIndex = () => {
  const { role } = useAuth()
  if (role === 'customer') return <Navigate to="/dashboard/portal" replace />
  if (role === 'technician') return <Navigate to="/dashboard/tech/daily" replace />
  return <AdminDashboard />
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lead-intake" element={<PublicLeadIntakePage />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                {/* Admin Routes */}
                <Route index element={<RoleBasedIndex />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/:id" element={<JobDetails />} />
                <Route path="jobs/:id/financials" element={<JobFinancialsPage />} />
                <Route path="leads" element={<LeadsListPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="estimates" element={<EstimatesList />} />
                <Route path="estimates/new" element={<CreateEstimate />} />
                <Route path="estimates/edit/:id" element={<CreateEstimate />} />
                <Route path="messages" element={<Communication />} />
                <Route path="invoices" element={<InvoicesList />} />
                <Route path="financing" element={<Financing />} />
                <Route path="verification" element={<AccountVerification />} />
                <Route path="verify-account" element={<IDVerification />} />
                <Route path="customers" element={<Customers />} />
                <Route path="employees" element={<Employees />} />
                <Route path="reports" element={<Reports />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="payments" element={<div className="flex items-center justify-center h-full"><PaymentAllocation /></div>} />

                {/* Manager Routes */}
                <Route path="manager" element={<ManagerDashboard />} />
                <Route path="manager/jobs" element={<ManagerJobs />} />
                <Route path="manager/jobs/:id" element={<JobDetails />} />
                <Route path="manager/dispatch" element={<Dispatch />} />
                <Route path="manager/calendar" element={<CalendarView />} />
                <Route path="manager/approvals" element={<Approvals />} />

                {/* Technician Routes */}
                <Route path="tech/daily" element={<DailyJobs />} />
                <Route path="tech/jobs/:id" element={<JobDetails />} />
                <Route path="tech/attendance" element={<Attendance />} />
                <Route path="tech/photos" element={<PhotoUpload />} />
                <Route path="tech/timesheets" element={<Timesheets />} />
                <Route path="tech/materials" element={<PartsAndMaterials />} />

                {/* Customer Routes */}
                <Route path="portal" element={<CustomerPortal />} />
                <Route path="portal/history" element={<JobHistory />} />
                <Route path="portal/approvals" element={<CustomerApprovals />} />
                <Route path="portal/payments" element={<Payments />} />
                <Route path="portal/change-password" element={<ChangePassword />} />
                <Route path="portal/support" element={<Support />} />
                <Route path="portal/job/:id" element={<JobDetail />} />

                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/job-financials-test" element={<JobFinancialsPage />} />
      <Route path="/" element={<Landing />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <AuthProvider>
        <InvoicesProvider>
          <JobsProvider>
            <CustomersProvider>
              <EmployeesProvider>
                <EstimatesProvider>
                  <FinancingProvider>
                    <VerificationProvider>
                      <MessagesProvider>
                        <MaterialsProvider>
                          <ReviewsProvider>
                            <NotificationProvider>
                              <AppContent />
                            </NotificationProvider>
                          </ReviewsProvider>
                        </MaterialsProvider>
                      </MessagesProvider>
                    </VerificationProvider>
                  </FinancingProvider>
                </EstimatesProvider>
              </EmployeesProvider>
            </CustomersProvider>
          </JobsProvider>
        </InvoicesProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
