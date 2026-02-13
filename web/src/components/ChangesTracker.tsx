import { useState, useEffect } from 'react'
import { FileEdit, RefreshCw, Clock, ChevronDown, ChevronRight, FilePlus, FileX } from 'lucide-react'
import { config } from '../config'

type FileChange = {
  type: string
  action: string
  file_path: string
  tool_name: string
  timestamp?: string
  content_before?: string | null
  content_after?: string | null
}

type Props = {
  sessionId: string
}

export function ChangesTracker({ sessionId }: Props) {
  const [changes, setChanges] = useState<FileChange[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set())

  const toggleExpanded = (idx: number) => {
    setExpandedChanges(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  const hasContent = (change: FileChange) => {
    return change.content_before !== null || change.content_after !== null
  }

  const truncateContent = (content: string | null | undefined, maxLines: number = 50) => {
    if (!content) return ''
    const lines = content.split('\n')
    if (lines.length <= maxLines) return content
    return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`
  }

  const fetchChanges = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${config.apiBaseUrl}/sessions/${sessionId}/changes`)

      if (!res.ok) throw new Error('Failed to fetch changes')

      const data = await res.json()
      setChanges(data.changes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load changes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChanges()

    // Poll for changes every 3 seconds
    const interval = setInterval(fetchChanges, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'write':
        return 'text-green-400'
      case 'delete':
        return 'text-red-400'
      default:
        return 'text-blue-400'
    }
  }

  const getActionIcon = (action: string) => {
    return <FileEdit size={14} className={getActionColor(action)} />
  }

  return (
    <div className="flex flex-col h-full bg-gray-950/40 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 p-3 flex items-center justify-between flex-shrink-0">
        <h3 className="font-medium text-sm">Changes</h3>
        <button
          onClick={fetchChanges}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-950/60 text-red-300 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
        {changes.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <FileEdit size={32} className="mx-auto mb-2 opacity-50" />
            <p>No changes yet</p>
          </div>
        ) : (
          changes.slice().reverse().map((change, idx) => {
            const isExpanded = expandedChanges.has(idx)
            const canExpand = hasContent(change)
            const isNewFile = change.content_before === null && change.content_after !== null
            const isModified = change.content_before !== null && change.content_after !== null

            return (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
              >
                {/* Header - clickable if has content */}
                <div
                  className={`p-3 space-y-1 ${canExpand ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
                  onClick={() => canExpand && toggleExpanded(idx)}
                >
                  <div className="flex items-center gap-2">
                    {canExpand && (
                      isExpanded
                        ? <ChevronDown size={14} className="text-gray-400" />
                        : <ChevronRight size={14} className="text-gray-400" />
                    )}
                    {isNewFile ? (
                      <FilePlus size={14} className="text-green-400" />
                    ) : (
                      getActionIcon(change.action)
                    )}
                    <span className={`text-sm font-medium capitalize ${getActionColor(change.action)}`}>
                      {isNewFile ? 'created' : change.action}
                    </span>
                    {isModified && (
                      <span className="text-xs text-gray-500">
                        (modified)
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-300 break-all">
                    {change.file_path}
                  </div>

                  {change.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatTime(change.timestamp)}</span>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && canExpand && (
                  <div className="border-t border-gray-800 bg-gray-950/50">
                    {/* Before content */}
                    {change.content_before && (
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <FileX size={12} className="text-red-400" />
                          <span className="text-xs font-medium text-red-400">Before</span>
                        </div>
                        <pre className="text-xs text-gray-400 bg-red-950/20 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                          {truncateContent(change.content_before)}
                        </pre>
                      </div>
                    )}

                    {/* After content */}
                    {change.content_after && (
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <FilePlus size={12} className="text-green-400" />
                          <span className="text-xs font-medium text-green-400">After</span>
                        </div>
                        <pre className="text-xs text-gray-400 bg-green-950/20 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                          {truncateContent(change.content_after)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
