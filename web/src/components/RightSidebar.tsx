import { useState } from 'react'
import { FileExplorer } from './FileExplorer'
import { ChangesTracker } from './ChangesTracker'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

type Props = {
  sessionId: string
  onBackToChat?: () => void
  isMobileFullScreen?: boolean
}

type Tab = 'files' | 'changes'

export function RightSidebar({ sessionId, onBackToChat, isMobileFullScreen }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('files')

  return (
    <div className={cn(
      "border-l border-gray-800 flex flex-col h-full overflow-hidden",
      isMobileFullScreen ? "w-full md:w-80" : "w-80"
    )}>
      {/* Mobile header with back button */}
      {isMobileFullScreen && (
        <div className="md:hidden border-b border-gray-800 bg-gray-950/70 p-4 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onBackToChat}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            title="Back to Chat"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-medium">Files & Changes</h2>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 flex flex-shrink-0">
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'files'
              ? 'border-blue-500 text-white bg-gray-900/50'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/30'
          )}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab('changes')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'changes'
              ? 'border-blue-500 text-white bg-gray-900/50'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/30'
          )}
        >
          Changes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <FileExplorer sessionId={sessionId} />}
        {activeTab === 'changes' && <ChangesTracker sessionId={sessionId} />}
      </div>
    </div>
  )
}
