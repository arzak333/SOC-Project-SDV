import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface StatCardProps {
    icon: ReactNode
    label: string
    value: number | string
    trend?: {
        value: number
        isPositive?: boolean
    }
    onClick?: () => void
    linkTo?: string
    linkParams?: Record<string, string>
}

export default function StatCard({ icon, label, value, trend, onClick, linkTo, linkParams }: StatCardProps) {
    const navigate = useNavigate()
    const isClickable = onClick || linkTo

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else if (linkTo) {
            const params = linkParams ? `?${new URLSearchParams(linkParams).toString()}` : ''
            navigate(`${linkTo}${params}`)
        }
    }

    return (
        <div
            onClick={isClickable ? handleClick : undefined}
            className={clsx(
                'glass-card p-5 transition-all duration-200',
                isClickable && 'cursor-pointer hover:bg-slate-700/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 group'
            )}
        >
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
                <div className="flex items-center gap-2">
                    <div className="p-3 bg-slate-700/50 rounded-lg text-slate-400">
                        {icon}
                    </div>
                    {isClickable && (
                        <ChevronRight className="w-5 h-5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </div>
        </div>
    )
}
