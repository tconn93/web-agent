import { Loader2 } from 'lucide-react'

type ThinkingIndicatorProps = {
  label?: string
  className?: string
}

export function ThinkingIndicator({ 
  label = "Thinking...",
  className 
}: ThinkingIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 text-muted-foreground text-sm py-3 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  )
}