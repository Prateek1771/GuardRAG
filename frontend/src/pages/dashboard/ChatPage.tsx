import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import ChatWindow from '../../components/ChatWindow'
import ChatHistoryPanel from '../../components/ChatHistoryPanel'
import PageHeader from '../../components/PageHeader'

export default function ChatPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [activeChatSessionId, setActiveChatSessionId] = useState<number | null>(null)
  const [chatKey, setChatKey] = useState(0)

  const handleSessionCreated = (id: number) => {
    setActiveChatSessionId(id)
    // Do NOT increment chatKey here — keeps ChatWindow alive during streaming
    qc.invalidateQueries({ queryKey: ['sessions', null] })
  }

  const handleNewChat = () => {
    setActiveChatSessionId(null)
    setChatKey(k => k + 1)
  }

  const handleSelectSession = (id: number) => {
    setActiveChatSessionId(id)
    setChatKey(k => k + 1)
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Chat" description="Ask questions about your company documents" />
      <div className="flex-1 flex overflow-hidden">
        <ChatHistoryPanel
          activeSessionId={activeChatSessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
        />
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            key={chatKey}
            companyId={user?.company_id ?? undefined}
            chatSessionId={activeChatSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
  )
}
