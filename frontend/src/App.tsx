import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Alerts from './pages/Alerts'
import Sites from './pages/Sites'
import { SocketProvider } from './hooks/useSocket'
import { SecurityEvent } from './types'

function App() {
  const [realtimeEvents, setRealtimeEvents] = useState<SecurityEvent[]>([])

  return (
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
        </Routes>
      </Layout>
    </SocketProvider>
  )
}

export default App
