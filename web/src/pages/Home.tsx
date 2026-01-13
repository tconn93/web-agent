import { useState } from 'react'
import { CreateSession } from '@/components/CreateSession'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Web Agent Hub
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Autonomous coding agent with Grok-powered reasoning and direct filesystem access
        </p>
      </div>

      {!showCreateForm ? (
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>New Session</CardTitle>
              <CardDescription>
                Start a fresh coding session with the agent
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Create a new workspace and begin giving instructions to the agent right away.
              </p>
              <Button 
                size="lg" 
                onClick={() => setShowCreateForm(true)}
              >
                Create New Session
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 pointer-events-none">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                View and continue previous work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">
                Session history coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <CreateSession 
            onSessionCreated={(sessionId) => {
              // In real app you would navigate to /session/:id
              alert(`Session created! ID: ${sessionId}\n\n(Navigation would happen here)`)
              setShowCreateForm(false)
            }}
          />
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setShowCreateForm(false)}
            >
              ← Back to home
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}