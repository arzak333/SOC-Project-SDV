export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type EventStatus = 'new' | 'investigating' | 'resolved' | 'false_positive'
export type EventSource = 'firewall' | 'ids' | 'endpoint' | 'network' | 'email' | 'active_directory' | 'application'

export interface SecurityEvent {
  id: string
  timestamp: string
  source: EventSource
  event_type: string
  severity: Severity
  description: string
  raw_log?: string
  metadata: Record<string, unknown>
  status: EventStatus
  assigned_to?: string
  site_id?: string
  created_at: string
  updated_at?: string
}

export interface AlertRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  condition: {
    event_type?: string
    count?: number
    timeframe?: string
    source?: string
    severity?: string
    site_id?: string
  }
  action: 'email' | 'webhook' | 'log'
  action_config: Record<string, unknown>
  severity: string
  created_at: string
  last_triggered?: string
  trigger_count: number
}

export interface DashboardStats {
  total_events: number
  events_last_24h: number
  events_prev_24h: number
  critical_open: number
  critical_prev_24h: number
  total_rule_triggers: number
  active_alerts: number
  total_sites: number
  open_incidents: number
  by_status: Record<string, number>
  by_severity: Record<string, number>
  by_source: Record<string, number>
}

export interface TopIP {
  ip: string
  count: number
  critical: number
  high: number
}

export interface HeatmapEntry {
  day: number   // 0=Sun, 1=Mon ... 6=Sat
  hour: number  // 0-23
  count: number
}

export interface SiteSummary {
  site_id: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

// GLPI Asset types
export interface GLPIAsset {
  id: number
  name: string
  comment: string | null
  serial: string | null
  otherserial: string | null
  contact: string | null
  date_creation: string
  date_mod: string
  entities_id: string
  states_id: number
  is_deleted: number
}

// Endpoint/Center types
export type EndpointStatus = 'online' | 'offline' | 'degraded'

export interface Endpoint {
  id: string
  site_id: string
  name: string
  location: string
  ip_address: string
  status: EndpointStatus
  health: number // 0-100
  last_seen: string
  event_count_24h: number
  critical_alerts: number
  type: 'center' | 'server' | 'workstation'
}

// Comment/Note type for alerts
export interface AlertComment {
  id: string
  event_id: string
  author: string
  content: string
  created_at: string
}

// Timeline event for alert detail
export interface TimelineEvent {
  id: string
  timestamp: string
  action: string
  actor: string
  details?: string
}

// Filter types
export interface DashboardFilters {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d' | 'custom'
  severity?: Severity[]
  source?: EventSource[]
  search?: string
}

// Analysts for assignment
export interface Analyst {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'analyst' | 'supervisor' | 'admin'
}

// Incident types
export type IncidentStatus = 'new' | 'open' | 'investigating' | 'resolved' | 'false_positive'

export interface Incident {
  id: string
  title: string
  description?: string
  status: IncidentStatus
  severity: Severity
  alert_rule_id?: string
  assigned_to?: string | null
  event_count: number
  created_at: string
  updated_at?: string
  resolved_at?: string
  events?: SecurityEvent[] // populated when fetching specific incident
}
// Playbook types
export type PlaybookStatus = 'active' | 'draft' | 'archived'
export type PlaybookTrigger = 'manual' | 'alert_rule' | 'scheduled'
export type PlaybookCategory = 'incident' | 'investigation' | 'remediation' | 'compliance'
export type PlaybookStepType = 'action' | 'condition' | 'notification' | 'manual'
export type PlaybookStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
export type ExecutionStatus = 'in_progress' | 'completed' | 'aborted' | 'failed'

export interface PlaybookStep {
  id: string
  order: number
  name: string
  type: PlaybookStepType
  description: string
  config: Record<string, unknown>
  status?: PlaybookStepStatus
  started_at?: string
  completed_at?: string
  result?: string
}

export interface Playbook {
  id: string
  name: string
  description: string
  status: PlaybookStatus
  trigger: PlaybookTrigger
  triggerConfig?: Record<string, unknown>
  steps: PlaybookStep[]
  lastRun?: string
  triggeredCount: number
  avgDuration?: string
  createdAt: string
  category: PlaybookCategory
}

export interface PlaybookExecution {
  id: string
  playbookId: string
  playbookName?: string
  triggeredByAlertId?: string
  triggeredByEventId?: string
  status: ExecutionStatus
  startedBy: string
  stepsData: PlaybookStep[]
  currentStep: number
  startedAt: string
  completedAt?: string
  result?: string
}
