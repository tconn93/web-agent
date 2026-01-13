import { useState } from 'react'

type Props = {
  onSessionCreated: (sessionId: string, agentType: string) => void
  onCancel?: () => void
}

export function CreateSession({ onSessionCreated, onCancel }: Props) {
  const [initialPrompt, setInitialPrompt] = useState("")
  const [workspace, setWorkspace] = useState("")
  const [agentType, setAgentType] = useState<"planning" | "building">("building")
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
          workspace: workspace || undefined,
          agent_type: agentType
        })
      })

      if (!res.ok) throw new Error("Failed to create session")

      const data = await res.json()
      onSessionCreated(data.session_id, data.agent_type || agentType)
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
          <label className="block text-sm font-medium mb-3">Agent Type</label>
          <div className="flex gap-4">
            <label className="flex-1 flex items-center gap-3 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="agentType"
                value="building"
                checked={agentType === "building"}
                onChange={(e) => setAgentType(e.target.value as "building")}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <div className="font-medium">Building Agent</div>
                <div className="text-xs text-gray-400">Writes code and implements features</div>
              </div>
            </label>
            <label className="flex-1 flex items-center gap-3 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="agentType"
                value="planning"
                checked={agentType === "planning"}
                onChange={(e) => setAgentType(e.target.value as "planning")}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <div className="font-medium">Planning Agent</div>
                <div className="text-xs text-gray-400">Designs and creates plans</div>
              </div>
            </label>
          </div>
        </div>

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

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
          >
            {loading ? "Creating..." : "Start Session"}
          </button>
        </div>
      </div>
    </div>
  )
}