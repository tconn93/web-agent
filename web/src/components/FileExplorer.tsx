import { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '../config'

type FileItem = {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
}

type Props = {
  sessionId: string
}

export function FileExplorer({ sessionId }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const fetchFiles = async (path: string = '') => {
    setLoading(true)
    setError(null)
    try {
      const url = `${config.apiBaseUrl}/sessions/${sessionId}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`
      const res = await fetch(url)

      if (!res.ok) throw new Error('Failed to fetch files')

      const data = await res.json()
      setFiles(data.files || [])
      setCurrentPath(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [sessionId])

  const handleDirClick = (item: FileItem) => {
    if (item.type === 'directory') {
      const isExpanded = expandedDirs.has(item.path)
      if (isExpanded) {
        setExpandedDirs(prev => {
          const next = new Set(prev)
          next.delete(item.path)
          return next
        })
      } else {
        setExpandedDirs(prev => new Set(prev).add(item.path))
        fetchFiles(item.path)
      }
    }
  }

  const handleGoUp = () => {
    // Navigate to parent directory
    if (!currentPath) return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parentPath = parts.join('/')
    fetchFiles(parentPath)
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex flex-col h-full bg-gray-950/40 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 p-3 flex items-center justify-between flex-shrink-0">
        <h3 className="font-medium text-sm">File Explorer</h3>
        <button
          onClick={() => fetchFiles(currentPath)}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-950/60 text-red-300 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {/* Parent directory link */}
        {currentPath && (
          <button
            onClick={handleGoUp}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-800/50 transition-colors text-left cursor-pointer"
          >
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0 rotate-180" />
            <Folder size={14} className="text-yellow-400 flex-shrink-0" />
            <span className="flex-1 truncate text-gray-300">..</span>
          </button>
        )}

        {loading && files.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            Loading...
          </div>
        ) : files.length === 0 && !currentPath ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No files
          </div>
        ) : (
          files.map((item) => (
            <button
              key={item.path}
              onClick={() => handleDirClick(item)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-800/50 transition-colors text-left',
                item.type === 'directory' && 'cursor-pointer'
              )}
            >
              {item.type === 'directory' ? (
                <>
                  {expandedDirs.has(item.path) ? (
                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                  <Folder size={14} className="text-blue-400 flex-shrink-0" />
                </>
              ) : (
                <>
                  <span className="w-3.5" />
                  <File size={14} className="text-gray-400 flex-shrink-0" />
                </>
              )}
              <span className="flex-1 truncate">{item.name}</span>
              {item.size !== undefined && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatSize(item.size)}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
