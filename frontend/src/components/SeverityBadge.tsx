import clsx from 'clsx'
import { Severity } from '../types'

interface SeverityBadgeProps {
  severity: Severity
  size?: 'sm' | 'md'
}

const severityStyles: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-600 text-white',
  low: 'bg-blue-600 text-white',
}

export default function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium uppercase',
        severityStyles[severity],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {severity}
    </span>
  )
}
