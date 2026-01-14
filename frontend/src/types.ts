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
  critical_open: number
  by_status: Record<string, number>
  by_severity: Record<string, number>
  by_source: Record<string, number>
}

export interface SiteSummary {
  site_id: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
}
