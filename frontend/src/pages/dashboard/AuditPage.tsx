import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { ScrollText, Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const ACTION_COLORS: Record<string, string> = {
  BLOCKED:  'text-[#da1e28]',
  ALERT:    'text-[#b28600]',
  APPROVAL: 'text-[#ff832b]',
  REDACTED: 'text-[#8a3ffc]',
}

export default function AuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get('/chat/audit').then(r => r.data),
  })

  const exportCsv = () => {
    const headers = ['id', 'role', 'content', 'guardrail_action', 'rule_triggered', 'created_at']
    const rows = logs.map((l: any) => headers.map(h => JSON.stringify(l[h] ?? '')).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Audit Logs"
        description="All team chat messages and guardrail events"
        action={
          logs.length > 0 ? (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 border border-[#e0e0e0] dark:border-[#393939] text-[#161616] dark:text-[#f4f4f4] hover:border-[#0f62fe] hover:text-[#0f62fe] px-3 py-2 rounded-sm text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="w-10 h-10" />}
            title="No audit logs yet"
            description="Chat messages and guardrail events will be recorded here."
          />
        ) : (
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden font-mono text-xs">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-36">Timestamp</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-20">Role</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex-1">Message</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-24 text-right">Action</span>
            </div>

            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors">
                <span className="text-[#525252] dark:text-[#a8a8a8] w-36 flex-shrink-0 pt-px">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className={`w-20 flex-shrink-0 font-semibold uppercase tracking-wider text-[10px] pt-px ${
                  log.role === 'user' ? 'text-[#0f62fe]' : 'text-[#525252] dark:text-[#a8a8a8]'
                }`}>
                  {log.role}
                </span>
                <p className="flex-1 text-[#161616] dark:text-[#f4f4f4] leading-relaxed truncate">{log.content}</p>
                <div className="w-24 text-right flex-shrink-0">
                  {log.guardrail_action && (
                    <span className={`font-semibold uppercase tracking-wider text-[10px] ${ACTION_COLORS[log.guardrail_action] || 'text-[#525252]'}`}>
                      {log.guardrail_action}
                    </span>
                  )}
                  {log.rule_triggered && (
                    <p className="text-[#525252] text-[10px] mt-0.5 truncate">{log.rule_triggered}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
