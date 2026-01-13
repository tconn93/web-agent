import { useState } from 'react'
import { FileExplorer } from './FileExplorer'
import { ChangesTracker } from './ChangesTracker'
import { cn } from '@/lib/utils'

type Props = {
  sessionId: string
}

type Tab = 'files' | 'changes'

export function RightSidebar({ sessionId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('files')

  return (
    <div className="w-80 border-l border-gray-800 flex flex-col h-full overflow-hidden">
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
