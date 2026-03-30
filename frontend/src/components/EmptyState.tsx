import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-[#0f62fe] mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[#161616] dark:text-[#f4f4f4] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#525252] dark:text-[#a8a8a8] max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
