import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { CheckSquare, Check, X, Clock, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-[#fff2e8] text-[#ff832b] border-[#ff832b]',
  approved: 'bg-[#defbe6] text-[#198038] border-[#198038]',
  rejected: 'bg-[#fff1f1] text-[#da1e28] border-[#da1e28]',
}

export default function ApprovalsPage() {
  const qc = useQueryClient()
  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.get('/alerts/approvals').then(r => r.data),
    refetchInterval: 8000,
  })

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/alerts/approvals/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'approval-count'] }),
  })

  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/alerts/approvals/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', 'approval-count'] }),
  })

  const pending = approvals.filter((a: any) => a.status === 'pending')
  const resolved = approvals.filter((a: any) => a.status !== 'pending')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Approvals"
        description="Review and approve flagged user messages"
        action={
          pending.length > 0 ? (
            <span className="flex items-center gap-1.5 bg-[#fff2e8] border border-[#ff832b] text-[#ff832b] text-xs font-medium px-3 py-1.5 rounded-sm">
              <Clock className="w-3.5 h-3.5" />
              {pending.length} pending
            </span>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {approvals.length === 0 && (
          <EmptyState
            icon={<CheckSquare className="w-10 h-10" />}
            title="No approval requests"
            description="Messages matching approval policies will appear here for review."
          />
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#ff832b] flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5" /> Pending Review ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((a: any) => (
                <div key={a.id} className="border-l-4 border-l-[#ff832b] bg-[#fff2e8] dark:bg-[#ff832b]/10 border border-[#ff832b]/30 rounded-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#ff832b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4]">Rule: <span className="font-semibold">{a.rule_name}</span></span>
                    <span className="text-xs text-[#525252] dark:text-[#a8a8a8] ml-auto">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <blockquote className="border-l-2 border-l-[#ff832b]/40 pl-3 text-sm text-[#161616] dark:text-[#f4f4f4] italic mb-4 leading-relaxed">
                    "{a.original_message}"
                  </blockquote>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve.mutate(a.id)}
                      className="flex items-center gap-1.5 bg-[#198038] hover:bg-[#0e6027] text-white text-xs font-medium px-4 py-2 rounded-sm transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => reject.mutate(a.id)}
                      className="flex items-center gap-1.5 border border-[#da1e28] text-[#da1e28] hover:bg-[#fff1f1] text-xs font-medium px-4 py-2 rounded-sm transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex items-center gap-2 mb-3">
              <CheckSquare className="w-3.5 h-3.5" /> Resolved ({resolved.length})
            </h2>
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
              {resolved.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 px-4 py-3 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 opacity-70">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-sm flex-shrink-0 ${STATUS_STYLES[a.status] || ''}`}>
                    {a.status}
                  </span>
                  <p className="text-sm text-[#525252] dark:text-[#a8a8a8] flex-1 truncate italic">"{a.original_message}"</p>
                  <p className="text-xs text-[#525252] dark:text-[#a8a8a8] flex-shrink-0">{a.rule_name}</p>
                  <p className="text-xs text-[#525252] dark:text-[#a8a8a8] w-36 text-right flex-shrink-0">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
