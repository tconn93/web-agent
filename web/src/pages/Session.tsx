import { useParams, useNavigate } from 'react-router-dom'
import { SessionView } from '@/components/SessionView'

export default function Session() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">Invalid Session</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-primary hover:underline"
        >
          Return to home
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <SessionView 
        sessionId={sessionId}
        onBack={() => navigate('/')}
      />
    </div>
  )
}