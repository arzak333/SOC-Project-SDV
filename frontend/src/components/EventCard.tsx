import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SecurityEvent } from '../types'
import SeverityBadge from './SeverityBadge'
import StatusBadge from './StatusBadge'

interface EventCardProps {
  event: SecurityEvent
  onClick?: () => void
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={event.severity} size="sm" />
            <StatusBadge status={event.status} />
            <span className="text-gray-400 text-sm">{event.source}</span>
          </div>
          <h3 className="font-medium text-white truncate">{event.event_type}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>{format(new Date(event.timestamp), 'HH:mm:ss', { locale: fr })}</div>
          <div>{format(new Date(event.timestamp), 'dd/MM/yyyy', { locale: fr })}</div>
          {event.site_id && (
            <div className="mt-1 text-xs text-blue-400">{event.site_id}</div>
          )}
        </div>
      </div>
    </div>
  )
}
