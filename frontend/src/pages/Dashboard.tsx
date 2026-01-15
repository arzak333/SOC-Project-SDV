import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Monitor, Users } from 'lucide-react'
import { fetchDashboardStats, fetchDashboardTrends, fetchEvents } from '../api'
import { DashboardStats, SecurityEvent } from '../types'
import StatCard from '../components/StatCard'
import EventVolumeChart from '../components/EventVolumeChart'
import AlertsBySourceChart from '../components/AlertsBySourceChart'
import RecentAlertsTable from '../components/RecentAlertsTable'

interface DashboardProps {
  realtimeEvents: SecurityEvent[]
}

// Source colors for donut chart
const SOURCE_COLORS: Record<string, string> = {
  application: '#22c55e', // green - Apps (CRM)
  firewall: '#ef4444',    // red
  ids: '#3b82f6',         // blue - Servers
  endpoint: '#f59e0b',    // orange - Workstations
  network: '#8b5cf6',     // purple
  email: '#06b6d4',       // cyan
  active_directory: '#ec4899', // pink
}

export default function Dashboard({ realtimeEvents }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<{ hourly: Array<{ hour: string; count: number }> } | null>(null)
  const [criticalAlerts, setCriticalAlerts] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, trendsData, eventsData] = await Promise.all([
          fetchDashboardStats(),
          fetchDashboardTrends(),
          fetchEvents({ severity: 'critical,high', status: 'new', limit: 10 }),
        ])
        setStats(statsData)
        setTrends(trendsData)
        setCriticalAlerts(eventsData.events || [])
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  // From line 63 to 78 this make sure to fetch data from the API anf if there is none it will generate fake data
  // Transform hourly trends to chart format
  const eventVolumeData = trends?.hourly?.map((h: { hour: string; count: number }) => ({
    time: h.hour,
    value: h.count,
  })) || generateMockHourlyData()

  // Transform source data to pie chart format
  const alertsBySourceData = stats?.by_source
    ? Object.entries(stats.by_source).map(([name, value]) => ({
      name: formatSourceName(name),
      value: value as number,
      color: SOURCE_COLORS[name] || '#64748b',
    }))
    : generateMockSourceData()

  // Transform recent alerts to table format
  const recentAlerts = [...realtimeEvents, ...criticalAlerts]
    .filter((e) => e.severity === 'critical' || e.severity === 'high')
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      severity: e.severity,
      alertName: e.description,
      source: e.site_id || formatSourceName(e.source),
      time: new Date(e.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      assignee: e.assigned_to,
    }))

  // Calculate trend percentages (mock for now)
  const yesterdayEvents = stats?.total_events ? Math.round(stats.total_events * 0.88) : 0
  const eventsTrend = stats?.total_events
    ? parseFloat((((stats.total_events - yesterdayEvents) / yesterdayEvents) * 100).toFixed(1))
    : 12.5

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time status of the AudioPro Network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Last 24h
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Live View
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Security Events"
          value={stats?.total_events ?? 14203}
          trend={{ value: eventsTrend, isPositive: true }}
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Active Alerts"
          value={stats?.critical_open ?? 23}
          trend={{ value: 5.2, isPositive: false }}
        />
        <StatCard
          icon={<Monitor className="w-6 h-6" />}
          label="Endpoints Monitored"
          value={342}
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="CRM User Sessions"
          value={128}
          trend={{ value: 0.8, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EventVolumeChart data={eventVolumeData} />
        </div>
        <div>
          <AlertsBySourceChart data={alertsBySourceData} />
        </div>
      </div>

      {/* Recent Alerts Table */}
      <RecentAlertsTable alerts={recentAlerts} isLive={true} />
    </div>
  )
}

// Helper functions
function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    application: 'Apps (CRM)',
    firewall: 'Firewalls',
    ids: 'Servers',
    endpoint: 'Workstations',
    network: 'Network',
    email: 'Email',
    active_directory: 'Active Directory',
  }
  return names[source] || source.charAt(0).toUpperCase() + source.slice(1)
}

// From line 179 to 202 those are generated Fak Data for the Dashboard to diplay information
// This part generates fake hourly data for the area chart
function generateMockHourlyData() {
  const hours = []
  for (let i = 0; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0') + ':00'
    // Simulate higher activity during work hours
    let value = 500
    if (i >= 6 && i <= 12) value = 1500 + Math.random() * 2000
    else if (i >= 13 && i <= 18) value = 1000 + Math.random() * 1000
    hours.push({ time: hour, value: Math.round(value) })
  }
  return hours
}

function generateMockSourceData() {
  return [
    { name: 'Apps (CRM)', value: 35, color: '#22c55e' },
    { name: 'Firewalls', value: 30, color: '#ef4444' },
    { name: 'Servers', value: 20, color: '#3b82f6' },
    { name: 'Workstations', value: 15, color: '#f59e0b' },
  ]
}
