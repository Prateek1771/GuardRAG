import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, MessageSquare } from 'lucide-react'
import api from '../../lib/api'
import DocumentUpload from '../../components/DocumentUpload'
import ChatWindow from '../../components/ChatWindow'
import ChatHistoryPanel from '../../components/ChatHistoryPanel'
import EmptyState from '../../components/EmptyState'

interface Project {
  id: number
  name: string
  description: string | null
  doc_count: number
  created_at: string
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'documents' | 'chat'>('documents')
  const [activeChatSessionId, setActiveChatSessionId] = useState<number | null>(null)
  const [chatKey, setChatKey] = useState(0)

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api.get('/projects').then(r => r.data.find((p: Project) => p.id === projectId)),
  })

  const { data: docs = [], refetch: refetchDocs } = useQuery({
    queryKey: ['docs', projectId],
    queryFn: () => api.get(`/documents/list?project_id=${projectId}`).then(r => r.data),
  })

  const handleSessionCreated = (id: number) => {
    setActiveChatSessionId(id)
    // Do NOT increment chatKey here — keeps ChatWindow alive during streaming
    qc.invalidateQueries({ queryKey: ['sessions', projectId] })
  }

  const handleNewChat = () => {
    setActiveChatSessionId(null)
    setChatKey(k => k + 1)
  }

  const handleSelectSession = (id: number) => {
    setActiveChatSessionId(id)
    setChatKey(k => k + 1)
  }

  if (!project) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-white dark:bg-[#1a1a1a] border-b border-[#e0e0e0] dark:border-[#393939]">
        <button
          onClick={() => navigate('/dashboard/projects')}
          className="p-1.5 rounded-sm text-[#525252] hover:text-[#161616] dark:hover:text-[#f4f4f4] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[#161616] dark:text-[#f4f4f4] truncate">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-0.5 truncate">{project.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f4f4f4] dark:bg-[#262626] rounded-sm p-0.5 gap-0.5">
          {(['documents', 'chat'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                tab === t
                  ? 'bg-white dark:bg-[#393939] text-[#161616] dark:text-[#f4f4f4] shadow-sm'
                  : 'text-[#525252] dark:text-[#a8a8a8] hover:text-[#161616] dark:hover:text-[#f4f4f4]'
              }`}
            >
              {t === 'documents' ? <FileText className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'documents' && (
          <div className="flex-1 overflow-auto p-6 space-y-6 h-full">
            <DocumentUpload projectId={projectId} onUploaded={refetchDocs} />

            {docs.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-3">
                  Documents ({docs.length})
                </h2>
                <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex-1">Filename</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-20 text-right">Chunks</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-28 text-right">Uploaded</span>
                  </div>
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-4 px-4 py-3 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors">
                      <FileText className="w-4 h-4 text-[#0f62fe] flex-shrink-0" />
                      <p className="flex-1 text-sm font-medium text-[#161616] dark:text-[#f4f4f4] truncate min-w-0">{doc.filename}</p>
                      <span className="text-xs text-[#525252] dark:text-[#a8a8a8] w-20 text-right flex-shrink-0">{doc.chunks} chunks</span>
                      <span className="text-xs text-[#525252] dark:text-[#a8a8a8] w-28 text-right flex-shrink-0">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {docs.length === 0 && (
              <EmptyState
                icon={<FileText className="w-10 h-10" />}
                title="No documents yet"
                description="Upload documents to build this project's knowledge base."
              />
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div className="flex h-full">
            <ChatHistoryPanel
              activeSessionId={activeChatSessionId}
              projectId={projectId}
              onSelect={handleSelectSession}
              onNew={handleNewChat}
            />
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                key={chatKey}
                projectId={projectId}
                chatSessionId={activeChatSessionId}
                onSessionCreated={handleSessionCreated}
                placeholder={`Ask anything about ${project.name} documents…`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
