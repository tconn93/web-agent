import { ChevronDown, ChevronRight, Terminal, FileEdit, FileText } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type ToolCallDisplayProps = {
  toolName: string
  arguments: Record<string, any>
  result?: string
  success?: boolean
  className?: string
}

export function ToolCallDisplay({
  toolName,
  arguments: args,
  result,
  success = true,
  className
}: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  const getIcon = () => {
    if (toolName.includes('read')) return <FileText className="h-4 w-4" />
    if (toolName.includes('write')) return <FileEdit className="h-4 w-4" />
    if (toolName.includes('bash') || toolName.includes('execute')) return <Terminal className="h-4 w-4" />
    return <ChevronRight className="h-4 w-4" />
  }

  const formatArgValue = (value: any): string => {
    if (typeof value === 'string' && value.length > 200) {
      return value.substring(0, 180) + '...'
    }
    return JSON.stringify(value, null, 2)
  }

  return (
    <div className={cn(
      "border rounded-md overflow-hidden bg-muted/40",
      success ? "border-emerald-800/40" : "border-red-800/40",
      className
    )}>
      <div 
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer bg-muted/60 hover:bg-muted/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        
        <div className="flex items-center gap-2 flex-1">
          {getIcon()}
          <span className="font-medium text-sm">
            {toolName}
          </span>
        </div>

        {result !== undefined && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            success 
              ? "bg-emerald-900/40 text-emerald-300" 
              : "bg-red-900/40 text-red-300"
          )}>
            {success ? 'Success' : 'Failed'}
          </span>
        )}
      </div>

      {expanded && (
        <div className="p-4 pt-1 bg-black/30 border-t">
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Arguments</div>
              <pre className="bg-black/40 p-3 rounded overflow-x-auto text-xs leading-relaxed">
                {Object.entries(args).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="text-cyan-300">{key}</span>:
                    <span className="ml-2 text-gray-300">{formatArgValue(value)}</span>
                  </div>
                ))}
              </pre>
            </div>

            {result !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Result</div>
                <pre className={cn(
                  "p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed",
                  success ? "bg-emerald-950/60" : "bg-red-950/60"
                )}>
                  {result}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}