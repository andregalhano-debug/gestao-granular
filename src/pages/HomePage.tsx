import { useState } from 'react'
import { AlertCircle, CheckCircle2, Circle, Plus, X, Calendar } from 'lucide-react'
import { usePriorities, useMeetings } from '../hooks/useLocalData'
import { useAuth } from '../hooks/useAuth'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Owner } from '../types'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  todos: 'bg-gray-100 text-gray-600',
}

const OWNER_LABELS: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', todos: 'Todos'
}

function formatMeetingDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return `Hoje ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Amanhã ${format(d, 'HH:mm')}`
  return format(d, "dd/MM · HH:mm", { locale: ptBR })
}

export function HomePage() {
  const { user } = useAuth()
  const [priorities, setPriorities] = usePriorities()
  const [meetings] = useMeetings()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState<Owner>('todos')
  const [newUrgent, setNewUrgent] = useState(false)

  const upcoming = meetings
    .filter(m => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const toggleDone = (id: string) => {
    setPriorities(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p))
  }

  const addPriority = () => {
    if (!newTitle.trim()) return
    setPriorities(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      owner: newOwner,
      urgent: newUrgent,
      done: false,
      created_at: new Date().toISOString()
    }])
    setNewTitle('')
    setNewOwner('todos')
    setNewUrgent(false)
    setShowAdd(false)
  }

  const remove = (id: string) => setPriorities(prev => prev.filter(p => p.id !== id))

  const pending = priorities.filter(p => !p.done)
  const done = priorities.filter(p => p.done)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Olá, {user?.name} 👋
        </h1>
        <p className="text-sm text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Upcoming meetings */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar size={12} /> Próximas reuniões
          </h2>
          <div className="space-y-2">
            {upcoming.map(m => (
              <div key={m.id} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                  <p className="text-xs text-gray-500">{formatMeetingDate(m.date)}</p>
                </div>
                <div className="flex gap-1">
                  {m.participants.map(p => (
                    <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Priorities */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={12} /> Prioridades
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            className="text-[#1B4332] flex items-center gap-1 text-xs font-medium"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 mb-3 space-y-3">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPriority()}
              placeholder="Nova prioridade..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
            />
            <div className="flex gap-2 flex-wrap">
              {(['A','E','G','todos'] as Owner[]).map(o => (
                <button
                  key={o}
                  onClick={() => setNewOwner(o)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    newOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {OWNER_LABELS[o]}
                </button>
              ))}
              <button
                onClick={() => setNewUrgent(!newUrgent)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                  newUrgent ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'
                }`}
              >
                🔴 Urgente
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={addPriority} className="flex-1 bg-[#1B4332] text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
              <button onClick={() => setShowAdd(false)} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {pending.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border px-4 py-3 flex items-start gap-3 ${
                p.urgent ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
              }`}
            >
              <button onClick={() => toggleDone(p.id)} className="mt-0.5 flex-shrink-0">
                <Circle size={18} className="text-gray-300" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-snug">{p.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {p.urgent && <span className="text-[10px] text-red-600 font-bold">🔴 URGENTE</span>}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p.owner]}`}>
                    {OWNER_LABELS[p.owner]}
                  </span>
                </div>
              </div>
              <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {done.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">{done.length} concluída(s)</p>
            <div className="space-y-1.5 opacity-50">
              {done.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3">
                  <button onClick={() => toggleDone(p.id)}>
                    <CheckCircle2 size={18} className="text-[#1B4332]" />
                  </button>
                  <p className="text-sm text-gray-500 line-through">{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
