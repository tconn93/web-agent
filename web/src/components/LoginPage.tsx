import { useState } from 'react'
import { LogIn } from 'lucide-react'

type Props = {
  onLogin: (token: string, username: string) => void
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('developer')

  // DUMMY LOGIN - Authentication disabled for development
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const user = username.trim() || 'developer'
    localStorage.setItem('username', user)
    onLogin('dummy-token', user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-gray-900/40 border border-gray-700 rounded-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Web Agent Hub</h1>
          <p className="text-gray-400 text-sm">
            Enter a username to continue
          </p>
          <p className="text-yellow-500/70 text-xs mt-2">
            ⚠️ Auth disabled - Development mode
          </p>
        </div>

        {/* Simplified Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              placeholder="Enter any username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Continue
          </button>
        </form>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-800 pt-4">
          <p>Authentication system is temporarily disabled.</p>
          <p>Re-enable it later by uncommenting auth routes in main.py</p>
        </div>
      </div>
    </div>
  )
}
