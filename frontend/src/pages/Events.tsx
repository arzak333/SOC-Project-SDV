import { useEffect, useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchEvents, updateEventStatus } from '../api'
import { SecurityEvent, EventStatus } from '../types'
import EventCard from '../components/EventCard'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import ExportButton from '../components/ExportButton'
import { exportEventsToCSV, exportEventsReport, exportToJSON } from '../utils/export'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Events() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')

  useEffect(() => {
    loadEvents()
  }, [page, severityFilter, statusFilter, sourceFilter])

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await fetchEvents({
        page,
        per_page: 20,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        search: search || undefined,
      })
      setEvents(data.events)
      setTotalPages(data.pages)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadEvents()
  }

  async function handleStatusChange(eventId: string, newStatus: EventStatus) {
    try {
      const updated = await updateEventStatus(eventId, { status: newStatus })
      setEvents(events.map((e) => (e.id === eventId ? updated : e)))
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(updated)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  return (
    <div className="flex gap-6">
      {/* Events List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Security Events</h1>
          <ExportButton
            onExport={(format) => {
              const stats = {
                total: events.length,
                critical: events.filter((e) => e.severity === 'critical').length,
                high: events.filter((e) => e.severity === 'high').length,
                medium: events.filter((e) => e.severity === 'medium').length,
                low: events.filter((e) => e.severity === 'low').length,
              }
              if (format === 'csv') {
                exportEventsToCSV(events, `security-events-${new Date().toISOString().split('T')[0]}`)
              } else if (format === 'pdf') {
                exportEventsReport(events, stats)
              } else if (format === 'json') {
                exportToJSON(events, `security-events-${new Date().toISOString().split('T')[0]}`)
              }
            }}
            formats={['csv', 'pdf', 'json']}
            disabled={events.length === 0}
          />
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Sources</option>
              <option value="firewall">Firewall</option>
              <option value="ids">IDS</option>
              <option value="endpoint">Endpoint</option>
              <option value="network">Network</option>
              <option value="email">Email</option>
              <option value="active_directory">Active Directory</option>
              <option value="application">Application</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </form>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No events found</div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <div className="w-96 bg-gray-800 rounded-lg border border-gray-700 p-4 h-fit sticky top-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold">Event Details</h2>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <SeverityBadge severity={selectedEvent.severity} />
              <StatusBadge status={selectedEvent.status} />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Type</label>
              <p className="font-medium">{selectedEvent.event_type}</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Source</label>
              <p>{selectedEvent.source}</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Timestamp</label>
              <p>{format(new Date(selectedEvent.timestamp), 'PPpp', { locale: fr })}</p>
            </div>

            {selectedEvent.site_id && (
              <div>
                <label className="text-gray-400 text-sm">Site</label>
                <p className="text-blue-400">{selectedEvent.site_id}</p>
              </div>
            )}

            <div>
              <label className="text-gray-400 text-sm">Description</label>
              <p className="text-sm">{selectedEvent.description}</p>
            </div>

            {selectedEvent.raw_log && (
              <div>
                <label className="text-gray-400 text-sm">Raw Log</label>
                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                  {selectedEvent.raw_log}
                </pre>
              </div>
            )}

            {/* Status Actions */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {(['new', 'investigating', 'resolved', 'false_positive'] as EventStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedEvent.id, status)}
                      disabled={selectedEvent.status === status}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedEvent.status === status
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
