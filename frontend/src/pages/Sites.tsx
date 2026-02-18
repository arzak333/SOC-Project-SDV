import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Monitor } from 'lucide-react'
import { fetchSitesSummary, fetchAssets } from '../api'
import { SiteSummary, GLPIAsset } from '../types'

export default function Sites() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [assets, setAssets] = useState<GLPIAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState<string | null>(null)

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
    async function loadAssets() {
      try {
        const data = await fetchAssets()
        setAssets(data.assets)
      } catch (error) {
        console.error('Failed to load GLPI assets:', error)
        setAssetsError('Failed to load GLPI assets')
      } finally {
        setAssetsLoading(false)
      }
    }
    loadSites()
    loadAssets()
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

      {/* GLPI Asset Inventory */}
      <div className="flex items-center justify-between mt-10 mb-4">
        <h2 className="text-xl font-bold">GLPI Asset Inventory</h2>
        <p className="text-gray-400">
          {assetsLoading ? '...' : `${assets.length} asset${assets.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {assetsLoading ? (
        <div className="text-center py-8 text-gray-400">Loading assets...</div>
      ) : assetsError ? (
        <div className="text-center py-8 text-red-400">{assetsError}</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No GLPI assets found.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Comment</th>
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} onClick={() => navigate('/events', { state: { site_id: asset.name } })} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-blue-400">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{asset.comment || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{asset.serial || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{asset.entities_id}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(asset.date_creation).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface SiteCardProps {
  site: SiteSummary
}

function SiteCard({ site }: SiteCardProps) {
  const navigate = useNavigate()
  const hasHighSeverity = site.critical > 0 || site.high > 0

  return (
    <div
      onClick={() => navigate('/events', { state: { site_id: site.site_id } })}
      className={`bg-gray-800 rounded-lg p-4 border cursor-pointer hover:border-blue-500/50 transition-colors ${
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
