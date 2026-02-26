import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { fetchTopIPs } from '../api'
import { TopIP } from '../types'

interface Props {
  refreshTrigger?: number
}

export default function TopSourceIPs({ refreshTrigger }: Props) {
  const [ips, setIps] = useState<TopIP[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopIPs(24)
      .then((data) => setIps(data.top_ips || []))
      .catch(() => setIps([]))
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  const maxCount = ips.length > 0 ? ips[0].count : 1

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-100">Top Source IPs</h3>
        <span className="text-xs text-slate-500 ml-auto">Last 24h</span>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-slate-500">
          Loading...
        </div>
      ) : ips.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
          No IP data available
        </div>
      ) : (
        <div className="space-y-2">
          {ips.map((entry, i) => (
            <div key={entry.ip} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                  <span className="text-sm font-mono text-slate-200 group-hover:text-blue-400 transition-colors">
                    {entry.ip}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.critical > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-400">
                      {entry.critical} crit
                    </span>
                  )}
                  {entry.high > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-500/20 text-orange-400">
                      {entry.high} high
                    </span>
                  )}
                  <span className="text-sm text-slate-400 font-medium w-10 text-right">
                    {entry.count}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    entry.critical > 0
                      ? 'bg-red-500'
                      : entry.high > 0
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
