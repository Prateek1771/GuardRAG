import { useState } from 'react'
import { ChevronDown, ChevronUp, FileSearch } from 'lucide-react'

export interface Citation {
  filename: string
  chunk_index: number
  score?: number
  preview: string
}

interface Props {
  citations: Citation[]
}

export default function CitationsPanel({ citations }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!citations.length) return null

  return (
    <div className="mt-2 border border-[#e0e0e0] dark:border-[#393939] bg-[#f4f4f4] dark:bg-[#262626] rounded-sm text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#e0e0e0] dark:hover:bg-[#393939] transition-colors select-none cursor-pointer"
      >
        <span className="flex items-center gap-1.5 text-[#525252] dark:text-[#a8a8a8] font-medium">
          <FileSearch className="w-3.5 h-3.5 text-[#0f62fe]" />
          Sources <span className="text-[#0f62fe] font-semibold">({citations.length})</span>
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-[#525252] dark:text-[#a8a8a8]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[#525252] dark:text-[#a8a8a8]" />
        }
      </button>

      {expanded && (
        <div className="border-t border-[#e0e0e0] dark:border-[#393939]">
          {citations.map((c, i) => (
            <div key={i} className="px-3 py-2.5 border-b border-[#e0e0e0] dark:border-[#393939] last:border-b-0 bg-white dark:bg-[#1a1a1a]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0f62fe] font-medium truncate">
                  [{i + 1}] {c.filename}
                </span>
                {c.score !== undefined && (
                  <span className="text-[10px] text-[#525252] dark:text-[#a8a8a8] flex-shrink-0">
                    Score: {c.score.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-[#525252] dark:text-[#a8a8a8] mt-1 leading-relaxed line-clamp-2">{c.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
