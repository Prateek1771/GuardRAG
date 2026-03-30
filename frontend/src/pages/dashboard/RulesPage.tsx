import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Pencil, Trash2, Shield, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const ACTION_STYLES: Record<string, string> = {
  BLOCKED:  'bg-[#fff1f1] text-[#da1e28] border-[#da1e28]/40',
  ALERT:    'bg-[#fcf4d6] text-[#b28600] border-[#f1c21b]/40',
  APPROVAL: 'bg-[#fff2e8] text-[#ff832b] border-[#ff832b]/40',
  REDACTED: 'bg-[#f6f2ff] text-[#8a3ffc] border-[#8a3ffc]/40',
}

const EMPTY = { name: '', keywords: '', description: '', action: 'ALERT', scope: 'BOTH' }

const inputCls = 'w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-3 py-2.5 text-sm focus:outline-none placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-sm'
const selectCls = 'w-full bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-3 py-2.5 text-sm focus:outline-none text-[#161616] dark:text-[#f4f4f4] rounded-sm'

export default function RulesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get('/rules').then(r => r.data),
  })

  const save = useMutation({
    mutationFn: (data: any) => editing
      ? api.put(`/rules/${editing.id}`, data)
      : api.post('/rules', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rules'] }); closeForm() },
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })

  const openEdit = (rule: any) => {
    setEditing(rule)
    setForm({ name: rule.name, keywords: rule.keywords.join(', '), description: rule.description, action: rule.action, scope: rule.scope })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY) }

  const handleSubmit = () => {
    save.mutate({
      name: form.name,
      keywords: form.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      description: form.description,
      action: form.action,
      scope: form.scope,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Guardrail Rules"
        description="Configure policies that govern AI responses"
        action={
          <button
            onClick={() => { closeForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-[#0f62fe] hover:bg-[#0043ce] text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Inline form */}
        {showForm && (
          <div className="bg-[#edf5ff] dark:bg-[#001d6c]/30 border border-[#d0e2ff] dark:border-[#0f62fe]/30 rounded-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#161616] dark:text-[#f4f4f4] text-sm">{editing ? 'Edit Rule' : 'New Rule'}</h2>
              <button onClick={closeForm} aria-label="Close form" className="p-1 hover:bg-[#d0e2ff] dark:hover:bg-[#0f62fe]/20 rounded-sm cursor-pointer transition-colors">
                <X className="w-4 h-4 text-[#525252]" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1.5">Rule Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls} placeholder="e.g. Salary Info Block" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1.5">Action</label>
                <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} className={selectCls}>
                  <option>BLOCKED</option><option>ALERT</option><option>APPROVAL</option><option>REDACTED</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1.5">Scope</label>
                <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className={selectCls}>
                  <option>BOTH</option><option>INPUT</option><option>OUTPUT</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1.5">Keywords <span className="text-[#525252] font-normal">(comma-separated)</span></label>
                <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                  className={inputCls} placeholder="salary, compensation, pay grade" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[#161616] dark:text-[#f4f4f4] block mb-1.5">Policy Description <span className="text-[#525252] font-normal">(used by AI for intent detection)</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className={`${inputCls} resize-none`}
                  placeholder="Describe the policy in plain English..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={save.isPending}
                className="bg-[#0f62fe] hover:bg-[#0043ce] disabled:opacity-60 text-white px-5 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer">
                {save.isPending ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
              </button>
              <button onClick={closeForm}
                className="border border-[#e0e0e0] bg-white hover:bg-[#f4f4f4] text-[#161616] px-5 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rules table */}
        {rules.length === 0 && !showForm ? (
          <EmptyState
            icon={<Shield className="w-10 h-10" />}
            title="No rules configured"
            description="Create guardrail rules to control what users can ask and what the AI can respond with."
            action={
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[#0f62fe] hover:bg-[#0043ce] text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Create First Rule
              </button>
            }
          />
        ) : rules.length > 0 && (
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex-1">Rule</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-24">Action</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-16">Scope</span>
              <span className="w-16" />
            </div>

            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-start gap-4 px-4 py-4 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors">
                <Shield className="w-4 h-4 text-[#525252] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#161616] dark:text-[#f4f4f4] text-sm">{rule.name}</span>
                    {rule.is_global && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#fcf4d6] text-[#b28600] border border-[#f1c21b]/40 px-2 py-0.5 rounded-sm">Global</span>
                    )}
                  </div>
                  <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-1">{rule.description}</p>
                  {rule.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rule.keywords.map((kw: string) => (
                        <span key={kw} className="text-[10px] bg-[#f4f4f4] dark:bg-[#262626] text-[#525252] dark:text-[#a8a8a8] border border-[#e0e0e0] dark:border-[#393939] px-2 py-0.5 rounded-sm font-mono">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24 flex-shrink-0">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-sm ${ACTION_STYLES[rule.action] || ''}`}>
                    {rule.action}
                  </span>
                </div>
                <div className="w-16 flex-shrink-0">
                  <span className="text-[10px] text-[#525252] dark:text-[#a8a8a8] uppercase tracking-wider">{rule.scope}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0 w-16 justify-end">
                  <button onClick={() => openEdit(rule)} aria-label={`Edit rule ${rule.name}`}
                    className="p-1.5 text-[#525252] hover:text-[#0f62fe] hover:bg-[#edf5ff] rounded-sm transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (window.confirm(`Delete rule "${rule.name}"?`)) del.mutate(rule.id) }}
                    aria-label={`Delete rule ${rule.name}`}
                    className="p-1.5 text-[#525252] hover:text-[#da1e28] hover:bg-[#fff1f1] rounded-sm transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
