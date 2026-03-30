import { type ReactNode, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import {
  Shield, MessageSquare, FileText, Bell,
  CheckSquare, BarChart2, ScrollText, Building2, LogOut, Menu, Sun, Moon, FolderOpen
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

interface NavItem {
  path: string
  label: string
  icon: ReactNode
  roles: string[]
  group: 'main' | 'admin'
}

const NAV: NavItem[] = [
  { path: '/dashboard/chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" />, roles: ['member', 'admin', 'superadmin'], group: 'main' },
  { path: '/dashboard/projects', label: 'Projects', icon: <FolderOpen className="w-4 h-4" />, roles: ['member', 'admin', 'superadmin'], group: 'main' },
  { path: '/dashboard/documents', label: 'Documents', icon: <FileText className="w-4 h-4" />, roles: ['member', 'admin', 'superadmin'], group: 'main' },
  { path: '/dashboard/rules', label: 'Rules', icon: <Shield className="w-4 h-4" />, roles: ['admin', 'superadmin'], group: 'admin' },
  { path: '/dashboard/alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" />, roles: ['admin', 'superadmin'], group: 'admin' },
  { path: '/dashboard/approvals', label: 'Approvals', icon: <CheckSquare className="w-4 h-4" />, roles: ['admin', 'superadmin'], group: 'admin' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" />, roles: ['admin', 'superadmin'], group: 'admin' },
  { path: '/dashboard/companies', label: 'Companies', icon: <Building2 className="w-4 h-4" />, roles: ['superadmin'], group: 'admin' },
  { path: '/dashboard/audit', label: 'Audit Logs', icon: <ScrollText className="w-4 h-4" />, roles: ['admin', 'superadmin'], group: 'admin' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: alertCount } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => api.get('/alerts/unread/count').then(r => r.data.count),
    refetchInterval: 10000,
    enabled: user?.role === 'admin' || user?.role === 'superadmin',
  })

  const { data: approvalCount } = useQuery({
    queryKey: ['approval-count'],
    queryFn: () => api.get('/alerts/approvals/pending/count').then(r => r.data.count),
    refetchInterval: 10000,
    enabled: user?.role === 'admin' || user?.role === 'superadmin',
  })

  const visibleNav = NAV.filter(n => user && n.roles.includes(user.role))
  const mainNav = visibleNav.filter(n => n.group === 'main')
  const adminNav = visibleNav.filter(n => n.group === 'admin')

  const handleLogout = () => { logout(); navigate('/') }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??'

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    const badge = item.path.includes('alerts') && alertCount
      ? alertCount
      : item.path.includes('approvals') && approvalCount
      ? approvalCount
      : null

    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'border-l-2 border-l-[#78a9ff] bg-[#262626] text-[#f4f4f4]'
            : 'border-l-2 border-l-transparent text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4]'
        }`}
      >
        <span className="flex items-center gap-3">{item.icon}{item.label}</span>
        {badge > 0 && (
          <span className="bg-[#da1e28] text-white text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-sm">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    )
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#161616] text-[#f4f4f4] w-64">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-[#393939]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0f62fe] rounded-sm flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide text-[#f4f4f4]">GuardRAG</span>
            <p className="text-[10px] text-[#c6c6c6] tracking-widest uppercase">Enterprise AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {mainNav.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c6c6c6] px-4 py-2">Main</p>
            {mainNav.map(item => <NavLink key={item.path} item={item} />)}
          </div>
        )}
        {adminNav.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c6c6c6] px-4 py-2">Administration</p>
            {adminNav.map(item => <NavLink key={item.path} item={item} />)}
          </div>
        )}
      </nav>

      {/* Dark mode toggle */}
      <div className="border-t border-[#393939] px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#c6c6c6]">Appearance</span>
        <button
          onClick={toggleDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-sm text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#393939] transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* User + Logout */}
      <div className="border-t border-[#393939]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#0f62fe] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#f4f4f4] truncate">{user?.username}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#c6c6c6]">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#c6c6c6] hover:bg-[#393939] hover:text-[#ff8389] transition-colors border-t border-[#393939]"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f4f4f4] dark:bg-[#0d0d0d]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 bg-[#161616] border-b border-[#393939] px-4 py-3">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation menu" className="cursor-pointer text-[#c6c6c6] hover:text-[#f4f4f4]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0f62fe]" />
            <span className="font-semibold text-sm text-[#f4f4f4]">GuardRAG</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
