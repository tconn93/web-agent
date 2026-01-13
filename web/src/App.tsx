import { useState } from 'react'
import { SessionView } from './components/SessionView'
import { CreateSession } from './components/CreateSession'

function App() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b p-4 bg-card">
        <h1 className="text-2xl font-bold">Web Agent Hub</h1>
        <p className="text-muted-foreground text-sm">Grok-powered autonomous coding agent</p>
      </header>

      <main className="flex-1 flex">
        {!activeSessionId ? (
          <CreateSession onSessionCreated={setActiveSessionId} />
        ) : (
          <SessionView 
            sessionId={activeSessionId} 
            onBack={() => setActiveSessionId(null)}
          />
        )}
      </main>
    </div>
  )
}

export default App