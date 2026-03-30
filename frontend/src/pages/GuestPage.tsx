import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Shield, FileText, LogOut, Info, MessageSquare, Plus, Pencil, Trash2, X,
  ShieldX, AlertTriangle, Clock, EyeOff, Sun, Moon,
} from 'lucide-react'
import { useDarkMode } from '../context/DarkModeContext'
import ChatWindow from '../components/ChatWindow'
import DocumentUpload from '../components/DocumentUpload'
import api from '../lib/api'

const ACTION_COLORS: Record<string, string> = {
  BLOCKED:  'bg-[#fff1f1] text-[#da1e28]',
  ALERT:    'bg-[#fcf4d6] text-[#b28600]',
  APPROVAL: 'bg-[#fff2e8] text-[#ff832b]',
  REDACTED: 'bg-[#f6f2ff] text-[#8a3ffc]',
}

const ACTION_STYLES: Record<string, string> = {
  BLOCKED:  'bg-[#fff1f1] text-[#da1e28] border-[#da1e28]/30',
  ALERT:    'bg-[#fcf4d6] text-[#b28600] border-[#f1c21b]/40',
  APPROVAL: 'bg-[#fff2e8] text-[#ff832b] border-[#ff832b]/30',
  REDACTED: 'bg-[#f6f2ff] text-[#8a3ffc] border-[#8a3ffc]/30',
}

const TOAST_CONFIG: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  BLOCKED:  { bg: 'bg-[#fff1f1]', border: 'border-l-4 border-l-[#da1e28]', icon: <ShieldX className="w-4 h-4 text-[#da1e28]" />, label: 'Policy Block — Message Blocked' },
  ALERT:    { bg: 'bg-[#fcf4d6]', border: 'border border-[#f1c21b]', icon: <AlertTriangle className="w-4 h-4 text-[#b28600]" />, label: 'Alert — Policy Triggered' },
  APPROVAL: { bg: 'bg-[#fff2e8]', border: 'border-l-4 border-l-[#ff832b]', icon: <Clock className="w-4 h-4 text-[#ff832b]" />, label: 'Pending Admin Approval' },
  REDACTED: { bg: 'bg-[#f6f2ff]', border: 'border-l-4 border-l-[#8a3ffc]', icon: <EyeOff className="w-4 h-4 text-[#8a3ffc]" />, label: 'Content Redacted' },
}

interface Toast { id: string; action: string; ruleName?: string | null }

const EMPTY_FORM = { name: '', keywords: '', description: '', action: 'ALERT', scope: 'BOTH' }
const inputCls = 'w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-3 py-2 text-sm focus:outline-none placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-sm'
const selectCls = 'w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-3 py-2 text-sm focus:outline-none text-[#161616] dark:text-[#f4f4f4] rounded-sm'

export default function GuestPage() {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [tab, setTab] = useState<'chat' | 'docs' | 'rules'>('chat')
  const [toasts, setToasts] = useState<Toast[]>([])
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isDark, toggle: toggleDark } = useDarkMode()

  // Rules state
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: rules = [], refetch: refetchRules } = useQuery({
    queryKey: ['guest-rules'],
    queryFn: () => api.get('/rules/public/1').then(r => r.data),
  })

  const saveRule = useMutation({
    mutationFn: (data: any) => editing
      ? api.put(`/rules/${editing.id}`, data)
      : api.post('/rules', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guest-rules'] }); closeForm() },
  })

  const delRule = useMutation({
    mutationFn: (id: number) => api.delete(`/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-rules'] }),
  })

  const openEdit = (rule: any) => {
    setEditing(rule)
    setForm({ name: rule.name, keywords: rule.keywords.join(', '), description: rule.description, action: rule.action, scope: rule.scope })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = () => {
    saveRule.mutate({
      name: form.name,
      keywords: form.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      description: form.description,
      action: form.action,
      scope: form.scope,
      company_id: 1,
    })
  }

  // Toast system
  const handleGuardrail = useCallback((action: string, ruleName?: string | null) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, action, ruleName }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const handleLogout = async () => {
    await api.delete(`/documents/guest/${sessionId}`).catch(() => {})
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0d0d0d] flex flex-col">
      {/* Header */}
      <header className="bg-[#161616] border-b border-[#393939] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#0f62fe] rounded-sm flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-[#f4f4f4]">GuardRAG</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#fff2e8] text-[#ff832b] px-2 py-0.5 rounded-sm ml-1">
            Guest Demo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#c6c6c6] hidden sm:block font-mono">Session: {sessionId.slice(0, 8)}…</span>
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-sm text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#393939] transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#c6c6c6] hover:text-[#ff8389] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Exit Demo
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-4">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-3">
          {/* Nav tabs — light card style, distinct from dashboard dark sidebar */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939]">
            {[
              { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
              { key: 'docs', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
              { key: 'rules', label: 'Active Rules', icon: <Shield className="w-4 h-4" /> },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as any)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 cursor-pointer ${
                  tab === item.key
                    ? 'border-l-4 border-l-[#0f62fe] bg-[#edf5ff] dark:bg-[#001d6c]/30 text-[#0f62fe] font-semibold'
                    : 'border-l-4 border-l-transparent text-[#525252] dark:text-[#a8a8a8] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] hover:text-[#161616] dark:hover:text-[#f4f4f4]'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
            {/* Appearance toggle */}
            <div className="border-t border-[#e0e0e0] dark:border-[#393939] px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#525252] dark:text-[#a8a8a8]">Appearance</span>
              <button
                onClick={toggleDark}
                className="p-1.5 rounded-sm text-[#525252] dark:text-[#a8a8a8] hover:text-[#161616] dark:hover:text-[#f4f4f4] hover:bg-[#f4f4f4] dark:hover:bg-[#393939] transition-colors cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Demo mode info */}
          <div className="bg-[#edf5ff] dark:bg-[#001d6c]/30 border-l-4 border-l-[#0f62fe] px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-[#0f62fe]" />
              <span className="text-xs font-semibold text-[#161616] dark:text-[#f4f4f4]">Demo Mode</span>
            </div>
            <ul className="text-xs text-[#525252] dark:text-[#a8a8a8] space-y-1 leading-relaxed">
              <li>• Upload any document</li>
              <li>• Chat with your docs via RAG</li>
              <li>• See guardrails fire in real-time</li>
              <li>• All data deleted on exit</li>
            </ul>
          </div>

          {/* Try these triggers */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#525252] dark:text-[#a8a8a8] mb-3">Try These Triggers</p>
            <div className="space-y-2">
              {[
                { text: '"Tell me about competitor"', badge: 'BLOCKED' },
                { text: '"What is the salary range?"', badge: 'ALERT' },
                { text: '"NDA contract terms"', badge: 'APPROVAL' },
                { text: '"Show SSN in response"', badge: 'REDACTED' },
              ].map(hint => (
                <div key={hint.text} className="flex items-start gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm flex-shrink-0 ${ACTION_COLORS[hint.badge] || ''}`}>
                    {hint.badge}
                  </span>
                  <span className="text-xs text-[#525252] dark:text-[#a8a8a8] leading-relaxed">{hint.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden flex flex-col min-h-[600px] relative">
          {/* Toast notifications */}
          {toasts.length > 0 && (
            <div className="absolute top-3 right-3 z-50 flex flex-col gap-2 w-72">
              {toasts.map(toast => {
                const cfg = TOAST_CONFIG[toast.action]
                if (!cfg) return null
                return (
                  <div key={toast.id} className={`${cfg.bg} ${cfg.border} rounded-sm px-4 py-3 shadow-md flex items-start gap-3`}>
                    <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#161616]">{cfg.label}</p>
                      {toast.ruleName && (
                        <p className="text-[11px] text-[#525252] mt-0.5 truncate">Rule: {toast.ruleName}</p>
                      )}
                    </div>
                    <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 text-[#525252] hover:text-[#161616] cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'chat' && (
            <ChatWindow guestSessionId={sessionId} companyId={1} onGuardrail={handleGuardrail} />
          )}

          {tab === 'docs' && (
            <div className="p-6">
              <h2 className="text-base font-semibold text-[#161616] dark:text-[#f4f4f4] mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f62fe]" /> Upload Documents
              </h2>
              <DocumentUpload sessionId={sessionId} />
            </div>
          )}

          {tab === 'rules' && (
            <div className="p-6 flex-1 overflow-auto">
              {/* Rules header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#161616] dark:text-[#f4f4f4] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0f62fe]" /> Guardrail Rules
                </h2>
                <button
                  onClick={() => { closeForm(); setShowForm(true) }}
                  className="flex items-center gap-1.5 bg-[#0f62fe] hover:bg-[#0043ce] text-white px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Rule
                </button>
              </div>

              {/* Inline form */}
              {showForm && (
                <div className="bg-[#edf5ff] dark:bg-[#001d6c]/30 border border-[#d0e2ff] dark:border-[#0f62fe]/30 rounded-sm p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[#161616] dark:text-[#f4f4f4]">{editing ? 'Edit Rule' : 'New Rule'}</span>
                    <button onClick={closeForm} className="p-1 hover:bg-[#d0e2ff] dark:hover:bg-[#0f62fe]/20 rounded-sm cursor-pointer transition-colors">
                      <X className="w-4 h-4 text-[#525252] dark:text-[#a8a8a8]" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1">Rule Name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className={inputCls} placeholder="e.g. Competitor Block" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1">Action</label>
                      <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} className={selectCls}>
                        <option>BLOCKED</option><option>ALERT</option><option>APPROVAL</option><option>REDACTED</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1">Scope</label>
                      <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className={selectCls}>
                        <option>BOTH</option><option>INPUT</option><option>OUTPUT</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1">Keywords <span className="text-[#525252] dark:text-[#a8a8a8] font-normal">(comma-separated)</span></label>
                      <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                        className={inputCls} placeholder="salary, compensation, pay grade" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1">Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={2} className={`${inputCls} resize-none`} placeholder="Describe the policy in plain English…" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSubmit} disabled={saveRule.isPending || !form.name}
                      className="bg-[#0f62fe] hover:bg-[#0043ce] disabled:opacity-50 text-white px-4 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer">
                      {saveRule.isPending ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
                    </button>
                    <button onClick={closeForm}
                      className="border border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#262626] hover:bg-[#f4f4f4] dark:hover:bg-[#393939] text-[#161616] dark:text-[#f4f4f4] px-4 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rules list */}
              <div className="space-y-2">
                {rules.map((rule: any) => (
                  <div key={rule.id} className="border border-[#e0e0e0] dark:border-[#393939] rounded-sm p-4 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#161616] dark:text-[#f4f4f4] text-sm">{rule.name}</span>
                        <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-1">{rule.description}</p>
                        {rule.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rule.keywords.map((kw: string) => (
                              <span key={kw} className="text-[10px] bg-[#f4f4f4] dark:bg-[#262626] text-[#525252] dark:text-[#a8a8a8] border border-[#e0e0e0] dark:border-[#393939] px-2 py-0.5 rounded-sm font-mono">{kw}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-sm ${ACTION_STYLES[rule.action] || ''}`}>
                          {rule.action}
                        </span>
                        <span className="text-[10px] text-[#525252] dark:text-[#a8a8a8] uppercase tracking-wider">{rule.scope}</span>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => openEdit(rule)}
                            className="p-1 text-[#525252] hover:text-[#0f62fe] hover:bg-[#edf5ff] rounded-sm transition-colors cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete "${rule.name}"?`)) delRule.mutate(rule.id) }}
                            className="p-1 text-[#525252] hover:text-[#da1e28] hover:bg-[#fff1f1] rounded-sm transition-colors cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && !showForm && (
                  <p className="text-sm text-[#525252] dark:text-[#a8a8a8]">No rules configured. Add one above.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
