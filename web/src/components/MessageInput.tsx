import { useState } from 'react'
import { SendHorizontal } from 'lucide-react'

type Props = {
  onSend: (msg: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <textarea
        placeholder="Ask the agent to code, debug, explain..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        rows={2}
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md transition-colors"
      >
        <SendHorizontal size={20} />
      </button>
    </form>
  )
}