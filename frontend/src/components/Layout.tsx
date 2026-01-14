import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, List, Bell, MapPin, Wifi, WifiOff } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import clsx from 'clsx'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/events', icon: List, label: 'Events' },
  { path: '/alerts', icon: Bell, label: 'Alert Rules' },
  { path: '/sites', icon: MapPin, label: 'Sites' },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { connected, alerts } = useSocket()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="font-bold text-lg">SOC Dashboard</h1>
              <p className="text-xs text-gray-400">Audioprothésistes</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.path === '/alerts' && alerts.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Connection status */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-500">Disconnected</span>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
