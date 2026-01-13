import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageInput } from './MessageInput'
import { ChatMessage } from './ChatMessage'
import { useAgentWebSocket } from '../hooks/useAgentWebSocket'
import { ArrowLeft } from 'lucide-react'

type Message = {
  type: string
  content: string
  timestamp?: string
  tool_name?: string
  arguments?: any
  success?: boolean
  error?: string
  done?: boolean
}

type Props = {
  sessionId: string
  onBack: () => void
}

export function SessionView({ sessionId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleMessage = useCallback((event: any) => {
    setMessages((prev) => [...prev, event])
  }, [])

  const { sendMessage, isConnected, error } = useAgentWebSocket({
    sessionId,
    onMessage: handleMessage
  })

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/70 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-medium">Session {sessionId.slice(0, 8)}...</h2>
            <p className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Connection error banner */}
      {error && (
        <div className="bg-red-900/60 text-red-300 p-3 text-center text-sm">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-1 bg-gray-950/40"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-600 py-12 italic">
            Start by sending a message...
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-gray-950/70 p-4">
        <MessageInput onSend={sendMessage} disabled={!isConnected} />
      </div>
    </div>
  )
}