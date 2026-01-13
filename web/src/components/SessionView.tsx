import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageInput } from './MessageInput'
import { ChatMessage } from './ChatMessage'
import { RightSidebar } from './RightSidebar'
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

type TokenUsage = {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost: number
}

type Props = {
  sessionId: string
  onBack: () => void
}

export function SessionView({ sessionId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleMessage = useCallback((event: any) => {
    if (event.type === 'token_usage') {
      setTokenUsage(event)
    } else {
      setMessages((prev) => [...prev, event])
    }
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
    <div className="flex h-full max-h-full overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-950/70 p-4 flex items-center justify-between flex-shrink-0">
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

        {/* Token Usage */}
        {tokenUsage && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Tokens:</span>
              <span className="font-mono text-blue-400">
                {tokenUsage.total_tokens.toLocaleString()}
              </span>
              <span className="text-gray-600 text-xs">
                ({tokenUsage.input_tokens.toLocaleString()} in / {tokenUsage.output_tokens.toLocaleString()} out)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Cost:</span>
              <span className="font-mono text-green-400">
                ${tokenUsage.estimated_cost.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Connection error banner */}
      {error && (
        <div className="bg-red-900/60 text-red-300 p-3 text-center text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-1 bg-gray-950/40 min-h-0"
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
        <div className="border-t border-gray-800 bg-gray-950/70 p-4 flex-shrink-0">
          <MessageInput onSend={sendMessage} disabled={!isConnected} />
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar sessionId={sessionId} />
    </div>
  )
}