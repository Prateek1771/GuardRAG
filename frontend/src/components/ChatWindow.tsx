import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Shield, BookOpen, Zap } from 'lucide-react'
import GuardrailCard from './GuardrailCard'
import FeedbackRow from './FeedbackRow'
import CitationsPanel, { type Citation } from './CitationsPanel'
import api from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  guardrail_action?: string | null
  rule_triggered?: string | null
  approval_id?: number
  citations?: Citation[]
}

interface Props {
  namespace?: string
  guestSessionId?: string
  companyId?: number
  placeholder?: string
  onGuardrail?: (action: string, ruleName?: string | null) => void
  // For authenticated sessions
  chatSessionId?: number | null
  onSessionCreated?: (id: number) => void
  projectId?: number
}

export default function ChatWindow({
  guestSessionId,
  companyId,
  placeholder,
  onGuardrail,
  chatSessionId,
  onSessionCreated,
  projectId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [directMode, setDirectMode] = useState(() =>
    localStorage.getItem('guardrag-chat-mode') === 'direct'
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track when we created the session ourselves so we don't reload messages mid-stream
  const sessionJustCreated = useRef(false)

  const toggleMode = () => {
    const next = !directMode
    setDirectMode(next)
    localStorage.setItem('guardrag-chat-mode', next ? 'direct' : 'rag')
  }

  // Load messages when a session is selected (not when we just created it mid-stream)
  useEffect(() => {
    if (chatSessionId) {
      if (sessionJustCreated.current) {
        sessionJustCreated.current = false
        return
      }
      api.get(`/sessions/${chatSessionId}/messages`).then(r => {
        const loaded: Message[] = r.data.map((m: any) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          guardrail_action: m.guardrail_action,
          rule_triggered: m.rule_triggered,
        }))
        setMessages(loaded)
      })
    } else if (chatSessionId === null) {
      setMessages([])
    }
  }, [chatSessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          session_id: guestSessionId,
          company_id: companyId,
          chat_session_id: chatSessionId ?? undefined,
          project_id: projectId ?? undefined,
          direct_mode: directMode,
        }),
      })

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        const assistantId = (Date.now() + 1).toString()
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

        if (!response.body) throw new Error('Empty response body')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.chat_session_id && onSessionCreated) {
                sessionJustCreated.current = true
                onSessionCreated(parsed.chat_session_id)
              }
              if (parsed.content) {
                fullContent += parsed.content
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ))
              }
              if (parsed.replace_all) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: parsed.replace_all, guardrail_action: 'REDACTED' }
                    : m
                ))
                onGuardrail?.('REDACTED', null)
              }
              if (parsed.citations) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, citations: parsed.citations } : m
                ))
              }
              if (parsed.input_guardrail) {
                setMessages(prev => prev.map(m =>
                  m.id === userMsg.id
                    ? { ...m, guardrail_action: parsed.input_guardrail, rule_triggered: parsed.rule_triggered }
                    : m
                ))
                onGuardrail?.(parsed.input_guardrail, parsed.rule_triggered)
              }
            } catch { }
          }
        }
      } else {
        const data = await response.json()
        if (data.chat_session_id && onSessionCreated) {
          onSessionCreated(data.chat_session_id)
        }
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          guardrail_action: data.guardrail_action,
          rule_triggered: data.rule_triggered,
          approval_id: data.approval_id,
        }])
        if (data.guardrail_action) {
          onGuardrail?.(data.guardrail_action, data.rule_triggered)
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f4f4] dark:bg-[#0d0d0d]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5 pb-6">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center mb-4 ${directMode ? 'bg-[#6929c4]' : 'bg-[#0f62fe]'}`}>
              {directMode ? <Zap className="w-6 h-6 text-white" /> : <Shield className="w-6 h-6 text-white" />}
            </div>
            <h3 className="text-base font-semibold text-[#161616] dark:text-[#f4f4f4] mb-1">
              {directMode ? 'Direct AI Mode' : 'GuardRAG Assistant'}
            </h3>
            <p className="text-sm text-[#525252] dark:text-[#a8a8a8] max-w-sm leading-relaxed">
              {directMode
                ? 'Ask anything — the AI will answer directly from its knowledge without searching your documents.'
                : 'Ask anything about your company documents. Guardrails are active and all interactions are logged.'}
            </p>
            <div className="mt-5 flex items-center gap-2 bg-[#edf5ff] dark:bg-[#001d6c]/30 border border-[#d0e2ff] dark:border-[#0f62fe]/30 rounded-sm px-4 py-2.5 text-xs text-[#0043ce] dark:text-[#78a9ff]">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              Policy guardrails are enforced on all messages
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fade-in-up_0.25s_ease_forwards]`}
          >
            {/* AI avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#0f62fe] rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 mr-2.5">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] md:max-w-[70%] flex flex-col group`}>
              {/* Bubble */}
              <div className={`px-4 py-3 text-sm leading-relaxed rounded-sm ${
                msg.role === 'user'
                  ? 'bg-[#0f62fe] text-white whitespace-pre-wrap'
                  : 'bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] text-[#161616] dark:text-[#f4f4f4]'
              }`}>
                {msg.content ? (
                  msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => <code className="bg-[#f4f4f4] dark:bg-[#262626] px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <pre className="bg-[#f4f4f4] dark:bg-[#262626] p-3 rounded-sm text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                        a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#0f62fe] dark:text-[#78a9ff] underline">{children}</a>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content
                ) : (
                  <span className="text-[#525252] dark:text-[#a8a8a8] italic text-xs animate-pulse">GuardRAG is thinking…</span>
                )}
              </div>

              {/* Guardrail card */}
              {msg.guardrail_action && (
                <GuardrailCard
                  action={msg.guardrail_action as 'BLOCKED' | 'ALERT' | 'APPROVAL' | 'REDACTED'}
                  ruleName={msg.rule_triggered}
                  approvalId={msg.approval_id}
                />
              )}

              {/* Feedback (AI only, not guardrail blocks) */}
              {msg.role === 'assistant' && msg.guardrail_action !== 'BLOCKED' && msg.content && (
                <FeedbackRow messageId={msg.id} />
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <CitationsPanel citations={msg.citations} />
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-[#0f62fe] rounded-sm flex items-center justify-center flex-shrink-0 mr-2.5">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#393939] rounded-sm px-4 py-3 text-xs text-[#525252] dark:text-[#a8a8a8] italic animate-pulse">
              GuardRAG is thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-[#e0e0e0] dark:border-[#393939] bg-white dark:bg-[#1a1a1a] px-4 md:px-8 pt-2 pb-3">
        {/* Mode toggle */}
        <div className="max-w-4xl mx-auto mb-2 flex items-center gap-1">
          <button
            onClick={toggleMode}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
              !directMode
                ? 'bg-[#0f62fe] border-[#0f62fe] text-white'
                : 'bg-transparent border-[#e0e0e0] dark:border-[#393939] text-[#525252] dark:text-[#a8a8a8] hover:border-[#0f62fe] hover:text-[#0f62fe]'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            RAG Mode
          </button>
          <button
            onClick={toggleMode}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
              directMode
                ? 'bg-[#6929c4] border-[#6929c4] text-white'
                : 'bg-transparent border-[#e0e0e0] dark:border-[#393939] text-[#525252] dark:text-[#a8a8a8] hover:border-[#6929c4] hover:text-[#6929c4]'
            }`}
          >
            <Zap className="w-3 h-3" />
            Direct AI
          </button>
        </div>
        <div className="max-w-4xl mx-auto flex items-center gap-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={directMode ? 'Ask anything — direct AI answer…' : (placeholder || 'Ask anything about your documents…')}
            disabled={loading}
            className="flex-1 bg-[#f4f4f4] dark:bg-[#262626] border-b-2 border-b-[#0f62fe] border-t border-l border-r-0 border-[#e0e0e0] dark:border-[#393939] px-4 py-3 text-sm focus:outline-none disabled:opacity-50 placeholder:text-[#a8a8a8] text-[#161616] dark:text-[#f4f4f4] rounded-l-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="bg-[#0f62fe] hover:bg-[#0043ce] disabled:bg-[#e0e0e0] dark:disabled:bg-[#393939] disabled:text-[#a8a8a8] text-white px-4 self-stretch transition-colors flex items-center justify-center cursor-pointer rounded-r-sm border-t border-t-[#e0e0e0] dark:border-t-[#393939] border-b-2 border-b-[#0f62fe] disabled:border-b-[#e0e0e0] dark:disabled:border-b-[#393939]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
