import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageInput } from './MessageInput'
import { ChatMessage } from './ChatMessage'
import { RightSidebar } from './RightSidebar'
import { useAgentWebSocket } from '../hooks/useAgentWebSocket'
import { ArrowLeft } from 'lucide-react'
import * as sessionService from '../services/sessionService'

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
  initialMessages: Message[]
  initialTokenUsage: TokenUsage | null
  onMessageUpdate: (message: Message) => void
  onTokenUsageUpdate: (tokenUsage: TokenUsage) => void
  onBack: () => void
}

export function SessionView({
  sessionId,
  initialMessages,
  initialTokenUsage,
  onMessageUpdate,
  onTokenUsageUpdate,
  onBack
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(initialTokenUsage)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Update local state when initial values change (session switch)
  useEffect(() => {
    setMessages(initialMessages)
    setTokenUsage(initialTokenUsage)
  }, [sessionId, initialMessages, initialTokenUsage])

  const handleMessage = useCallback((event: any) => {
    if (event.type === 'token_usage') {
      setTokenUsage(event)
      onTokenUsageUpdate(event)

      // Save token usage to database whenever it's updated (non-blocking)
      sessionService.saveTokenUsage(sessionId, {
        input_tokens: event.input_tokens,
        output_tokens: event.output_tokens,
        total_tokens: event.total_tokens,
        estimated_cost: event.estimated_cost
      }).catch(err => console.warn('Failed to save token usage:', err))
    } else {
      setMessages((prev) => [...prev, event])
      onMessageUpdate(event)

      // Persist different message types to database (all non-blocking)
      if (event.type === 'assistant' || event.type === 'user') {
        sessionService.saveMessage(sessionId, {
          role: event.type,
          content: event.content,
          message_type: event.type
        }).catch(err => console.warn('Failed to save message:', err))
      } else if (event.type === 'tool_call') {
        sessionService.saveToolCall(sessionId, {
          tool_name: event.tool_name,
          arguments: event.arguments || {},
          success: true
        }).catch(err => console.warn('Failed to save tool call:', err))
      } else if (event.type === 'tool_result') {
        // Update the tool call with result
        sessionService.saveToolCall(sessionId, {
          tool_name: event.tool_name,
          arguments: {},
          result: event.content,
          success: event.success !== false,
          error: event.error
        }).catch(err => console.warn('Failed to save tool result:', err))
      } else if (event.type === 'file_change') {
        sessionService.saveFileChange(sessionId, {
          file_path: event.file_path,
          action: event.action,
          tool_name: event.tool_name
        }).catch(err => console.warn('Failed to save file change:', err))
      }
    }
  }, [sessionId, onMessageUpdate, onTokenUsageUpdate])

  const { sendMessage: wsSendMessage, isConnected, error } = useAgentWebSocket({
    sessionId,
    onMessage: handleMessage
  })

  // Wrap sendMessage to capture user input
  const sendMessage = useCallback((message: string) => {
    // Create user message object
    const userMessage: Message = {
      type: 'user',
      content: message,
      tool_name: undefined,
      arguments: undefined,
      success: undefined
    }

    // Add to local state
    setMessages((prev) => [...prev, userMessage])
    onMessageUpdate(userMessage)

    // Save to database (non-blocking)
    sessionService.saveMessage(sessionId, {
      role: 'user',
      content: message,
      message_type: 'user'
    }).catch(err => console.warn('Failed to save user message:', err))

    // Send via WebSocket
    wsSendMessage(message)
  }, [sessionId, wsSendMessage, onMessageUpdate])

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-1 bg-gray-950/40"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-600 py-12 italic">
            Start by sending a message...
          </div>
        )}

        {messages.map((msg, index) => {
          // Check if this is a tool_call that has a result following it
          let hasResult = false
          let resultSuccess = false
          if (msg.type === 'tool_call') {
            // Look ahead to find matching tool_result
            for (let i = index + 1; i < messages.length; i++) {
              if (messages[i].type === 'tool_result' && messages[i].tool_name === msg.tool_name) {
                hasResult = true
                resultSuccess = messages[i].success !== false
                break
              }
              // Stop looking if we hit another tool_call or assistant message
              if (messages[i].type === 'tool_call' || messages[i].type === 'assistant') break
            }
          }

          // Skip tool_result for read operations
          if (msg.type === 'tool_result' &&
              (msg.tool_name?.toLowerCase().includes('read') ||
               msg.tool_name?.toLowerCase().includes('list') ||
               msg.tool_name?.toLowerCase().includes('glob') ||
               msg.tool_name?.toLowerCase().includes('grep'))) {
            return null
          }

          return (
            <ChatMessage
              key={index}
              message={msg}
              hasResult={hasResult}
              resultSuccess={resultSuccess}
            />
          )
        })}
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