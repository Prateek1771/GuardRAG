import { ShieldX, AlertTriangle, Clock, EyeOff } from 'lucide-react'

interface Props {
  action: 'BLOCKED' | 'ALERT' | 'APPROVAL' | 'REDACTED'
  ruleName?: string | null
  approvalId?: number
}

const CONFIG = {
  BLOCKED: {
    border: 'border-l-4 border-l-[#da1e28]',
    bg: 'bg-[#fff1f1]',
    badgeBg: 'bg-[#da1e28]',
    icon: <ShieldX className="w-4 h-4 text-[#da1e28]" />,
    label: 'Policy Block',
    badgeLabel: 'BLOCKED',
    body: (ruleName?: string | null) =>
      `This message was blocked by policy${ruleName ? `: ${ruleName}` : ''}.`,
    footer: 'Contact your administrator if you believe this was blocked in error.',
  },
  ALERT: {
    border: 'border border-[#f1c21b]',
    bg: 'bg-[#fcf4d6]',
    badgeBg: 'bg-[#b28600]',
    icon: <AlertTriangle className="w-4 h-4 text-[#b28600]" />,
    label: 'Policy Triggered',
    badgeLabel: 'ALERT',
    body: (ruleName?: string | null) =>
      `This message matched a policy${ruleName ? `: ${ruleName}` : ''}. It was logged for administrator review.`,
    footer: null,
  },
  APPROVAL: {
    border: 'border-l-4 border-l-[#ff832b]',
    bg: 'bg-[#fff2e8]',
    badgeBg: 'bg-[#ff832b]',
    icon: <Clock className="w-4 h-4 text-[#ff832b]" />,
    label: 'Pending Admin Approval',
    badgeLabel: 'PENDING REVIEW',
    body: (ruleName?: string | null) =>
      `Your message matched a review policy${ruleName ? `: ${ruleName}` : ''}. It has been queued for administrator review.`,
    footer: 'You will be notified when it is approved or rejected.',
  },
  REDACTED: {
    border: 'border-l-4 border-l-[#8a3ffc]',
    bg: 'bg-[#f6f2ff]',
    badgeBg: 'bg-[#8a3ffc]',
    icon: <EyeOff className="w-4 h-4 text-[#8a3ffc]" />,
    label: 'Content Redacted',
    badgeLabel: 'REDACTED',
    body: (ruleName?: string | null) =>
      `Sensitive content was removed from this response per data protection policy${ruleName ? `: ${ruleName}` : ''}. [REDACTED] markers indicate removed content.`,
    footer: null,
  },
}

export default function GuardrailCard({ action, ruleName, approvalId }: Props) {
  const cfg = CONFIG[action]
  if (!cfg) return null

  return (
    <div className={`${cfg.border} ${cfg.bg} rounded-sm p-3.5 mt-1.5 text-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {cfg.icon}
        <span className="font-semibold text-[#161616] dark:text-[#f4f4f4] text-sm">{cfg.label}</span>
        <span className={`ml-auto ${cfg.badgeBg} text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm`}>
          {cfg.badgeLabel}
        </span>
      </div>
      <p className="text-[#161616] dark:text-[#f4f4f4] text-xs leading-relaxed">{cfg.body(ruleName)}</p>
      {approvalId && (
        <p className="text-[#525252] dark:text-[#a8a8a8] text-xs mt-1.5">Approval ID: <span className="font-mono font-medium">#{approvalId}</span></p>
      )}
      {cfg.footer && (
        <p className="text-[#525252] dark:text-[#a8a8a8] text-xs mt-2 border-t border-black/10 dark:border-white/10 pt-2">{cfg.footer}</p>
      )}
    </div>
  )
}
