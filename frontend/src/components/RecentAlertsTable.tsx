import { useState } from 'react'
import { ChevronDown, User } from 'lucide-react'
import clsx from 'clsx'
import { Severity } from '../types'

interface AlertRow {
    id: string
    severity: Severity
    alertName: string
    source: string
    sourceKey?: string
    time: string
    assignee?: string
}

interface RecentAlertsTableProps {
    alerts: AlertRow[]
    isLive?: boolean
    onAlertClick?: (alertId: string) => void
    onAssigneeClick?: (alertId: string, currentAssignee?: string) => void
    filteredSource?: string | null
    filterLabel?: string
}

const severityStyles: Record<Severity, string> = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
}

// Mock analysts for quick assign
const quickAssignOptions = [
    { id: '1', name: 'Jean Dupont' },
    { id: '2', name: 'Marie Martin' },
    { id: '3', name: 'Pierre Bernard' },
]

export default function RecentAlertsTable({
    alerts,
    isLive = true,
    onAlertClick,
    onAssigneeClick,
    filteredSource,
    filterLabel,
}: RecentAlertsTableProps) {
    const [assignDropdownId, setAssignDropdownId] = useState<string | null>(null)

    // Filter alerts if source filter is active
    const displayedAlerts = filteredSource
        ? alerts.filter((a) => a.sourceKey === filteredSource || a.source === filterLabel)
        : alerts

    const handleRowClick = (alertId: string, e: React.MouseEvent) => {
        // Don't trigger row click if clicking on assignee dropdown
        if ((e.target as HTMLElement).closest('.assignee-dropdown')) {
            return
        }
        onAlertClick?.(alertId)
    }

    const handleAssigneeClick = (e: React.MouseEvent, alertId: string) => {
        e.stopPropagation()
        setAssignDropdownId(assignDropdownId === alertId ? null : alertId)
    }

    const handleAssign = (alertId: string, analystName: string) => {
        // This would call the API to update assignment
        console.log(`Assigning ${alertId} to ${analystName}`)
        setAssignDropdownId(null)
    }

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-100">
                        Recent Critical & High Alerts
                    </h3>
                    {filteredSource && filterLabel && (
                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                            Filtered: {filterLabel}
                        </span>
                    )}
                </div>
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
                        {displayedAlerts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                    {filteredSource
                                        ? `No alerts from ${filterLabel}`
                                        : 'No recent alerts'}
                                </td>
                            </tr>
                        ) : (
                            displayedAlerts.map((alert, index) => (
                                <tr
                                    key={alert.id}
                                    onClick={(e) => handleRowClick(alert.id, e)}
                                    className={clsx(
                                        'hover:bg-slate-700/30 transition-all cursor-pointer group',
                                        'animate-fade-in'
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
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
                                        <span className="text-blue-400 group-hover:text-blue-300 font-medium transition-colors">
                                            {alert.alertName}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-slate-400">{alert.source}</td>
                                    <td className="py-3 pr-4 text-slate-400 font-mono text-sm">
                                        {alert.time}
                                    </td>
                                    <td className="py-3 relative assignee-dropdown">
                                        <button
                                            onClick={(e) => handleAssigneeClick(e, alert.id)}
                                            className={clsx(
                                                'flex items-center gap-2 px-2 py-1 rounded transition-colors',
                                                alert.assignee
                                                    ? 'text-slate-300 hover:bg-slate-700'
                                                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-700'
                                            )}
                                        >
                                            <User className="w-4 h-4" />
                                            <span>{alert.assignee || 'Unassigned'}</span>
                                            <ChevronDown className="w-3 h-3" />
                                        </button>

                                        {/* Dropdown menu */}
                                        {assignDropdownId === alert.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                                                <div className="py-1">
                                                    {quickAssignOptions.map((analyst) => (
                                                        <button
                                                            key={analyst.id}
                                                            onClick={() => handleAssign(alert.id, analyst.name)}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                                        >
                                                            {analyst.name}
                                                        </button>
                                                    ))}
                                                    <div className="border-t border-slate-700 mt-1 pt-1">
                                                        <button
                                                            onClick={() => handleAssign(alert.id, '')}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-500 hover:bg-slate-700 transition-colors"
                                                        >
                                                            Unassign
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {onAlertClick && displayedAlerts.length > 0 && (
                <p className="text-xs text-slate-500 text-center mt-4">
                    Click on a row to view alert details
                </p>
            )}
        </div>
    )
}
