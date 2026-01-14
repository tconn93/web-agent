import { useCallback, useEffect, useRef, useState } from 'react'

type WebSocketMessage = any

interface UseAgentWebSocketOptions {
  sessionId: string
  onMessage: (event: WebSocketMessage) => void
}

export function useAgentWebSocket({ sessionId, onMessage }: UseAgentWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)

  // Keep the callback ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message }))
    }
  }, [])

  useEffect(() => {
    // Determine WebSocket protocol based on current page protocol
    // const protocol = 'ws:'
    // // Use environment variable or default to localhost:8000
    // const host = import.meta.env.VITE_API_HOST || 'localhost:8000'
    const wsUrl = `ws://localhost:8000/ws/${sessionId}`

    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Agent WebSocket connected')
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageRef.current(data)
      } catch (err) {
        console.error('Failed to parse websocket message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setError('Connection error')
      setIsConnected(false)
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket closed')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [sessionId])

  return {
    sendMessage,
    isConnected,
    error
  }
}