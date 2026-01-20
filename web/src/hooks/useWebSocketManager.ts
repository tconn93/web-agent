import { useCallback, useRef, useState } from 'react'
import { config } from '../config'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export type WebSocketConnection = {
  ws: WebSocket | null
  state: ConnectionState
  messageQueue: any[]
  listeners: Set<(event: any) => void>
  reconnectAttempts: number
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

export type WebSocketManager = {
  connections: Map<string, WebSocketConnection>
  connect: (sessionId: string) => void
  disconnect: (sessionId: string) => void
  send: (sessionId: string, message: string) => void
  subscribe: (sessionId: string, listener: (event: any) => void) => () => void
  getState: (sessionId: string) => ConnectionState | null
  flushQueue: (sessionId: string) => void
}

const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

export function useWebSocketManager(): WebSocketManager {
  const connectionsRef = useRef<Map<string, WebSocketConnection>>(new Map())
  const [, forceUpdate] = useState({})

  const getConnection = useCallback((sessionId: string): WebSocketConnection | undefined => {
    return connectionsRef.current.get(sessionId)
  }, [])

  const createConnection = useCallback((sessionId: string): WebSocketConnection => {
    const connection: WebSocketConnection = {
      ws: null,
      state: 'disconnected',
      messageQueue: [],
      listeners: new Set(),
      reconnectAttempts: 0,
      reconnectTimer: null
    }
    connectionsRef.current.set(sessionId, connection)
    return connection
  }, [])

  const notifyListeners = useCallback((sessionId: string, event: any) => {
    const connection = getConnection(sessionId)
    if (connection) {
      connection.listeners.forEach(listener => {
        try {
          listener(event)
        } catch (err) {
          console.error('Error in WebSocket listener:', err)
        }
      })
    }
  }, [getConnection])

  const scheduleReconnect = useCallback((sessionId: string) => {
    const connection = getConnection(sessionId)
    if (!connection) return

    if (connection.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Max reconnect attempts reached for session ${sessionId}`)
      connection.state = 'error'
      forceUpdate({})
      return
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, connection.reconnectAttempts),
      MAX_RECONNECT_DELAY
    )

    console.log(`Scheduling reconnect for session ${sessionId} in ${delay}ms (attempt ${connection.reconnectAttempts + 1})`)

    connection.reconnectTimer = setTimeout(() => {
      connection.reconnectAttempts++
      connect(sessionId)
    }, delay)
  }, [getConnection])

  const connect = useCallback((sessionId: string) => {
    let connection = getConnection(sessionId)
    if (!connection) {
      connection = createConnection(sessionId)
    }

    // Clear any pending reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer)
      connection.reconnectTimer = null
    }

    // Don't reconnect if already connected or connecting
    if (connection.state === 'connected' || connection.state === 'connecting') {
      return
    }

    connection.state = 'connecting'
    forceUpdate({})

    const wsUrl = `${config.wsBaseUrl}/ws/${sessionId}`
    console.log(`Connecting to WebSocket: ${wsUrl}`)

    const ws = new WebSocket(wsUrl)
    connection.ws = ws

    ws.onopen = () => {
      console.log(`WebSocket connected for session ${sessionId}`)
      const conn = getConnection(sessionId)
      if (conn) {
        conn.state = 'connected'
        conn.reconnectAttempts = 0 // Reset on successful connection
        forceUpdate({})

        // Notify listeners of connection state change
        notifyListeners(sessionId, { type: 'connection', state: 'connected' })
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const conn = getConnection(sessionId)
        if (conn) {
          // Queue messages if there are no active listeners
          if (conn.listeners.size === 0) {
            conn.messageQueue.push(data)
          } else {
            notifyListeners(sessionId, data)
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error(`WebSocket error for session ${sessionId}:`, err)
      const conn = getConnection(sessionId)
      if (conn) {
        conn.state = 'error'
        forceUpdate({})
        notifyListeners(sessionId, { type: 'connection', state: 'error' })
      }
    }

    ws.onclose = (event) => {
      console.log(`WebSocket closed for session ${sessionId}`, event.code, event.reason)
      const conn = getConnection(sessionId)
      if (conn && conn.state !== 'disconnected') {
        conn.state = 'disconnected'
        conn.ws = null
        forceUpdate({})
        notifyListeners(sessionId, { type: 'connection', state: 'disconnected' })

        // Only auto-reconnect if we have listeners (session is still active)
        if (conn.listeners.size > 0 && event.code !== 1000) {
          scheduleReconnect(sessionId)
        }
      }
    }
  }, [getConnection, createConnection, notifyListeners, scheduleReconnect])

  const disconnect = useCallback((sessionId: string) => {
    const connection = getConnection(sessionId)
    if (!connection) return

    // Clear any pending reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer)
      connection.reconnectTimer = null
    }

    // Close the WebSocket
    if (connection.ws) {
      connection.ws.close(1000, 'Client disconnecting')
      connection.ws = null
    }

    connection.state = 'disconnected'
    connection.reconnectAttempts = 0
    connection.messageQueue = []
    connection.listeners.clear()

    connectionsRef.current.delete(sessionId)
    forceUpdate({})
  }, [getConnection])

  const send = useCallback((sessionId: string, message: string) => {
    const connection = getConnection(sessionId)
    if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message: WebSocket not connected for session ${sessionId}`)
      return
    }

    connection.ws.send(JSON.stringify({ message }))
  }, [getConnection])

  const subscribe = useCallback((sessionId: string, listener: (event: any) => void): (() => void) => {
    let connection = getConnection(sessionId)
    if (!connection) {
      connection = createConnection(sessionId)
    }

    connection.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      const conn = getConnection(sessionId)
      if (conn) {
        conn.listeners.delete(listener)
      }
    }
  }, [getConnection, createConnection])

  const getState = useCallback((sessionId: string): ConnectionState | null => {
    const connection = getConnection(sessionId)
    return connection ? connection.state : null
  }, [getConnection])

  const flushQueue = useCallback((sessionId: string) => {
    const connection = getConnection(sessionId)
    if (!connection || connection.messageQueue.length === 0) return

    // Deliver queued messages to listeners
    const queue = [...connection.messageQueue]
    connection.messageQueue = []

    queue.forEach(event => {
      notifyListeners(sessionId, event)
    })
  }, [getConnection, notifyListeners])

  return {
    connections: connectionsRef.current,
    connect,
    disconnect,
    send,
    subscribe,
    getState,
    flushQueue
  }
}
