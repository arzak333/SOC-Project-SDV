import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, Monitor, Users, Radio, Pause, ShieldAlert } from 'lucide-react'
import { fetchDashboardStats, fetchDashboardTrendsWithRange, fetchEvents, fetchDashboardHeatmap } from '../api'
import { DashboardStats, SecurityEvent, HeatmapEntry } from '../types'
import StatCard from '../components/StatCard'
import EventVolumeChart from '../components/EventVolumeChart'
import AlertsBySourceChart from '../components/AlertsBySourceChart'
import RecentAlertsTable from '../components/RecentAlertsTable'
import EndpointStatusCard from '../components/EndpointStatusCard'
import AlertDetailModal from '../components/AlertDetailModal'
import SeverityTrendChart from '../components/SeverityTrendChart'
import ActivityHeatmap from '../components/ActivityHeatmap'
import TopSourceIPs from '../components/TopSourceIPs'
import { ToastContainer, toast } from '../components/Toast'
import clsx from 'clsx'

interface DashboardProps {
  realtimeEvents: SecurityEvent[]
}

type TimeRange = '5m' | '15m' | '30m' | '1h' | '6h' | '24h' | '7d' | '30d'

// Source colors for donut chart — matches real infrastructure
const SOURCE_COLORS: Record<string, string> = {
  firewall: '#ef4444',    // red
  endpoint: '#3b82f6',    // blue
  application: '#f59e0b', // amber (GLPI)
}

export default function Dashboard({ realtimeEvents }: DashboardProps) {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<{
    hourly: Array<{ hour: string; count: number }>
    daily: Array<{ date: string; critical: number; high: number; medium: number; low: number }>
  } | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapEntry[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  // Interactive state
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedSourceLabel, setSelectedSourceLabel] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const loadData = useCallback(async (currentTimeRange: TimeRange = timeRange) => {
    try {
      const [statsData, trendsData, eventsData, heatmapResult] = await Promise.all([
        fetchDashboardStats(),
        fetchDashboardTrendsWithRange(currentTimeRange),
        fetchEvents({ severity: 'critical,high', status: 'new', limit: 10 }),
        fetchDashboardHeatmap(),
      ])
      setStats(statsData)
      setTrends(trendsData)
      setCriticalAlerts(eventsData.events || [])
      setHeatmapData(heatmapResult.heatmap || [])
      setRefreshCounter((c: number) => c + 1)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Live mode auto-refresh
  useEffect(() => {
    if (!isLiveMode) return

    const interval = setInterval(() => {
      loadData()
    }, 10000) // Refresh every 10 seconds in live mode

    return () => clearInterval(interval)
  }, [isLiveMode, loadData])

  // Handle time range change
  const handleTimeRangeChange = async (range: TimeRange) => {
    setTimeRange(range)
    setChartLoading(true)
    try {
      const trendsData = await fetchDashboardTrendsWithRange(range)
      setTrends(trendsData)
    } catch (error) {
      console.error('Failed to load trends:', error)
    } finally {
      setChartLoading(false)
    }
  }

  // Handle source selection from pie chart
  const handleSourceSelect = (source: string | null, sourceName: string | null) => {
    setSelectedSource(source)
    setSelectedSourceLabel(sourceName)
    if (source) {
      toast.info(`Filtering by ${sourceName}`)
    }
  }

  // Handle alert click
  const handleAlertClick = (alertId: string) => {
    setSelectedAlertId(alertId)
    setAlertModalOpen(true)
  }

  // Handle live mode toggle
  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode)
    if (!isLiveMode) {
      toast.success('Live mode enabled - auto-refreshing every 10 seconds')
    } else {
      toast.info('Live mode disabled')
    }
  }

  // Handle chart point click
  const handleChartPointClick = (time: string, value: number) => {
    toast.info(`Showing ${value} events at ${time}`)
    navigate(`/events?time=${time}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  // Transform hourly trends to chart format
  const eventVolumeData = trends?.hourly?.map((h: { hour: string; count: number }) => ({
    time: h.hour,
    value: h.count,
  })) || []

  // Transform source data to pie chart format with sourceKey
  const alertsBySourceData = stats?.by_source
    ? Object.entries(stats.by_source).map(([name, value]) => ({
      name: formatSourceName(name),
      value: value as number,
      color: SOURCE_COLORS[name] || '#64748b',
      sourceKey: name,
    }))
    : []

  // Transform recent alerts to table format with sourceKey
  const recentAlerts = [...realtimeEvents, ...criticalAlerts]
    .filter((e) => e.severity === 'critical' || e.severity === 'high')
    .slice(0, 10)
    .map((e) => ({
      id: e.id,
      severity: e.severity,
      alertName: e.description,
      source: e.site_id || formatSourceName(e.source),
      sourceKey: e.source,
      time: new Date(e.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      assignee: e.assigned_to,
    }))

  // Trend indicators: % change vs previous 24h
  const eventsTrend = stats?.events_prev_24h
    ? Math.round(((stats.events_last_24h - stats.events_prev_24h) / stats.events_prev_24h) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Toast container for notifications */}
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time status of the AudioPro Network
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live View Toggle Button */}
          <button
            onClick={toggleLiveMode}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all',
              isLiveMode
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            )}
          >
            {isLiveMode ? (
              <>
                <Radio className="w-4 h-4 live-glow" />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Paused</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Security Events"
          value={stats?.total_events ?? 0}
          trend={eventsTrend !== null ? { value: eventsTrend, isPositive: eventsTrend >= 0 } : undefined}
          linkTo="/events"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Alerts Triggered"
          value={stats?.total_rule_triggers ?? 0}
          linkTo="/alerts"
        />
        <StatCard
          icon={<ShieldAlert className="w-6 h-6" />}
          label="Incidents Ouverts"
          value={stats?.open_incidents ?? 0}
          linkTo="/incidents"
        />
<StatCard
          icon={<Monitor className="w-6 h-6" />}
          label="Endpoints"
          value={stats?.total_sites ?? 0}
          linkTo="/sites"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Sources"
          value={stats?.by_source ? Object.keys(stats.by_source).length : 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EventVolumeChart
            data={eventVolumeData}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            onDataPointClick={handleChartPointClick}
            loading={chartLoading}
          />
        </div>
        <div>
          <AlertsBySourceChart
            data={alertsBySourceData}
            onSourceSelect={handleSourceSelect}
            selectedSource={selectedSource}
          />
        </div>
      </div>

      {/* Severity Trend (visible uniquement pour 7d/30d) */}
      {(timeRange === '7d' || timeRange === '30d') && (
        <SeverityTrendChart data={trends?.daily ?? []} loading={chartLoading} />
      )}

      {/* Recent Alerts Table + Endpoint Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentAlertsTable
            alerts={recentAlerts}
            isLive={isLiveMode}
            onAlertClick={handleAlertClick}
            filteredSource={selectedSource}
            filterLabel={selectedSourceLabel || undefined}
          />
        </div>
        <div className="space-y-4">
          <EndpointStatusCard maxDisplay={5} />
          <TopSourceIPs refreshTrigger={refreshCounter} />
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} />

      {/* Alert Detail Modal */}
      <AlertDetailModal
        eventId={selectedAlertId}
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onUpdate={(updatedEvent) => {
          // Update the local state with the updated event
          setCriticalAlerts((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
          )
        }}
      />
    </div>
  )
}

// Helper functions
function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    firewall: 'Firewall',
    endpoint: 'Endpoints',
    application: 'GLPI',
  }
  return names[source] || source.charAt(0).toUpperCase() + source.slice(1)
}

