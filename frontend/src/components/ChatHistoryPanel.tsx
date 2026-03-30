import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'

interface Session {
  id: number
  title: string
  project_id: number | null
  created_at: string
  updated_at: string
}

interface Props {
  activeSessionId: number | null
  projectId?: number
  onSelect: (id: number) => void
  onNew: () => void
}

function groupByDate(sessions: Session[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: { label: string; items: Session[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const s of sessions) {
    const d = new Date(s.updated_at)
    d.setHours(0, 0, 0, 0)
    if (d >= today) groups[0].items.push(s)
    else if (d >= yesterday) groups[1].items.push(s)
    else groups[2].items.push(s)
  }

  return groups.filter(g => g.items.length > 0)
}

export default function ChatHistoryPanel({ activeSessionId, projectId, onSelect, onNew }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const qc = useQueryClient()

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions', projectId ?? null],
    queryFn: () => {
      const params = projectId !== undefined ? `?project_id=${projectId}` : ''
      return api.get(`/sessions${params}`).then(r => r.data)
    },
    refetchOnWindowFocus: false,
  })

  const deleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await api.delete(`/sessions/${id}`)
    qc.invalidateQueries({ queryKey: ['sessions', projectId ?? null] })
    if (activeSessionId === id) onNew()
  }

  const groups = groupByDate(sessions)

  if (collapsed) {
    return (
      <div className="flex flex-col items-center bg-[#1c1c1c] border-r border-[#393939] w-10 flex-shrink-0 py-3 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          title="Expand history"
          className="text-[#c6c6c6] hover:text-[#f4f4f4] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNew}
          title="New chat"
          className="text-[#c6c6c6] hover:text-[#78a9ff] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#1c1c1c] border-r border-[#393939] w-60 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#393939]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c6c6c6]">History</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            title="New chat"
            className="p-1 rounded-sm text-[#c6c6c6] hover:text-[#78a9ff] hover:bg-[#393939] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse"
            className="p-1 rounded-sm text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#393939] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length === 0 && (
          <p className="text-[11px] text-[#525252] text-center mt-8 px-3">No conversations yet</p>
        )}
        {groups.map(group => (
          <div key={group.label} className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#525252] px-3 pt-3 pb-1">
              {group.label}
            </p>
            {group.items.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left group transition-colors cursor-pointer ${
                  activeSessionId === s.id
                    ? 'bg-[#393939] text-[#f4f4f4]'
                    : 'text-[#c6c6c6] hover:bg-[#2a2a2a] hover:text-[#f4f4f4]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 text-xs truncate min-w-0">{s.title}</span>
                <span
                  onClick={e => deleteSession(e, s.id)}
                  title="Delete"
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:text-[#ff8389] transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
