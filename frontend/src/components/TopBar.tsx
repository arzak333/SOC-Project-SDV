import { Bell, User, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export type UserRole = 'Analyst' | 'Supervisor' | 'Admin'

interface TopBarProps {
    systemStatus?: 'online' | 'offline' | 'degraded'
    monitoringCount?: number
    currentRole: UserRole
    onRoleChange: (role: UserRole) => void
    userName?: string
    alertCount?: number
}

const roles: UserRole[] = ['Analyst', 'Supervisor', 'Admin']

export default function TopBar({
    systemStatus = 'online',
    monitoringCount = 32,
    currentRole,
    onRoleChange,
    userName = 'Demo User',
    alertCount = 0,
}: TopBarProps) {
    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-red-500',
        degraded: 'bg-yellow-500',
    }

    return (
        <header className="sticky top-0 z-50 h-14 bg-slate-900 border-b border-slate-700 px-6 flex items-center justify-between">
            {/* Left: System Status */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className={clsx('w-2 h-2 rounded-full', statusColors[systemStatus])} />
                    <span className="text-sm text-slate-300 uppercase tracking-wide">
                        System {systemStatus}
                    </span>
                </div>
                <span className="text-slate-500">|</span>
                <span className="text-sm text-slate-400">
                    Monitoring <span className="text-slate-200 font-medium">{monitoringCount} Centers</span>
                </span>
            </div>

            {/* Right: Role switcher, notifications, user */}
            <div className="flex items-center gap-4">
                {/* Role Switcher */}
                <div className="flex items-center gap-1 text-sm">
                    <span className="text-slate-400 mr-2">VIEW AS</span>
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={clsx(
                                'px-3 py-1.5 rounded-md transition-colors',
                                currentRole === role
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-slate-400" />
                    {alertCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {alertCount > 9 ? '9+' : alertCount}
                        </span>
                    )}
                </button>

                {/* User Profile */}
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-slate-200">{userName}</p>
                        <p className="text-xs text-slate-500">{currentRole}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
            </div>
        </header>
    )
}
