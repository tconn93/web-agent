import { Terminal, FileEdit, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

type MessageProps = {
  message: any
  hasResult?: boolean
  resultSuccess?: boolean
}

export function ChatMessage({ message, hasResult, resultSuccess }: MessageProps) {
  const isUser = message.type === 'user'
  const isAssistant = message.type === 'assistant'
  const isToolCall = message.type === 'tool_call'
  const isToolResult = message.type === 'tool_result'
  const isStatus = message.type === 'status' || message.type === 'thinking'
  const isError = message.type === 'error'

  const getToolIcon = () => {
    if (message.tool_name?.includes('read')) return <FileText size={16} />
    if (message.tool_name?.includes('write')) return <FileEdit size={16} />
    if (message.tool_name?.includes('bash') || message.tool_name?.includes('execute'))
      return <Terminal size={16} />
    return null
  }

  return (
    <div
      className={cn(
        'mb-6 flex flex-col',
        isUser && 'items-end',
        (isAssistant || isToolResult) && 'items-start',
        isStatus && 'items-center opacity-70 text-sm',
        isError && 'items-center text-red-400'
      )}
    >
      <div
        className={cn(
          'max-w-[88%] rounded-lg px-4 py-3',
          isUser && 'bg-blue-600/90 text-white',
          isAssistant && 'bg-gray-800/80 border border-gray-700',
          isToolCall && 'bg-amber-950/50 border border-amber-800/60',
          isToolResult && 'bg-emerald-950/50 border border-emerald-800/60',
          isStatus && 'bg-transparent text-center italic',
          isError && 'bg-red-950/60 border border-red-800/60'
        )}
      >
        {/* Status / Thinking */}
        {isStatus && message.content}

        {/* User message */}
        {isUser && <div className="whitespace-pre-wrap">{message.content}</div>}

        {/* Assistant normal response */}
        {isAssistant && (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ node, inline, className, children, ...props }: any) => {
                  return inline ? (
                    <code className="bg-gray-900/60 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool Call */}
        {isToolCall && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300/90 text-sm font-medium">
              {getToolIcon()}
              <span>→ {message.tool_name}</span>
              {hasResult && resultSuccess && (
                <CheckCircle size={16} className="text-green-400 ml-auto" />
              )}
              {hasResult && !resultSuccess && (
                <span className="text-red-400 ml-auto">✗</span>
              )}
            </div>
            {message.arguments && Object.keys(message.arguments).length > 0 && (
              <div className="text-xs text-amber-200/70 space-y-0.5">
                {Object.entries(message.arguments).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="opacity-60">{key}:</span>{' '}
                    <span className="font-mono">
                      {typeof value === 'string' && value.length > 60
                        ? value.substring(0, 60) + '...'
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tool Result */}
        {isToolResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {getToolIcon()}
              <span className={message.success ? 'text-emerald-400' : 'text-red-400'}>
                ← {message.tool_name} {message.success ? '✓' : '✗'}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {message.content}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {message.content}
          </div>
        )}
      </div>

      {message.timestamp && (
        <span className="mt-1 text-xs opacity-50">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )}
    </div>
  )
}