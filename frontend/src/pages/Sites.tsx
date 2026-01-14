import { useEffect, useState } from 'react'
import { MapPin, AlertTriangle } from 'lucide-react'
import { fetchSitesSummary } from '../api'
import { SiteSummary } from '../types'

export default function Sites() {
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSites() {
      try {
        const data = await fetchSitesSummary()
        setSites(data.sites)
      } catch (error) {
        console.error('Failed to load sites:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSites()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sites Overview</h1>
        <p className="text-gray-400">
          {sites.length} site{sites.length !== 1 ? 's' : ''} monitored
        </p>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No site data available yet.</p>
          <p className="text-sm">Sites will appear here once events are ingested with site_id.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard key={site.site_id} site={site} />
          ))}
        </div>
      )}
    </div>
  )
}

interface SiteCardProps {
  site: SiteSummary
}

function SiteCard({ site }: SiteCardProps) {
  const hasHighSeverity = site.critical > 0 || site.high > 0

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 border ${
        hasHighSeverity ? 'border-red-600/50' : 'border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">{site.site_id}</h3>
        </div>
        {hasHighSeverity && (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="text-3xl font-bold mb-4">{site.total}</div>

      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div className="bg-red-600/20 rounded p-2">
          <div className="font-bold text-red-400">{site.critical}</div>
          <div className="text-gray-500 text-xs">Critical</div>
        </div>
        <div className="bg-orange-600/20 rounded p-2">
          <div className="font-bold text-orange-400">{site.high}</div>
          <div className="text-gray-500 text-xs">High</div>
        </div>
        <div className="bg-yellow-600/20 rounded p-2">
          <div className="font-bold text-yellow-400">{site.medium}</div>
          <div className="text-gray-500 text-xs">Medium</div>
        </div>
        <div className="bg-blue-600/20 rounded p-2">
          <div className="font-bold text-blue-400">{site.low}</div>
          <div className="text-gray-500 text-xs">Low</div>
        </div>
      </div>
    </div>
  )
}
