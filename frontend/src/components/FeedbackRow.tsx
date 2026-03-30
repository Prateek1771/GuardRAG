import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react'

interface Props {
  messageId: string
}

export default function FeedbackRow({ messageId: _messageId }: Props) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [reported, setReported] = useState(false)

  return (
    <div className="flex items-center justify-end gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[10px] text-[#525252] mr-2 select-none">Was this helpful?</span>
      <button
        onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
        title="Helpful"
        className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
          feedback === 'up'
            ? 'text-[#0f62fe] bg-[#edf5ff]'
            : 'text-[#525252] hover:bg-[#edf5ff] hover:text-[#0f62fe]'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
        title="Not helpful"
        className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
          feedback === 'down'
            ? 'text-[#da1e28] bg-[#fff1f1]'
            : 'text-[#525252] hover:bg-[#fff1f1] hover:text-[#da1e28]'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setReported(true)}
        title="Report issue"
        disabled={reported}
        className={`p-1.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1 text-[10px] ml-1 ${
          reported
            ? 'text-[#525252] opacity-50 cursor-default'
            : 'text-[#525252] hover:bg-[#fff1f1] hover:text-[#da1e28]'
        }`}
      >
        <Flag className="w-3 h-3" />
        {reported ? 'Reported' : 'Report'}
      </button>
    </div>
  )
}
