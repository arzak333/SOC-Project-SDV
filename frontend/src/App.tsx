import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Alerts from './pages/Alerts'
import Sites from './pages/Sites'
import Playbooks from './pages/Playbooks'
import Login from './pages/Login'
import { SocketProvider } from './hooks/useSocket'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SecurityEvent } from './types'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const [realtimeEvents, setRealtimeEvents] = useState<SecurityEvent[]>([])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SocketProvider
              onNewEvent={(event) => {
                setRealtimeEvents((prev) => [event, ...prev].slice(0, 100))
              }}
            >
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard realtimeEvents={realtimeEvents} />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/sites" element={<Sites />} />
                  <Route path="/playbooks" element={<Playbooks />} />
                </Routes>
              </Layout>
            </SocketProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
