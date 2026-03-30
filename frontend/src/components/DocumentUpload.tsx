import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '../lib/api'

interface UploadedFile {
  name: string
  status: 'uploading' | 'done' | 'error'
  chunks?: number
  error?: string
}

interface Props {
  sessionId?: string
  projectId?: number
  onUploaded?: () => void
}

export default function DocumentUpload({ sessionId, projectId, onUploaded }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)

  const uploadFile = async (file: File) => {
    const entry: UploadedFile = { name: file.name, status: 'uploading' }
    setFiles(prev => [...prev, entry])

    const formData = new FormData()
    formData.append('file', file)
    if (sessionId) formData.append('session_id', sessionId)
    if (projectId) formData.append('project_id', String(projectId))

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'done', chunks: res.data.chunks } : f
      ))
      onUploaded?.()
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.name === file.name
          ? { ...f, status: 'error', error: err.response?.data?.detail || 'Upload failed' }
          : f
      ))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }, [sessionId, projectId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile)
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed p-8 text-center transition-colors cursor-pointer rounded-sm ${
          dragging
            ? 'border-[#0f62fe] bg-[#edf5ff] dark:bg-[#001d6c]/30'
            : 'border-[#e0e0e0] dark:border-[#393939] hover:border-[#0f62fe] hover:bg-[#f4f4f4] dark:hover:bg-[#262626]'
        }`}
      >
        <label className="cursor-pointer block">
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-[#0f62fe]' : 'text-[#a8a8a8]'}`} />
          <p className="text-sm font-medium text-[#161616] dark:text-[#f4f4f4]">Drop files here or click to browse</p>
          <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-1">PDF, Word, Excel, TXT supported</p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm px-3 py-2.5">
              <FileText className="w-4 h-4 text-[#0f62fe] flex-shrink-0" />
              <span className="text-sm text-[#161616] dark:text-[#f4f4f4] flex-1 truncate">{f.name}</span>
              {f.status === 'uploading' && (
                <Loader className="w-4 h-4 text-[#0f62fe] animate-spin flex-shrink-0" />
              )}
              {f.status === 'done' && (
                <span className="flex items-center gap-1 text-xs text-[#198038] flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" /> {f.chunks} chunks
                </span>
              )}
              {f.status === 'error' && (
                <span className="flex items-center gap-1 text-xs text-[#da1e28] flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5" /> {f.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
