import DocumentUpload from '../../components/DocumentUpload'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { FileText } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function DocumentsPage() {
  const { data: docs = [], refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => api.get('/documents/list').then(r => r.data),
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Documents" description="Upload documents to use in RAG chat" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <DocumentUpload onUploaded={refetch} />

        {docs.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-3">
              Uploaded Documents ({docs.length})
            </h2>
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
              {/* Header */}
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
            description="Upload a document above to enable RAG-based answers in the Chat."
          />
        )}
      </div>
    </div>
  )
}
