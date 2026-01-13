import { useState, useEffect } from 'react'
import { SessionView } from './components/SessionView'
import { CreateSession } from './components/CreateSession'
import { LoginPage } from './components/LoginPage'
import { Plus, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

type Session = {
  id: string
  name: string
  agentType?: string
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showCreateSession, setShowCreateSession] = useState(false)

  // AUTHENTICATION DISABLED - Auto-login for development
  useEffect(() => {
    const savedUsername = localStorage.getItem('username') || 'developer'
    localStorage.setItem('username', savedUsername)
    setIsAuthenticated(true)
    setUsername(savedUsername)
  }, [])

  const handleLogin = (_token: string, user: string) => {
    setIsAuthenticated(true)
    setUsername(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
    setUsername(null)
    setSessions([])
    setActiveSessionId(null)
  }

  const handleSessionCreated = (sessionId: string, agentType: string) => {
    const typeLabel = agentType === 'planning' ? '📋' : '🔨'
    const newSession = {
      id: sessionId,
      name: `${typeLabel} ${sessionId.slice(0, 8)}`,
      agentType
    }
    setSessions(prev => [...prev, newSession])
    setActiveSessionId(sessionId)
    setShowCreateSession(false)
  }

  const handleCloseSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions[0]?.id || null)
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b p-4 bg-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Web Agent Hub</h1>
          <p className="text-muted-foreground text-sm">Grok-powered autonomous coding agent</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Welcome, <span className="text-white font-medium">{username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-sm"
            title="Logout"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Session Tabs */}
      {sessions.length > 0 && (
        <div className="border-b border-gray-800 bg-gray-950/70 flex items-center gap-2 px-2 overflow-x-auto">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap',
                activeSessionId === session.id
                  ? 'border-blue-500 bg-gray-900/50 text-white'
                  : 'border-transparent hover:bg-gray-900/30 text-gray-400'
              )}
            >
              <span className="text-sm">{session.name}</span>
              <button
                onClick={(e) => handleCloseSession(session.id, e)}
                className="p-0.5 hover:bg-red-500/20 rounded transition-colors"
                title="Close session"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowCreateSession(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900/30 rounded transition-colors"
            title="New session"
          >
            <Plus size={16} />
            <span>New</span>
          </button>
        </div>
      )}

      <main className="flex-1 flex min-h-0 overflow-hidden">
        {showCreateSession || (sessions.length === 0 && !activeSession) ? (
          <CreateSession
            onSessionCreated={handleSessionCreated}
            onCancel={sessions.length > 0 ? () => setShowCreateSession(false) : undefined}
          />
        ) : activeSession ? (
          <SessionView
            key={activeSession.id}
            sessionId={activeSession.id}
            onBack={() => {}}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>No active session</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App