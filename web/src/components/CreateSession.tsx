import { useState } from 'react'

type Props = {
  onSessionCreated: (sessionId: string) => void
}

export function CreateSession({ onSessionCreated }: Props) {
  const [initialPrompt, setInitialPrompt] = useState("")
  const [workspace, setWorkspace] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://localhost:8000/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initial_prompt: initialPrompt || undefined,
          workspace: workspace || undefined
        })
      })

      if (!res.ok) throw new Error("Failed to create session")

      const data = await res.json()
      onSessionCreated(data.session_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-gray-900/40 border border-gray-700 rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">New Agent Session</h2>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Initial Prompt (optional)</label>
          <input
            type="text"
            placeholder="e.g. Create a simple React todo app"
            value={initialPrompt}
            onChange={e => setInitialPrompt(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Workspace folder (optional)</label>
          <input
            type="text"
            placeholder="relative or absolute path"
            value={workspace}
            onChange={e => setWorkspace(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
        >
          {loading ? "Creating..." : "Start Session"}
        </button>
      </div>
    </div>
  )
}