import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, FileText, Lock, Users, Sun, Moon } from 'lucide-react'
import { useDarkMode } from '../context/DarkModeContext'

const DEMO_CREDS = [
  { role: 'Super Admin', username: 'superadmin', password: 'demo123' },
  { role: 'Company Admin', username: 'admin', password: 'demo123' },
  { role: 'Member', username: 'user', password: 'demo123' },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggle: toggleDark } = useDarkMode()

  const handleLogin = async (u = username, p = password) => {
    if (!u || !p) return
    setLoading(true)
    setError('')
    try {
      await login(u, p)
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials. Check the demo accounts below.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f62fe] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-sm flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">GuardRAG</span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold text-white leading-tight mb-6">
            Enterprise AI with<br />Policy Guardrails
          </h2>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/15 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Document Intelligence</p>
                <p className="text-white/70 text-xs mt-0.5 leading-relaxed">Upload PDFs, DOCX, and spreadsheets. Ask questions and get answers grounded in your documents.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/15 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Policy Guardrails</p>
                <p className="text-white/70 text-xs mt-0.5 leading-relaxed">Block, redact, or flag sensitive content with configurable keyword and AI-based rules.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/15 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Multi-Tenant Governance</p>
                <p className="text-white/70 text-xs mt-0.5 leading-relaxed">Role-based access, approval workflows, and full audit trails for enterprise compliance.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-xs">GuardRAG &copy; {new Date().getFullYear()}</p>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-1/2 bg-white dark:bg-[#161616] flex items-center justify-center p-8 md:p-16 relative">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="absolute top-4 right-4 p-2 rounded-sm text-[#525252] dark:text-[#a8a8a8] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors cursor-pointer"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 md:hidden">
            <div className="w-8 h-8 bg-[#0f62fe] rounded-sm flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#161616] dark:text-[#f4f4f4]">GuardRAG</span>
          </div>

          <h1 className="text-2xl font-semibold text-[#161616] dark:text-[#f4f4f4] mb-1">Sign in</h1>
          <p className="text-sm text-[#525252] dark:text-[#a8a8a8] mb-8">Access your enterprise AI workspace</p>

          {error && (
            <div className="border-l-4 border-l-[#da1e28] bg-[#fff1f1] dark:bg-[#da1e28]/10 px-4 py-3 text-sm text-[#161616] dark:text-[#f4f4f4] mb-5 rounded-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-[#161616] dark:text-[#f4f4f4] mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-4 py-3 text-sm focus:outline-none placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#161616] dark:text-[#f4f4f4] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-4 py-3 text-sm focus:outline-none placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3.5 text-[#525252] dark:text-[#a8a8a8] hover:text-[#161616] dark:hover:text-[#f4f4f4] cursor-pointer p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleLogin()}
              disabled={loading || !username || !password}
              className="w-full bg-[#0f62fe] hover:bg-[#0043ce] disabled:bg-[#e0e0e0] disabled:text-[#a8a8a8] text-white py-3 text-sm font-semibold transition-colors rounded-sm mt-1 cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6 border-t border-[#e0e0e0] dark:border-[#393939] pt-5">
            <button
              onClick={() => navigate('/guest')}
              className="w-full flex items-center justify-center gap-2 border border-[#e0e0e0] dark:border-[#393939] text-[#161616] dark:text-[#f4f4f4] hover:border-[#0f62fe] hover:text-[#0f62fe] dark:hover:border-[#0f62fe] dark:hover:text-[#78a9ff] py-3 text-sm transition-colors rounded-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Try Guest Demo
            </button>
          </div>

          {/* Demo credentials */}
          <details className="mt-5">
            <summary className="text-[11px] text-[#525252] dark:text-[#a8a8a8] cursor-pointer hover:text-[#161616] dark:hover:text-[#f4f4f4] select-none list-none flex items-center gap-1">
              <span className="text-[#0f62fe]">›</span> Demo credentials
            </summary>
            <div className="mt-3 space-y-2">
              {DEMO_CREDS.map(c => (
                <button
                  key={c.role}
                  onClick={() => { setUsername(c.username); setPassword(c.password) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-[#e0e0e0] dark:border-[#393939] hover:border-[#0f62fe] hover:bg-[#edf5ff] dark:hover:bg-[#001d6c]/30 transition-colors text-left rounded-sm cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4]">{c.role}</p>
                    <p className="text-[10px] font-mono text-[#525252] dark:text-[#a8a8a8]">{c.username} / {c.password}</p>
                  </div>
                  <span className="text-[10px] text-[#0f62fe]">Use →</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
