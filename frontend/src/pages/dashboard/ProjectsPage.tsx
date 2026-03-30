import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Trash2, FileText, Calendar } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

interface Project {
  id: number
  name: string
  description: string | null
  doc_count: number
  created_at: string
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const createProject = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await api.post('/projects', { name: name.trim(), description: description.trim() || null })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
      setName('')
      setDescription('')
    } finally {
      setCreating(false)
    }
  }

  const deleteProject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its documents?')) return
    await api.delete(`/projects/${id}`)
    qc.invalidateQueries({ queryKey: ['projects'] })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Projects"
        description="Organize documents into projects with separate knowledge bases"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#0f62fe] hover:bg-[#0043ce] text-white text-sm px-4 py-2 rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-10 h-10" />}
            title="No projects yet"
            description="Create a project to build a dedicated knowledge base for focused Q&A."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#0f62fe] hover:bg-[#0043ce] text-white text-sm px-4 py-2 rounded-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                className="group bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm p-5 cursor-pointer hover:border-[#0f62fe] dark:hover:border-[#0f62fe] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-[#edf5ff] dark:bg-[#001d6c]/30 rounded-sm flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-[#0f62fe]" />
                  </div>
                  <button
                    onClick={e => deleteProject(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-sm text-[#525252] hover:text-[#da1e28] hover:bg-[#fff1f1] dark:hover:bg-[#2d1515] transition-all cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-sm text-[#161616] dark:text-[#f4f4f4] mb-1 truncate">{p.name}</h3>
                {p.description && (
                  <p className="text-xs text-[#525252] dark:text-[#a8a8a8] line-clamp-2 mb-3">{p.description}</p>
                )}

                <div className="flex items-center gap-4 mt-auto pt-3 border-t border-[#e0e0e0] dark:border-[#393939]">
                  <span className="flex items-center gap-1 text-xs text-[#525252] dark:text-[#a8a8a8]">
                    <FileText className="w-3.5 h-3.5" /> {p.doc_count} doc{p.doc_count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#525252] dark:text-[#a8a8a8]">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-base font-semibold text-[#161616] dark:text-[#f4f4f4] mb-4">New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#525252] dark:text-[#a8a8a8] uppercase tracking-wider mb-1.5">
                  Name *
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createProject()}
                  placeholder="e.g. HR Policies"
                  className="w-full bg-[#f4f4f4] dark:bg-[#262626] border border-[#e0e0e0] dark:border-[#393939] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#0f62fe] text-[#161616] dark:text-[#f4f4f4] placeholder:text-[#a8a8a8]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#525252] dark:text-[#a8a8a8] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this project for?"
                  className="w-full bg-[#f4f4f4] dark:bg-[#262626] border border-[#e0e0e0] dark:border-[#393939] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#0f62fe] text-[#161616] dark:text-[#f4f4f4] placeholder:text-[#a8a8a8] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setName(''); setDescription('') }}
                className="px-4 py-2 text-sm text-[#525252] dark:text-[#a8a8a8] hover:text-[#161616] dark:hover:text-[#f4f4f4] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!name.trim() || creating}
                className="px-4 py-2 text-sm bg-[#0f62fe] hover:bg-[#0043ce] disabled:bg-[#e0e0e0] dark:disabled:bg-[#393939] disabled:text-[#a8a8a8] text-white rounded-sm transition-colors cursor-pointer"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
