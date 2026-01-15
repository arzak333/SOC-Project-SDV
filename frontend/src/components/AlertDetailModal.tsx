import { useState, useEffect } from 'react'
import {
  Clock,
  MapPin,
  Server,
  User,
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  ArrowUpCircle,
  MessageSquare,
  Send,
} from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { toast } from './Toast'
import { SecurityEvent, Severity, EventStatus, AlertComment, Analyst, TimelineEvent } from '../types'
import { fetchEvent, updateEventStatus, fetchEventComments, addEventComment } from '../api'

interface AlertDetailModalProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (event: SecurityEvent) => void
}

type TabId = 'overview' | 'timeline' | 'rawdata' | 'actions'

const tabs: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'rawdata', label: 'Raw Data', icon: FileText },
  { id: 'actions', label: 'Actions', icon: CheckCircle },
]

const severityStyles: Record<Severity, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
}

const statusStyles: Record<EventStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  investigating: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  resolved: { bg: 'bg-green-500/20', text: 'text-green-400' },
  false_positive: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
}

// Mock analysts for demo
const mockAnalysts: Analyst[] = [
  { id: '1', name: 'Jean Dupont', email: 'j.dupont@audiopro.fr', role: 'analyst' },
  { id: '2', name: 'Marie Martin', email: 'm.martin@audiopro.fr', role: 'analyst' },
  { id: '3', name: 'Pierre Bernard', email: 'p.bernard@audiopro.fr', role: 'supervisor' },
  { id: '4', name: 'Sophie Durand', email: 's.durand@audiopro.fr', role: 'admin' },
]

// Mock timeline for demo
function generateMockTimeline(event: SecurityEvent): TimelineEvent[] {
  const baseTime = new Date(event.timestamp)
  return [
    {
      id: '1',
      timestamp: baseTime.toISOString(),
      action: 'Event detected',
      actor: 'System',
      details: `${event.source} reported ${event.event_type}`,
    },
    {
      id: '2',
      timestamp: new Date(baseTime.getTime() + 60000).toISOString(),
      action: 'Alert created',
      actor: 'Alert Engine',
      details: `Severity: ${event.severity}`,
    },
    ...(event.status !== 'new'
      ? [
          {
            id: '3',
            timestamp: new Date(baseTime.getTime() + 120000).toISOString(),
            action: 'Status changed to investigating',
            actor: event.assigned_to || 'Analyst',
          },
        ]
      : []),
  ]
}

export default function AlertDetailModal({
  eventId,
  isOpen,
  onClose,
  onUpdate,
}: AlertDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [event, setEvent] = useState<SecurityEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<AlertComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [analysts] = useState<Analyst[]>(mockAnalysts)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])

  useEffect(() => {
    if (isOpen && eventId) {
      loadEventData()
    }
  }, [isOpen, eventId])

  async function loadEventData() {
    if (!eventId) return
    setLoading(true)
    try {
      const eventData = await fetchEvent(eventId)
      setEvent(eventData)
      setTimeline(generateMockTimeline(eventData))

      // Try to load comments (may fail if endpoint not implemented)
      try {
        const commentsData = await fetchEventComments(eventId)
        setComments(commentsData.comments || [])
      } catch {
        setComments([])
      }
    } catch (error) {
      console.error('Failed to load event:', error)
      toast.error('Failed to load alert details')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: EventStatus) {
    if (!event) return
    setSaving(true)
    try {
      const updated = await updateEventStatus(event.id, { status: newStatus })
      setEvent(updated)
      onUpdate?.(updated)
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)

      // Add to timeline
      setTimeline((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: `Status changed to ${newStatus}`,
          actor: 'Current User',
        },
      ])
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssign(analystId: string) {
    if (!event) return
    const analyst = analysts.find((a) => a.id === analystId)
    if (!analyst) return

    setSaving(true)
    try {
      const updated = await updateEventStatus(event.id, { assigned_to: analyst.name })
      setEvent(updated)
      onUpdate?.(updated)
      toast.success(`Assigned to ${analyst.name}`)

      setTimeline((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: `Assigned to ${analyst.name}`,
          actor: 'Current User',
        },
      ])
    } catch (error) {
      console.error('Failed to assign:', error)
      toast.error('Failed to assign analyst')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddComment() {
    if (!event || !newComment.trim()) return
    try {
      // Try API first, fallback to local
      try {
        const comment = await addEventComment(event.id, newComment)
        setComments((prev) => [...prev, comment])
      } catch {
        // Fallback: add locally
        const localComment: AlertComment = {
          id: Date.now().toString(),
          event_id: event.id,
          author: 'Demo User',
          content: newComment,
          created_at: new Date().toISOString(),
        }
        setComments((prev) => [...prev, localComment])
      }
      setNewComment('')
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Alert Details">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : event ? (
        <div className="flex flex-col">
          {/* Header info */}
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={clsx(
                      'px-3 py-1 text-sm font-medium rounded-full',
                      severityStyles[event.severity]
                    )}
                  >
                    {event.severity.toUpperCase()}
                  </span>
                  <span
                    className={clsx(
                      'px-3 py-1 text-sm rounded-full',
                      statusStyles[event.status].bg,
                      statusStyles[event.status].text
                    )}
                  >
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{event.description}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(event.timestamp).toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Server className="w-4 h-4" />
                    {event.source}
                  </span>
                  {event.site_id && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.site_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400 -mb-px'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Affected assets */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                    Affected Assets
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Source IP</p>
                      <p className="font-mono text-slate-200">
                        {(event.metadata as Record<string, unknown>)?.source_ip as string || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Hostname</p>
                      <p className="font-mono text-slate-200">
                        {(event.metadata as Record<string, unknown>)?.hostname as string || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">User</p>
                      <p className="text-slate-200">
                        {(event.metadata as Record<string, unknown>)?.user as string || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Event Type</p>
                      <p className="text-slate-200">{event.event_type}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                    Assignment
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300">
                        {event.assigned_to || 'Unassigned'}
                      </span>
                    </div>
                    <select
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value=""
                      onChange={(e) => handleAssign(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Assign to...</option>
                      {analysts.map((analyst) => (
                        <option key={analyst.id} value={analyst.id}>
                          {analyst.name} ({analyst.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Notes & Comments
                  </h4>
                  <div className="space-y-3 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-300">
                              {comment.author}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(comment.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={item.id} className="relative pl-10">
                      <div
                        className={clsx(
                          'absolute left-2 w-4 h-4 rounded-full border-2 bg-slate-800',
                          index === 0 ? 'border-blue-500' : 'border-slate-600'
                        )}
                      />
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-200">{item.action}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">By: {item.actor}</p>
                        {item.details && (
                          <p className="text-sm text-slate-500 mt-1">{item.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rawdata' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Raw Log
                  </h4>
                  <pre className="p-4 bg-slate-900 rounded-lg text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {event.raw_log || 'No raw log data available'}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Metadata (JSON)
                  </h4>
                  <pre className="p-4 bg-slate-900 rounded-lg text-sm text-blue-400 font-mono overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                    Change Status
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange('investigating')}
                      disabled={saving || event.status === 'investigating'}
                      className={clsx(
                        'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                        event.status === 'investigating'
                          ? 'bg-yellow-500/30 text-yellow-400 cursor-default'
                          : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                      )}
                    >
                      <AlertTriangle className="w-5 h-5" />
                      Investigating
                    </button>
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      disabled={saving || event.status === 'resolved'}
                      className={clsx(
                        'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                        event.status === 'resolved'
                          ? 'bg-green-500/30 text-green-400 cursor-default'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      )}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange('false_positive')}
                      disabled={saving || event.status === 'false_positive'}
                      className={clsx(
                        'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                        event.status === 'false_positive'
                          ? 'bg-slate-500/30 text-slate-400 cursor-default'
                          : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                      )}
                    >
                      <FileText className="w-5 h-5" />
                      False Positive
                    </button>
                    <button
                      onClick={() => toast.info('Escalation feature coming soon')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-medium transition-all"
                    >
                      <ArrowUpCircle className="w-5 h-5" />
                      Escalate
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                    Quick Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toast.info('Creating ticket...')}
                      className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Create Ticket
                    </button>
                    <button
                      onClick={() => toast.info('Blocking IP...')}
                      className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Block Source IP
                    </button>
                    <button
                      onClick={() => toast.info('Isolating endpoint...')}
                      className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Isolate Endpoint
                    </button>
                    <button
                      onClick={() => toast.info('Running playbook...')}
                      className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Run Playbook
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-400">Event not found</div>
      )}
    </Modal>
  )
}
