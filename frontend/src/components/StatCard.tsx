import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface StatCardProps {
    icon: ReactNode
    label: string
    value: number | string
    trend?: {
        value: number
        isPositive?: boolean
    }
}

export default function StatCard({ icon, label, value, trend }: StatCardProps) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        {label}
                    </p>
                    <p className="text-3xl font-bold text-slate-100">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <div
                            className={clsx(
                                'flex items-center gap-1 mt-2 text-sm',
                                trend.isPositive !== false ? 'text-green-400' : 'text-red-400'
                            )}
                        >
                            {trend.isPositive !== false ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{trend.value}%</span>
                            <span className="text-slate-500">from yesterday</span>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg text-slate-400">
                    {icon}
                </div>
            </div>
        </div>
    )
}
