import { useEffect, useState } from 'react'
import { AlertTriangle, Activity, Shield, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { fetchDashboardStats, fetchDashboardTrends } from '../api'
import { DashboardStats, SecurityEvent } from '../types'
import EventCard from '../components/EventCard'

interface DashboardProps {
  realtimeEvents: SecurityEvent[]
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
}

export default function Dashboard({ realtimeEvents }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<{ daily: Array<{ date: string; critical: number; high: number; medium: number; low: number }> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, trendsData] = await Promise.all([
          fetchDashboardStats(),
          fetchDashboardTrends(),
        ])
        setStats(statsData)
        setTrends(trendsData)
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
    return <div className="text-center py-12">Loading...</div>
  }

  const severityData = stats
    ? Object.entries(stats.by_severity).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard SOC</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Total Events"
          value={stats?.total_events ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Last 24h"
          value={stats?.events_last_24h ?? 0}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Critical Open"
          value={stats?.critical_open ?? 0}
          color="red"
        />
        <StatCard
          icon={<Shield className="w-6 h-6" />}
          label="New Events"
          value={stats?.by_status?.new ?? 0}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Events by Severity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {severityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] ?? '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Trends */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">7-Day Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trends?.daily ?? []}>
              <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
              <YAxis tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} />
              <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} />
              <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} />
              <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Events Feed */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Real-time Events</h2>
        {realtimeEvents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Waiting for new events...
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {realtimeEvents.slice(0, 10).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'red' | 'purple'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-500 border-blue-600/50',
    green: 'bg-green-600/20 text-green-500 border-green-600/50',
    red: 'bg-red-600/20 text-red-500 border-red-600/50',
    purple: 'bg-purple-600/20 text-purple-500 border-purple-600/50',
  }

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
