import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { SecurityEvent } from '../types'

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
  alerts: Array<{ type: string; event?: SecurityEvent; rule?: unknown }>
  clearAlerts: () => void
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  alerts: [],
  clearAlerts: () => {},
})

interface SocketProviderProps {
  children: ReactNode
  onNewEvent?: (event: SecurityEvent) => void
}

export function SocketProvider({ children, onNewEvent }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [alerts, setAlerts] = useState<Array<{ type: string; event?: SecurityEvent; rule?: unknown }>>([])

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      setConnected(true)
      console.log('WebSocket connected')
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
      console.log('WebSocket disconnected')
    })

    newSocket.on('new_event', (event: SecurityEvent) => {
      onNewEvent?.(event)
    })

    newSocket.on('alert', (alertData) => {
      setAlerts((prev) => [...prev, alertData].slice(-10))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [onNewEvent])

  const clearAlerts = () => setAlerts([])

  return (
    <SocketContext.Provider value={{ socket, connected, alerts, clearAlerts }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
