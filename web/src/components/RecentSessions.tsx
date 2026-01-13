import { useState, useEffect, useRef } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as sessionService from '../services/sessionService'

type Props = {
  onSessionSelect: (sessionId: string) => void
  currentSessionId?: string
}

export function RecentSessions({ onSessionSelect, currentSessionId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent sessions when dropdown opens
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadSessions = async () => {
    setLoading(true)
    const recentSessions = await sessionService.listRecentSessions(20)
    setSessions(recentSessions)
    setLoading(false)
  }

  const handleSessionClick = (sessionId: string) => {
    setIsOpen(false)
    onSessionSelect(sessionId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getWorkspaceLabel = (workspace: string) => {
    // Extract last part of path for display
    const parts = workspace.split('/')
    return parts[parts.length - 1] || workspace
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-sm"
        title="Recent sessions"
      >
        <Clock size={16} />
        <span className="hidden sm:inline">Recent Sessions</span>
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Recent Sessions</span>
            <button
              onClick={loadSessions}
              disabled={loading}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading && sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No recent sessions
            </div>
          ) : (
            <div className="py-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  disabled={session.id === currentSessionId}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0',
                    session.id === currentSessionId && 'bg-blue-900/20 cursor-default'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {session.agent_type === 'planning' ? '📋' : '🔨'}
                        </span>
                        <span className="text-sm font-medium text-white truncate">
                          {getWorkspaceLabel(session.workspace)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {session.workspace}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                  {session.id === currentSessionId && (
                    <div className="text-xs text-blue-400 mt-1">Currently active</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
