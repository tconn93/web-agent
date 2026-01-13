/**
 * Service for persisting session data to the backend database
 */

const API_BASE = 'http://localhost:8000/api/sessions'

export interface MessageData {
  role: string
  content: string
  message_type: string
}

export interface ToolCallData {
  tool_name: string
  arguments: Record<string, any>
  result?: string
  success: boolean
  error?: string
}

export interface FileChangeData {
  file_path: string
  action: string
  tool_name: string
}

export interface TokenUsageData {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost: number
}

export interface SessionInitData {
  workspace: string
  agent_type: string
}

/**
 * Initialize or update a session in the database
 */
export async function initializeSession(sessionId: string, data: SessionInitData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      console.error('Failed to initialize session:', await response.text())
    }
  } catch (error) {
    console.error('Error initializing session:', error)
  }
}

/**
 * Save a message to the database
 */
export async function saveMessage(sessionId: string, message: MessageData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
    if (!response.ok) {
      console.error('Failed to save message:', await response.text())
    }
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

/**
 * Save a tool call to the database
 */
export async function saveToolCall(sessionId: string, toolCall: ToolCallData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/tool-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolCall)
    })
    if (!response.ok) {
      console.error('Failed to save tool call:', await response.text())
    }
  } catch (error) {
    console.error('Error saving tool call:', error)
  }
}

/**
 * Save a file change to the database
 */
export async function saveFileChange(sessionId: string, fileChange: FileChangeData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/file-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileChange)
    })
    if (!response.ok) {
      console.error('Failed to save file change:', await response.text())
    }
  } catch (error) {
    console.error('Error saving file change:', error)
  }
}

/**
 * Save token usage to the database
 */
export async function saveTokenUsage(sessionId: string, tokenUsage: TokenUsageData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/token-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenUsage)
    })
    if (!response.ok) {
      console.error('Failed to save token usage:', await response.text())
    }
  } catch (error) {
    console.error('Error saving token usage:', error)
  }
}

/**
 * Load messages for a session
 */
export async function loadMessages(sessionId: string): Promise<MessageData[]> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/messages`)
    if (!response.ok) {
      console.error('Failed to load messages:', await response.text())
      return []
    }
    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error('Error loading messages:', error)
    return []
  }
}

/**
 * Load latest token usage for a session
 */
export async function loadTokenUsage(sessionId: string): Promise<TokenUsageData | null> {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}/token-usage/latest`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading token usage:', error)
    return null
  }
}

/**
 * Get list of recent sessions
 */
export async function listRecentSessions(limit: number = 20): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}?limit=${limit}`)
    if (!response.ok) {
      console.error('Failed to load recent sessions:', await response.text())
      return []
    }
    const data = await response.json()
    return data.sessions || []
  } catch (error) {
    console.error('Error loading recent sessions:', error)
    return []
  }
}

/**
 * Load a full session with messages and token usage
 */
export async function loadFullSession(sessionId: string): Promise<{
  messages: MessageData[]
  tokenUsage: TokenUsageData | null
  workspace: string
  agentType: string
} | null> {
  try {
    const [sessionInfo, messages, tokenUsage] = await Promise.all([
      fetch(`${API_BASE}/${sessionId}`).then(r => r.ok ? r.json() : null),
      loadMessages(sessionId),
      loadTokenUsage(sessionId)
    ])

    if (!sessionInfo) {
      return null
    }

    return {
      messages,
      tokenUsage,
      workspace: sessionInfo.workspace,
      agentType: sessionInfo.agent_type
    }
  } catch (error) {
    console.error('Error loading full session:', error)
    return null
  }
}
