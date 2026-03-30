import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  Users, MessageSquare, FileText, Bell, Clock,
  Download, Calendar, ChevronDown, X,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  BLOCKED:  '#da1e28',
  ALERT:    '#f1c21b',
  APPROVAL: '#ff832b',
  REDACTED: '#8a3ffc',
}

const ACTION_BG: Record<string, string> = {
  BLOCKED:  'bg-[#da1e28]/10 text-[#da1e28]',
  ALERT:    'bg-[#f1c21b]/10 text-[#b28600]',
  APPROVAL: 'bg-[#ff832b]/10 text-[#ff832b]',
  REDACTED: 'bg-[#8a3ffc]/10 text-[#8a3ffc]',
}

const PIE_COLORS = ['#0f62fe', '#198038', '#8a3ffc', '#f1c21b', '#da1e28']

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1a1a1a',
    border: '1px solid #393939',
    borderRadius: 2,
    fontSize: 11,
    color: '#f4f4f4',
  },
}

type RangePreset = 'today' | '7d' | '30d' | 'custom'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getPresetDates(preset: RangePreset): { start: string; end: string } {
  const now = new Date()
  const today = toISODate(now)
  if (preset === 'today') return { start: today, end: today }
  if (preset === '7d') return { start: toISODate(new Date(Date.now() - 6 * 86400000)), end: today }
  if (preset === '30d') return { start: toISODate(new Date(Date.now() - 29 * 86400000)), end: today }
  return { start: '', end: '' }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent: string }) {
  return (
    <div className={`bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden`}
         style={{ borderTop: `3px solid ${accent}` }}>
      <div className="px-5 py-4 flex items-center gap-4">
        <div style={{ color: accent }} className="opacity-80">{icon}</div>
        <div>
          <p className="text-2xl font-light text-[#161616] dark:text-[#f4f4f4] tabular-nums">{value ?? '–'}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#525252] dark:text-[#a8a8a8] mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm p-5">
      <h2 className="text-sm font-semibold text-[#161616] dark:text-[#f4f4f4]">{title}</h2>
      {subtitle && <p className="text-[10px] text-[#525252] dark:text-[#a8a8a8] mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

// ─── Download Report Modal ───────────────────────────────────────────────────

interface ReportModalProps {
  defaultStart: string
  defaultEnd: string
  summary: any
  msgPerDay: any[]
  ruleTriggers: any[]
  topRules: any[]
  deptUsers: any[]
  prompts: any[]
  onClose: () => void
}

function ReportModal({ defaultStart, defaultEnd, summary, msgPerDay, ruleTriggers, topRules, deptUsers, prompts, onClose }: ReportModalProps) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [generating, setGenerating] = useState(false)
  const [sections, setSections] = useState({
    summary: true,
    charts: true,
    guardrails: true,
    prompts: true,
  })
  const { user } = useAuth()

  const generatePDF = useCallback(async () => {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = 210
      const margin = 16
      const contentW = W - margin * 2
      let y = margin

      // ── Fonts & colours ──────────────────────────────────────────────────
      const blue = [15, 98, 254] as [number, number, number]
      const dark = [22, 22, 22] as [number, number, number]
      const muted = [82, 82, 82] as [number, number, number]
      const light = [224, 224, 224] as [number, number, number]
      const actionColorMap: Record<string, [number, number, number]> = {
        BLOCKED:  [218, 30, 40],
        ALERT:    [241, 193, 27],
        APPROVAL: [255, 131, 43],
        REDACTED: [138, 63, 252],
      }

      const addLine = (extra = 6) => { y += extra }
      const checkPage = (needed = 20) => {
        if (y + needed > 280) { doc.addPage(); y = margin }
      }

      // ── Header strip ─────────────────────────────────────────────────────
      doc.setFillColor(...blue)
      doc.rect(0, 0, W, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('GuardRAG Analytics Report', margin, 12)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const companyName = user?.role === 'superadmin' ? 'All Companies' : 'Acme Corp'
      doc.text(`${companyName}  ·  Generated: ${new Date().toLocaleDateString()}  ·  Period: ${start || '–'} → ${end || 'today'}`, W - margin, 12, { align: 'right' })

      y = 26

      // ── PAGE 1 ───────────────────────────────────────────────────────────
      if (sections.summary && summary) {
        doc.setTextColor(...dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('SUMMARY OVERVIEW', margin, y)
        addLine(5)

        const kpis = [
          ['Members', summary.total_users],
          ['Documents', summary.total_documents],
          ['Messages', summary.total_messages],
          ['Alerts', summary.total_alerts],
          ['Pending Approvals', summary.pending_approvals],
        ]
        const colW = contentW / kpis.length
        kpis.forEach(([label, val], i) => {
          const x = margin + i * colW
          doc.setFillColor(248, 248, 248)
          doc.setDrawColor(...light)
          doc.rect(x, y, colW - 2, 16, 'FD')
          doc.setTextColor(...blue)
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(String(val ?? 0), x + colW / 2 - 1, y + 8, { align: 'center' })
          doc.setTextColor(...muted)
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'normal')
          doc.text(String(label).toUpperCase(), x + colW / 2 - 1, y + 13, { align: 'center' })
        })
        addLine(22)
      }

      if (sections.charts && msgPerDay.length > 0) {
        checkPage(50)
        doc.setTextColor(...dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('MESSAGE ACTIVITY', margin, y)
        addLine(5)

        // Simple sparkline
        const maxCount = Math.max(...msgPerDay.map((r: any) => r.count), 1)
        const barW = Math.min(8, contentW / msgPerDay.length - 1)
        msgPerDay.forEach((row: any, i: number) => {
          const bh = (row.count / maxCount) * 25
          const x = margin + i * (barW + 1)
          doc.setFillColor(...blue)
          doc.rect(x, y + 25 - bh, barW, bh, 'F')
          if (msgPerDay.length <= 14) {
            doc.setTextColor(...muted)
            doc.setFontSize(5)
            doc.text(row.date.slice(5), x + barW / 2, y + 30, { align: 'center' })
          }
        })
        addLine(36)
      }

      if (sections.guardrails) {
        checkPage(50)
        if (ruleTriggers.length > 0) {
          doc.setTextColor(...dark)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('GUARDRAIL TRIGGERS BY ACTION', margin, y)
          addLine(5)

          const barTotal = ruleTriggers.reduce((s: number, r: any) => s + r.count, 0) || 1
          ruleTriggers.forEach((row: any) => {
            const pct = row.count / barTotal
            const bw = pct * (contentW - 40)
            const color = actionColorMap[row.action] || ([82, 82, 82] as [number, number, number])
            doc.setFillColor(...color)
            doc.rect(margin + 40, y, bw, 5, 'F')
            doc.setTextColor(...dark)
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.text(row.action, margin, y + 4)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...muted)
            doc.text(String(row.count), margin + 40 + bw + 2, y + 4)
            addLine(7)
          })
          addLine(4)
        }

        if (topRules.length > 0) {
          checkPage(30)
          doc.setTextColor(...dark)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('TOP TRIGGERED RULES', margin, y)
          addLine(5)
          topRules.forEach((row: any, i: number) => {
            doc.setTextColor(...muted)
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.text(`${i + 1}.  ${row.rule}`, margin + 2, y)
            doc.text(String(row.count), W - margin, y, { align: 'right' })
            addLine(5.5)
          })
          addLine(4)
        }

        if (deptUsers.length > 0) {
          checkPage(30)
          doc.setTextColor(...dark)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('USERS BY DEPARTMENT', margin, y)
          addLine(5)
          deptUsers.forEach((row: any) => {
            const maxDept = Math.max(...deptUsers.map((d: any) => d.count), 1)
            const bw = (row.count / maxDept) * (contentW - 50)
            doc.setFillColor(15, 98, 254)
            doc.rect(margin + 50, y - 4, bw, 4, 'F')
            doc.setTextColor(...dark)
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.text(row.department, margin, y)
            doc.setTextColor(...muted)
            doc.text(String(row.count), margin + 50 + bw + 2, y)
            addLine(6)
          })
        }
      }

      // ── PAGE 2+ — Prompts Log ────────────────────────────────────────────
      if (sections.prompts && prompts.length > 0) {
        doc.addPage()
        y = margin

        doc.setFillColor(...blue)
        doc.rect(0, 0, W, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('RECENT PROMPTS LOG', margin, 7)
        y = 18

        // Table header
        doc.setFillColor(244, 244, 244)
        doc.setDrawColor(...light)
        doc.rect(margin, y, contentW, 7, 'FD')
        doc.setTextColor(...muted)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text('USER', margin + 2, y + 5)
        doc.text('MESSAGE', margin + 38, y + 5)
        doc.text('TIME', W - margin - 28, y + 5)
        doc.text('ACTION', W - margin - 2, y + 5, { align: 'right' })
        addLine(8)

        const userPrompts = prompts.filter((p: any) => p.role === 'user')
        userPrompts.forEach((p: any, idx: number) => {
          checkPage(9)
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(margin, y - 5, contentW, 8, 'F')
          }
          doc.setTextColor(...dark)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.text(p.username || `#${p.user_id}`, margin + 2, y)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...muted)
          const msg = (p.content || '').slice(0, 72) + ((p.content || '').length > 72 ? '…' : '')
          doc.text(msg, margin + 38, y)
          doc.text(new Date(p.created_at).toLocaleDateString(), W - margin - 28, y)
          if (p.guardrail_action) {
            const c = actionColorMap[p.guardrail_action] || ([82, 82, 82] as [number, number, number])
            doc.setTextColor(...c)
            doc.setFont('helvetica', 'bold')
            doc.text(p.guardrail_action, W - margin - 2, y, { align: 'right' })
          }
          addLine(8)
        })
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(...muted)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.text(`GuardRAG · Confidential · Page ${i} of ${pageCount}`, W / 2, 292, { align: 'center' })
      }

      doc.save(`guardrag-analytics-${start || 'all'}-to-${end || 'today'}.pdf`)
    } catch (e) {
      console.error('PDF generation failed', e)
    } finally {
      setGenerating(false)
    }
  }, [start, end, sections, summary, msgPerDay, ruleTriggers, topRules, deptUsers, prompts, user])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0] dark:border-[#393939]">
          <div>
            <h2 className="text-sm font-semibold text-[#161616] dark:text-[#f4f4f4]">Download Analytics Report</h2>
            <p className="text-[10px] text-[#525252] dark:text-[#a8a8a8] mt-0.5">Generate a PDF report for the selected period</p>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-[#161616] dark:hover:text-[#f4f4f4] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-[#161616] dark:text-[#f4f4f4] mb-2">Report Period</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#525252] dark:text-[#a8a8a8] mb-1 block">From</label>
                <input
                  type="date"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#262626] text-[#161616] dark:text-[#f4f4f4] rounded-sm focus:outline-none focus:border-[#0f62fe]"
                />
              </div>
              <span className="text-[#525252] dark:text-[#a8a8a8] text-xs mt-4">—</span>
              <div className="flex-1">
                <label className="text-[10px] text-[#525252] dark:text-[#a8a8a8] mb-1 block">To</label>
                <input
                  type="date"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#262626] text-[#161616] dark:text-[#f4f4f4] rounded-sm focus:outline-none focus:border-[#0f62fe]"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div>
            <p className="text-xs font-semibold text-[#161616] dark:text-[#f4f4f4] mb-2">Include Sections</p>
            <div className="space-y-2">
              {([
                ['summary',    'Summary Overview  (Page 1)'],
                ['charts',     'Message Activity Charts'],
                ['guardrails', 'Guardrail Analysis'],
                ['prompts',    'Recent Prompts Log'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sections[key]}
                    onChange={e => setSections(s => ({ ...s, [key]: e.target.checked }))}
                    className="accent-[#0f62fe] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[#161616] dark:text-[#f4f4f4]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e0e0e0] dark:border-[#393939]">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 border border-[#e0e0e0] dark:border-[#393939] text-[#161616] dark:text-[#f4f4f4] rounded-sm hover:border-[#525252] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="text-xs px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-sm font-medium transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {generating ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>('7d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Derived date range
  const { start: startDate, end: endDate } = preset === 'custom'
    ? { start: customStart, end: customEnd }
    : getPresetDates(preset)

  const params = { start_date: startDate, end_date: endDate }

  const { data: summary } = useQuery({
    queryKey: ['summary', startDate, endDate],
    queryFn: () => api.get('/analytics/summary', { params }).then(r => r.data),
  })
  const { data: msgPerDay = [] } = useQuery({
    queryKey: ['msg-per-day', startDate, endDate],
    queryFn: () => api.get('/analytics/messages-per-day', { params }).then(r => r.data),
  })
  const { data: ruleTriggers = [] } = useQuery({
    queryKey: ['rule-triggers', startDate, endDate],
    queryFn: () => api.get('/analytics/rule-triggers', { params }).then(r => r.data),
  })
  const { data: topRules = [] } = useQuery({
    queryKey: ['top-rules', startDate, endDate],
    queryFn: () => api.get('/analytics/top-rules', { params }).then(r => r.data),
  })
  const { data: deptUsers = [] } = useQuery({
    queryKey: ['dept-users'],
    queryFn: () => api.get('/analytics/users-by-department').then(r => r.data),
  })
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-prompts', startDate, endDate],
    queryFn: () => api.get('/chat/audit', { params: { ...params, limit: 100 } }).then(r => r.data),
  })

  const prompts = auditLogs.filter((l: any) => l.role === 'user')

  const presetLabel: Record<RangePreset, string> = { today: 'Today', '7d': '7D', '30d': '30D', custom: 'Custom' }

  // ── Header action slot ──────────────────────────────────────────────────
  const headerAction = (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      {/* Preset tabs */}
      <div className="flex items-center border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
        {(['today', '7d', '30d', 'custom'] as RangePreset[]).map((p, i) => (
          <button
            key={p}
            onClick={() => {
              setPreset(p)
              setShowCustom(p === 'custom')
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              i > 0 ? 'border-l border-[#e0e0e0] dark:border-[#393939]' : ''
            } ${
              preset === p
                ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                : 'text-[#525252] dark:text-[#a8a8a8] hover:text-[#0f62fe] hover:bg-[#f4f4f4] dark:hover:bg-[#262626]'
            }`}
          >
            {p === 'custom' ? (
              <span className="flex items-center gap-1">{presetLabel[p]} <ChevronDown className="w-3 h-3" /></span>
            ) : presetLabel[p]}
          </button>
        ))}
      </div>

      {/* Download button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Download Report
      </button>
    </div>
  )

  // ── Custom date inputs (shown below header when custom is active) ────────
  const customDateRow = showCustom && (
    <div className="flex items-center gap-2 px-6 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
      <Calendar className="w-3.5 h-3.5 text-[#525252] dark:text-[#a8a8a8]" />
      <input
        type="date"
        value={customStart}
        onChange={e => setCustomStart(e.target.value)}
        className="text-xs px-2 py-1 border border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#1a1a1a] text-[#161616] dark:text-[#f4f4f4] rounded-sm focus:outline-none focus:border-[#0f62fe]"
      />
      <span className="text-[#525252] dark:text-[#a8a8a8] text-xs">—</span>
      <input
        type="date"
        value={customEnd}
        onChange={e => setCustomEnd(e.target.value)}
        className="text-xs px-2 py-1 border border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#1a1a1a] text-[#161616] dark:text-[#f4f4f4] rounded-sm focus:outline-none focus:border-[#0f62fe]"
      />
      <span className="text-[10px] text-[#525252] dark:text-[#a8a8a8] ml-1">
        {customStart && customEnd ? `Showing ${customStart} – ${customEnd}` : 'Select a date range'}
      </span>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Analytics"
        description={`Team usage and guardrail activity · ${startDate || '…'} – ${endDate || 'today'}`}
        action={headerAction}
      />

      {customDateRow}

      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* ── KPI Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={<Users className="w-5 h-5" />}      label="Members"          value={summary?.total_users}        accent="#0f62fe" />
          <StatCard icon={<FileText className="w-5 h-5" />}   label="Documents"        value={summary?.total_documents}    accent="#198038" />
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Prompts"       value={summary?.total_messages}     accent="#8a3ffc" />
          <StatCard icon={<Bell className="w-5 h-5" />}       label="Alerts"           value={summary?.total_alerts}       accent="#f1c21b" />
          <StatCard icon={<Clock className="w-5 h-5" />}      label="Pending"          value={summary?.pending_approvals}  accent="#ff832b" />
        </div>

        {/* ── Charts Row 1 ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Messages per day — wider */}
          <div className="md:col-span-3">
            <ChartCard title="Message Activity" subtitle={`Prompts sent · ${presetLabel[preset]}${preset === 'custom' && customStart ? ` (${customStart} – ${customEnd})` : ''}`}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={msgPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393939" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a8a8a8' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={l => `Date: ${l}`} formatter={(v: any) => [v, 'Prompts']} />
                  <Line type="monotone" dataKey="count" stroke="#0f62fe" strokeWidth={2} dot={{ r: 3, fill: '#0f62fe', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Rule triggers — narrower */}
          <div className="md:col-span-2">
            <ChartCard title="Guardrail Triggers" subtitle="By action type">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ruleTriggers} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393939" opacity={0.4} />
                  <XAxis dataKey="action" tick={{ fontSize: 10, fill: '#a8a8a8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#a8a8a8' }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [v, 'Triggers']} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {ruleTriggers.map((entry: any, i: number) => (
                      <Cell key={i} fill={ACTION_COLORS[entry.action] || '#525252'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* ── Charts Row 2 ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top triggered rules — pie */}
          <ChartCard title="Top Triggered Rules" subtitle="By frequency">
            {topRules.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-[#525252] dark:text-[#a8a8a8]">No rule triggers in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={topRules} dataKey="count" nameKey="rule" cx="50%" cy="50%" outerRadius={75} innerRadius={30}>
                    {topRules.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any, _: any, p: any) => [v, p.payload.rule]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: '#a8a8a8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Users by department */}
          <ChartCard title="Users by Department" subtitle="Team breakdown">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={deptUsers} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#393939" opacity={0.4} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a8a8' }} allowDecimals={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#a8a8a8' }} width={80} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [v, 'Users']} />
                <Bar dataKey="count" fill="#0f62fe" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Recent Prompts ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e0e0e0] dark:border-[#393939]">
            <div>
              <h2 className="text-sm font-semibold text-[#161616] dark:text-[#f4f4f4]">Recent Prompts</h2>
              <p className="text-[10px] text-[#525252] dark:text-[#a8a8a8] mt-0.5">
                {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} · who asked what and when
              </p>
            </div>
          </div>

          {prompts.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#525252] dark:text-[#a8a8a8]">
              No prompts in this period
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[200px_1fr_100px_120px] gap-0 px-4 py-2 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
                {['User', 'Message', 'Time', 'Action'].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8]">{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#e0e0e0] dark:divide-[#393939]">
                {prompts.map((p: any) => {
                  const name = p.username || `User #${p.user_id}`
                  const init = initials(name)
                  return (
                    <div key={p.id} className="grid grid-cols-[200px_1fr_100px_120px] gap-0 px-4 py-3 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors items-center">
                      {/* User */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#0f62fe]/10 dark:bg-[#0f62fe]/20 text-[#0f62fe] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {init}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] truncate">{name}</p>
                          <p className="text-[10px] text-[#525252] dark:text-[#a8a8a8]">ID #{p.user_id}</p>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-xs text-[#161616] dark:text-[#f4f4f4] truncate pr-4" title={p.content}>
                        {p.content}
                      </p>

                      {/* Time */}
                      <span className="text-xs text-[#525252] dark:text-[#a8a8a8]">
                        {relativeTime(p.created_at)}
                      </span>

                      {/* Action badge */}
                      <div>
                        {p.guardrail_action ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${ACTION_BG[p.guardrail_action] || 'bg-[#525252]/10 text-[#525252]'}`}>
                            {p.guardrail_action}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#a8a8a8]">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Download Modal ───────────────────────────────────────────── */}
      {showModal && (
        <ReportModal
          defaultStart={startDate}
          defaultEnd={endDate}
          summary={summary}
          msgPerDay={msgPerDay}
          ruleTriggers={ruleTriggers}
          topRules={topRules}
          deptUsers={deptUsers}
          prompts={auditLogs}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
