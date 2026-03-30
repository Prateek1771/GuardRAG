import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  action?: ReactNode
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between px-6 py-5 bg-white dark:bg-[#1a1a1a] border-b border-[#e0e0e0] dark:border-[#393939]">
      <div>
        <h1 className="text-lg font-semibold text-[#161616] dark:text-[#f4f4f4]">{title}</h1>
        {description && <p className="text-xs text-[#525252] dark:text-[#a8a8a8] mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}
