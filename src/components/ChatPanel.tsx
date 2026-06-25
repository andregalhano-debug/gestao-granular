import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Settings, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function getApiKey(): string {
  return localStorage.getItem('gg_chat_api_key') ?? ''
}

function buildSystemContext(): string {
  const get = (key: string) => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] } }

  const priorities = get('gg_priorities')
  const tasks = get('gg_tasks')
  const clients = get('gg_clients')
  const meetings = get('gg_meetings')

  return `Você é um assistente inteligente do sistema de gestão interna "Gestão Granular" do Grupo Granular — uma consultoria para restaurantes, mercados e farmácias. Responda sempre em português brasileiro de forma concisa e útil.

DADOS ATUAIS DO SISTEMA (use para responder perguntas de busca, análise e similares):

PRIORIDADES (${priorities.length}):
${JSON.stringify(priorities, null, 1)}

TAREFAS (${tasks.length}):
${JSON.stringify(tasks, null, 1)}

CLIENTES (${clients.length}):
${JSON.stringify(clients, null, 1)}

REUNIÕES (${meetings.length}):
${JSON.stringify(meetings, null, 1)}

Você pode:
- Buscar informações ("quais tarefas estão em atraso?", "mostre clientes em negociação")
- Encontrar similaridades entre clientes, tarefas ou prioridades
- Resumir o estado atual do negócio
- Sugerir próximas ações
- Analisar padrões nos dados
- Responder perguntas sobre qualquer informação do sistema

Seja direto e objetivo. Use bullet points quando listar itens.`
}

async function sendToAnthropic(messages: Message[], apiKey: string, signal: AbortSignal): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: buildSystemContext(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Erro ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showApiInput, setShowApiInput] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasKey, setHasKey] = useState(() => !!getApiKey())
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const saveKey = () => {
    if (!apiKeyInput.trim()) return
    localStorage.setItem('gg_chat_api_key', apiKeyInput.trim())
    setHasKey(true)
    setShowApiInput(false)
    setApiKeyInput('')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const key = getApiKey()
    if (!key) { setShowApiInput(true); return }

    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const reply = await sendToAnthropic(newMessages, key, abortRef.current.signal)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setError('')
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${open ? 'bg-gray-700 rotate-180' : 'bg-[#1B4332] hover:bg-[#1B4332]/90'}`}
        title="Chat IA"
      >
        {open ? <ChevronDown size={20} className="text-white" /> : <MessageCircle size={20} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-[#1B4332] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-white/80" />
              <p className="text-sm font-bold text-white">Chat Granular</p>
              <span className="text-[9px] bg-white/20 text-white/80 px-1.5 py-0.5 rounded-full font-medium">IA</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowApiInput(v => !v)} className="text-white/60 hover:text-white" title="Configurar API Key">
                <Settings size={14} />
              </button>
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-white/60 hover:text-white text-[10px] font-medium">
                  Limpar
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* API key setup */}
          {showApiInput && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex-shrink-0">
              <p className="text-[10px] text-amber-700 font-medium mb-2">Cole sua Anthropic API Key:</p>
              <div className="flex gap-2">
                <input
                  autoFocus type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveKey()}
                  placeholder="sk-ant-..."
                  className="flex-1 text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white"
                />
                <button onClick={saveKey} className="px-3 py-1.5 bg-[#1B4332] text-white text-xs rounded-lg font-medium">Salvar</button>
              </div>
              {hasKey && <p className="text-[9px] text-green-600 mt-1">✓ Chave configurada. Cole uma nova para substituir.</p>}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center pt-6 space-y-3">
                <Bot size={32} className="text-gray-200 mx-auto" />
                <p className="text-xs text-gray-400">Olá! Posso ajudar com qualquer informação do sistema. Experimente:</p>
                <div className="space-y-1.5">
                  {[
                    'Quais clientes estão em negociação?',
                    'Mostre tarefas urgentes pendentes',
                    'Qual o status do contrato SAJ?',
                    'Resumo do pipeline comercial',
                  ].map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="w-full text-left text-[10px] text-[#1B4332] bg-[#1B4332]/5 rounded-lg px-3 py-2 hover:bg-[#1B4332]/10 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
                {!hasKey && (
                  <button onClick={() => setShowApiInput(true)}
                    className="text-[10px] text-amber-600 underline">
                    Configure sua API Key para começar
                  </button>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-[#1B4332]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1B4332] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-[#1B4332]" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-[10px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                ⚠ {error}
                {error.includes('401') && (
                  <button onClick={() => setShowApiInput(true)} className="block mt-1 underline">Verifique sua API Key</button>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Pergunte sobre clientes, tarefas, reuniões..."
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1B4332]/50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#1B4332]/90 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
