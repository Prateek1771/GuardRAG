import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Building2, Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function CompaniesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/analytics/companies').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post(`/analytics/companies?name=${encodeURIComponent(name)}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setName('') },
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Companies" description="Manage tenant companies" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Add company */}
        <div className="flex gap-2 max-w-sm">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name && create.mutate()}
            placeholder="New company name"
            className="flex-1 bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r border-[#e0e0e0] dark:border-[#393939] px-3 py-2.5 text-sm focus:outline-none placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-sm"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name}
            className="flex items-center gap-1.5 bg-[#0f62fe] hover:bg-[#0043ce] disabled:opacity-50 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Companies table */}
        {companies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-10 h-10" />}
            title="No companies yet"
            description="Add a company to begin setting up multi-tenant access."
          />
        ) : (
          <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm overflow-hidden max-w-2xl">
            <div className="flex items-center gap-4 px-4 py-2.5 bg-[#f4f4f4] dark:bg-[#262626] border-b border-[#e0e0e0] dark:border-[#393939]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] flex-1">Company</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252] dark:text-[#a8a8a8] w-32 text-right">Created</span>
            </div>
            {companies.map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors">
                <Building2 className="w-4 h-4 text-[#0f62fe] flex-shrink-0" />
                <p className="flex-1 font-medium text-[#161616] dark:text-[#f4f4f4] text-sm">{c.name}</p>
                <p className="text-xs text-[#525252] dark:text-[#a8a8a8] w-32 text-right flex-shrink-0">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
