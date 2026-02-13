import { createContext, useContext, type ReactNode } from 'react'
import { useWebSocketManager, type WebSocketManager } from '../hooks/useWebSocketManager'

const WebSocketContext = createContext<WebSocketManager | null>(null)

type WebSocketProviderProps = {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const manager = useWebSocketManager()

  return (
    <WebSocketContext.Provider value={manager}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket(): WebSocketManager {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export function useSessionWebSocket(sessionId: string) {
  const manager = useWebSocket()

  return {
    send: (message: string) => manager.send(sessionId, message),
    subscribe: (listener: (event: any) => void) => manager.subscribe(sessionId, listener),
    connect: () => manager.connect(sessionId),
    disconnect: () => manager.disconnect(sessionId),
    getState: () => manager.getState(sessionId),
    flushQueue: () => manager.flushQueue(sessionId)
  }
}
