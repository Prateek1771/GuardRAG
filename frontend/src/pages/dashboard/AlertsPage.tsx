import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Bell, CheckCheck, AlertTriangle, ShieldX, Clock, EyeOff } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const ACTION_CONFIG: Record<string, { border: string; icon: React.ReactElement; label: string }> = {
  BLOCKED:  { border: 'border-l-4 border-l-[#da1e28]', icon: <ShieldX className="w-3.5 h-3.5 text-[#da1e28]" />, label: 'BLOCKED' },
  ALERT:    { border: 'border-l-4 border-l-[#f1c21b]', icon: <AlertTriangle className="w-3.5 h-3.5 text-[#b28600]" />, label: 'ALERT' },
  APPROVAL: { border: 'border-l-4 border-l-[#ff832b]', icon: <Clock className="w-3.5 h-3.5 text-[#ff832b]" />, label: 'APPROVAL' },
  REDACTED: { border: 'border-l-4 border-l-[#8a3ffc]', icon: <EyeOff className="w-3.5 h-3.5 text-[#8a3ffc]" />, label: 'REDACTED' },
}

export default function AlertsPage() {
  const qc = useQueryClient()
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then(r => r.data),
    refetchInterval: 10000,
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.post(`/alerts/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', 'alert-count'] }),
  })

  const unreadCount = alerts.filter((a: any) => !a.is_read).length

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Alerts"
        description="Real-time guardrail trigger log"
        action={
          unreadCount > 0 ? (
            <span className="flex items-center gap-1.5 bg-[#fff1f1] dark:bg-[#da1e28]/20 border border-[#da1e28]/40 text-[#da1e28] text-xs font-medium px-3 py-1.5 rounded-sm">
              <Bell className="w-3.5 h-3.5" />
              {unreadCount} unread
            </span>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {alerts.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title="No alerts yet"
            description="Guardrail trigger events will appear here when policies are matched."
          />
        ) : (
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-24">Action</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex-1">Rule / Message</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-36 text-right">Time</span>
              <span className="w-20" />
            </div>

            {alerts.map((alert: any) => {
              const cfg = ACTION_CONFIG[alert.action] || { border: '', icon: null, label: alert.action }
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 px-4 py-3.5 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 transition-colors ${
                    alert.is_read ? 'opacity-60' : 'bg-[#edf5ff]/30 dark:bg-[#0f62fe]/5'
                  } ${cfg.border}`}
                >
                  <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                    {cfg.icon}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#161616] dark:text-[#f4f4f4]">{cfg.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#161616] dark:text-[#f4f4f4]">{alert.rule_name}</span>
                      {!alert.is_read && (
                        <span className="w-1.5 h-1.5 bg-[#0f62fe] rounded-full flex-shrink-0" />
                      )}
                    </div>
                    {alert.message_snippet && (
                      <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-1 border-l-2 border-l-[#e0e0e0] dark:border-l-[#393939] pl-2.5 italic truncate">
                        {alert.message_snippet}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-[#525252] dark:text-[#a8a8a8] w-36 text-right flex-shrink-0">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>

                  <div className="w-20 flex justify-end flex-shrink-0">
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        title="Mark as read"
                        className="p-1.5 text-[#525252] dark:text-[#a8a8a8] hover:text-[#198038] hover:bg-[#defbe6] dark:hover:bg-[#198038]/20 rounded-sm transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
