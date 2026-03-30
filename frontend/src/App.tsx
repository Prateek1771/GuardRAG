import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DarkModeProvider } from './context/DarkModeContext'
import LoginPage from './pages/LoginPage'
import GuestPage from './pages/GuestPage'
import DashboardLayout from './components/DashboardLayout'
import ChatPage from './pages/dashboard/ChatPage'
import DocumentsPage from './pages/dashboard/DocumentsPage'
import RulesPage from './pages/dashboard/RulesPage'
import AlertsPage from './pages/dashboard/AlertsPage'
import ApprovalsPage from './pages/dashboard/ApprovalsPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import CompaniesPage from './pages/dashboard/CompaniesPage'
import AuditPage from './pages/dashboard/AuditPage'
import ProjectsPage from './pages/dashboard/ProjectsPage'
import ProjectDetailPage from './pages/dashboard/ProjectDetailPage'

const qc = new QueryClient()

function ProtectedRoute({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard/chat" replace />
  return children
}

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="chat" replace />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="rules" element={
          <ProtectedRoute roles={['admin', 'superadmin']}><RulesPage /></ProtectedRoute>
        } />
        <Route path="alerts" element={
          <ProtectedRoute roles={['admin', 'superadmin']}><AlertsPage /></ProtectedRoute>
        } />
        <Route path="approvals" element={
          <ProtectedRoute roles={['admin', 'superadmin']}><ApprovalsPage /></ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute roles={['admin', 'superadmin']}><AnalyticsPage /></ProtectedRoute>
        } />
        <Route path="audit" element={
          <ProtectedRoute roles={['admin', 'superadmin']}><AuditPage /></ProtectedRoute>
        } />
        <Route path="companies" element={
          <ProtectedRoute roles={['superadmin']}><CompaniesPage /></ProtectedRoute>
        } />
      </Routes>
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <DarkModeProvider>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/guest" element={<GuestPage />} />
            <Route path="/dashboard/*" element={
              <ProtectedRoute><DashboardRoutes /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </DarkModeProvider>
  )
}
