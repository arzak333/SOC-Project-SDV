import clsx from 'clsx'
import { Severity } from '../types'

interface AlertRow {
    id: string
    severity: Severity
    alertName: string
    source: string
    time: string
    assignee?: string
}

interface RecentAlertsTableProps {
    alerts: AlertRow[]
    isLive?: boolean
}

const severityStyles: Record<Severity, string> = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
}

export default function RecentAlertsTable({ alerts, isLive = true }: RecentAlertsTableProps) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                    Recent Critical & High Alerts
                </h3>
                {isLive && (
                    <span className="flex items-center gap-2 text-xs">
                        <span className="live-pulse w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-slate-400">LIVE</span>
                        <span className="text-slate-500">FEED</span>
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
                            <th className="pb-3 pr-4">Severity</th>
                            <th className="pb-3 pr-4">Alert Name</th>
                            <th className="pb-3 pr-4">Source</th>
                            <th className="pb-3 pr-4">Time</th>
                            <th className="pb-3">Assignee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {alerts.map((alert) => (
                            <tr
                                key={alert.id}
                                className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                            >
                                <td className="py-3 pr-4">
                                    <span
                                        className={clsx(
                                            'px-2 py-1 text-xs font-medium rounded capitalize',
                                            severityStyles[alert.severity]
                                        )}
                                    >
                                        {alert.severity}
                                    </span>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className="text-blue-400 hover:text-blue-300 font-medium">
                                        {alert.alertName}
                                    </span>
                                </td>
                                <td className="py-3 pr-4 text-slate-400">{alert.source}</td>
                                <td className="py-3 pr-4 text-slate-400 font-mono text-sm">
                                    {alert.time}
                                </td>
                                <td className="py-3 text-slate-400">
                                    {alert.assignee || (
                                        <span className="text-slate-600">Unassigned</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
