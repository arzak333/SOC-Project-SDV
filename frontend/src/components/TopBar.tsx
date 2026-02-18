import { Bell, User, ChevronDown, Sun, Moon, LogOut, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { fetchEvents } from '../api'
import { SecurityEvent } from '../types'

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
    const { theme, toggleTheme } = useTheme()
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<SecurityEvent[]>([])

    useEffect(() => {
        fetchEvents({ severity: 'critical,high', status: 'new', limit: 8 })
            .then((data) => setNotifications(data.events))
            .catch(() => setNotifications([]))
    }, [])

    const severityIcon = (s: string) => {
        if (s === 'critical') return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        if (s === 'high') return <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        return <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
    }

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-red-500',
        degraded: 'bg-yellow-500',
    }

    return (
        <header className="sticky top-0 z-50 h-14 border-b px-6 flex items-center justify-between transition-colors duration-300"
            style={{
                backgroundColor: 'var(--color-topbar)',
                borderColor: 'var(--color-border)'
            }}
        >
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

                {/* Theme Toggle - Glass Effect */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle flex items-center gap-2 group"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
                            <span className="text-xs text-slate-400 hidden sm:inline">Light</span>
                        </>
                    ) : (
                        <>
                            <Moon className="w-4 h-4 text-blue-400 group-hover:-rotate-12 transition-transform duration-300" />
                            <span className="text-xs text-slate-600 hidden sm:inline">Dark</span>
                        </>
                    )}
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-400" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {notifications.length > 9 ? '9+' : notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                                    <span className="text-sm font-semibold text-slate-200">Recent Alerts</span>
                                    <button
                                        onClick={() => { setShowNotifications(false); navigate('/events', { state: { severity: 'critical,high' } }) }}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        View all
                                    </button>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-slate-500">No new alerts</div>
                                ) : (
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifications.map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={() => { setShowNotifications(false); navigate('/events', { state: { severity: 'critical,high' } }) }}
                                                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-0"
                                            >
                                                {severityIcon(event.severity)}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-200 truncate">{event.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{event.site_id || event.source}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-slate-200">{user?.username || userName}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role || currentRole}</p>
                        </div>
                        <ChevronDown className={clsx('w-4 h-4 text-slate-500 transition-transform', showUserMenu && 'rotate-180')} />
                    </button>

                    {/* User dropdown menu */}
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                                <div className="p-3 border-b border-slate-700">
                                    <p className="text-sm font-medium text-slate-200">{user?.username}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false)
                                            logout()
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
