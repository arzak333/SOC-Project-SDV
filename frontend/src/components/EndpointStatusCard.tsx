import { useState } from 'react'
import { Server, Activity, AlertTriangle, ChevronRight, RefreshCw, FileText, Search } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import { Endpoint, EndpointStatus as EndpointStatusType } from '../types'

interface EndpointStatusCardProps {
    endpoints?: Endpoint[]
    loading?: boolean
    onEndpointClick?: (endpoint: Endpoint) => void
    maxDisplay?: number
}

// French audioprothesiste center names and locations
const FRENCH_CENTERS: Array<{ name: string; location: string; region: string }> = [
    { name: 'AudioPro Paris Opera', location: 'Paris', region: 'Ile-de-France' },
    { name: 'AudioPro Lyon Part-Dieu', location: 'Lyon', region: 'Auvergne-Rhone-Alpes' },
    { name: 'AudioPro Marseille Vieux-Port', location: 'Marseille', region: 'Provence-Alpes-Cote d\'Azur' },
    { name: 'AudioPro Toulouse Capitole', location: 'Toulouse', region: 'Occitanie' },
    { name: 'AudioPro Nice Promenade', location: 'Nice', region: 'Provence-Alpes-Cote d\'Azur' },
    { name: 'AudioPro Nantes Graslin', location: 'Nantes', region: 'Pays de la Loire' },
    { name: 'AudioPro Strasbourg Centre', location: 'Strasbourg', region: 'Grand Est' },
    { name: 'AudioPro Montpellier Comedie', location: 'Montpellier', region: 'Occitanie' },
    { name: 'AudioPro Bordeaux Saint-Jean', location: 'Bordeaux', region: 'Nouvelle-Aquitaine' },
    { name: 'AudioPro Lille Flandres', location: 'Lille', region: 'Hauts-de-France' },
    { name: 'AudioPro Rennes Republique', location: 'Rennes', region: 'Bretagne' },
    { name: 'AudioPro Reims Cathedrale', location: 'Reims', region: 'Grand Est' },
    { name: 'AudioPro Le Havre Plage', location: 'Le Havre', region: 'Normandie' },
    { name: 'AudioPro Saint-Etienne Centre', location: 'Saint-Etienne', region: 'Auvergne-Rhone-Alpes' },
    { name: 'AudioPro Toulon Port', location: 'Toulon', region: 'Provence-Alpes-Cote d\'Azur' },
    { name: 'AudioPro Grenoble Bastille', location: 'Grenoble', region: 'Auvergne-Rhone-Alpes' },
    { name: 'AudioPro Dijon Centre', location: 'Dijon', region: 'Bourgogne-Franche-Comte' },
    { name: 'AudioPro Angers Centre', location: 'Angers', region: 'Pays de la Loire' },
    { name: 'AudioPro Nimes Arenes', location: 'Nimes', region: 'Occitanie' },
    { name: 'AudioPro Clermont-Ferrand Place de Jaude', location: 'Clermont-Ferrand', region: 'Auvergne-Rhone-Alpes' },
    { name: 'AudioPro Le Mans Jacobins', location: 'Le Mans', region: 'Pays de la Loire' },
    { name: 'AudioPro Aix-en-Provence Rotonde', location: 'Aix-en-Provence', region: 'Provence-Alpes-Cote d\'Azur' },
    { name: 'AudioPro Brest Siam', location: 'Brest', region: 'Bretagne' },
    { name: 'AudioPro Tours Centre', location: 'Tours', region: 'Centre-Val de Loire' },
    { name: 'AudioPro Amiens Centre', location: 'Amiens', region: 'Hauts-de-France' },
    { name: 'AudioPro Limoges Centre', location: 'Limoges', region: 'Nouvelle-Aquitaine' },
    { name: 'AudioPro Perpignan Centre', location: 'Perpignan', region: 'Occitanie' },
    { name: 'AudioPro Metz Centre', location: 'Metz', region: 'Grand Est' },
    { name: 'AudioPro Besancon Centre', location: 'Besancon', region: 'Bourgogne-Franche-Comte' },
    { name: 'AudioPro Orleans Centre', location: 'Orleans', region: 'Centre-Val de Loire' },
]

// Generate mock endpoint data
function generateMockEndpoints(): Endpoint[] {
    return FRENCH_CENTERS.slice(0, 10).map((center, index) => {
        const statuses: EndpointStatusType[] = ['online', 'online', 'online', 'online', 'degraded', 'offline']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        return {
            id: `endpoint-${index + 1}`,
            site_id: `AUDIO_${String(index + 1).padStart(3, '0')}`,
            name: center.name,
            location: center.location,
            ip_address: `192.168.${index + 1}.1`,
            status,
            health: status === 'online' ? 85 + Math.floor(Math.random() * 15) :
                    status === 'degraded' ? 40 + Math.floor(Math.random() * 30) : 0,
            last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            event_count_24h: Math.floor(Math.random() * 500) + 50,
            critical_alerts: status === 'offline' ? Math.floor(Math.random() * 5) + 1 :
                            status === 'degraded' ? Math.floor(Math.random() * 3) : 0,
            type: 'center',
        }
    })
}

const statusConfig: Record<EndpointStatusType, { color: string; bg: string; label: string }> = {
    online: { color: 'text-green-400', bg: 'bg-green-500', label: 'Online' },
    offline: { color: 'text-red-400', bg: 'bg-red-500', label: 'Offline' },
    degraded: { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Degraded' },
}

interface EndpointDetailModalProps {
    endpoint: Endpoint | null
    isOpen: boolean
    onClose: () => void
}

function EndpointDetailModal({ endpoint, isOpen, onClose }: EndpointDetailModalProps) {
    if (!endpoint) return null

    const config = statusConfig[endpoint.status]

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={endpoint.name} size="lg">
            <div className="p-6 space-y-6">
                {/* Status header */}
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={clsx('w-3 h-3 rounded-full', config.bg)} />
                        <span className={clsx('font-medium', config.color)}>{config.label}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-100">{endpoint.health}%</p>
                        <p className="text-xs text-slate-500">Health Score</p>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Site ID</p>
                        <p className="font-mono text-slate-200">{endpoint.site_id}</p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">IP Address</p>
                        <p className="font-mono text-slate-200">{endpoint.ip_address}</p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Location</p>
                        <p className="text-slate-200">{endpoint.location}</p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Last Seen</p>
                        <p className="text-slate-200">
                            {new Date(endpoint.last_seen).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Events (24h)</p>
                        <p className="text-slate-200">{endpoint.event_count_24h}</p>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Critical Alerts</p>
                        <p className={clsx(
                            'font-medium',
                            endpoint.critical_alerts > 0 ? 'text-red-400' : 'text-green-400'
                        )}>
                            {endpoint.critical_alerts}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Quick Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
                            <FileText className="w-4 h-4" />
                            View Logs
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
                            <RefreshCw className="w-4 h-4" />
                            Restart Services
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
                            <Search className="w-4 h-4" />
                            Investigate
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default function EndpointStatusCard({
    endpoints: propEndpoints,
    loading = false,
    onEndpointClick,
    maxDisplay = 5,
}: EndpointStatusCardProps) {
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    // Use provided endpoints or generate mock data
    const endpoints = propEndpoints || generateMockEndpoints()
    const displayedEndpoints = endpoints.slice(0, maxDisplay)

    // Calculate stats
    const onlineCount = endpoints.filter((e) => e.status === 'online').length
    const degradedCount = endpoints.filter((e) => e.status === 'degraded').length
    const offlineCount = endpoints.filter((e) => e.status === 'offline').length

    const handleEndpointClick = (endpoint: Endpoint) => {
        if (onEndpointClick) {
            onEndpointClick(endpoint)
        } else {
            setSelectedEndpoint(endpoint)
            setModalOpen(true)
        }
    }

    return (
        <>
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-100">
                            Monitored Endpoints Status
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-slate-400">{onlineCount} Online</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-slate-400">{degradedCount} Degraded</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-slate-400">{offlineCount} Offline</span>
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayedEndpoints.map((endpoint) => {
                            const config = statusConfig[endpoint.status]
                            return (
                                <div
                                    key={endpoint.id}
                                    onClick={() => handleEndpointClick(endpoint)}
                                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx('w-2.5 h-2.5 rounded-full', config.bg)} />
                                        <div>
                                            <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                                {endpoint.name}
                                            </p>
                                            <p className="text-xs text-slate-500">{endpoint.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                <Activity className="w-3 h-3 text-slate-500" />
                                                <span className="text-sm text-slate-400">
                                                    {endpoint.health}%
                                                </span>
                                            </div>
                                            {endpoint.critical_alerts > 0 && (
                                                <div className="flex items-center gap-1 text-red-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="text-xs">{endpoint.critical_alerts} alerts</span>
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {endpoints.length > maxDisplay && (
                    <button className="w-full mt-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        View all {endpoints.length} endpoints
                    </button>
                )}
            </div>

            <EndpointDetailModal
                endpoint={selectedEndpoint}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    )
}
