import clsx from 'clsx'
import { EventStatus } from '../types'

interface StatusBadgeProps {
  status: EventStatus
}

const statusStyles: Record<EventStatus, string> = {
  new: 'bg-purple-600 text-white',
  investigating: 'bg-yellow-600 text-white',
  resolved: 'bg-green-600 text-white',
  false_positive: 'bg-gray-600 text-white',
}

const statusLabels: Record<EventStatus, string> = {
  new: 'New',
  investigating: 'Investigating',
  resolved: 'Resolved',
  false_positive: 'False Positive',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
