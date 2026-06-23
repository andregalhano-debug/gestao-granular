import { useState } from 'react'
import { AlertCircle, CheckCircle2, Circle, Plus, X, Calendar } from 'lucide-react'
import { usePriorities, useMeetings } from '../hooks/useLocalData'
import { useAuth } from '../hooks/useAuth'
import { format, isToday, isTomorrow, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Owner } from '../types'
import { SearchBar } from '../components/SearchBar'
import { RightPanel } from '../components/RightPanel'

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
  const [search, setSearch] = useState('')
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const handleDateChange = (s: Date | null, e: Date | null) => {
    setStartDate(s); setEndDate(e)
  }

  const filterByDate = (dateStr: string) => {
    if (!startDate) return true
    const d = parseISO(dateStr)
    if (endDate) return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })
    return isToday(d) || format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
  }

  const filtered = priorities.filter(p => {
    if (!filterByDate(p.created_at)) return false
    if (filterOwner !== 'all' && p.owner !== filterOwner) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const upcoming = meetings
    .filter(m => new Date(m.date) >= new Date())
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const toggleDone = (id: string) => setPriorities(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p))
  const remove = (id: string) => setPriorities(prev => prev.filter(p => p.id !== id))

  const addPriority = () => {
    if (!newTitle.trim()) return
    setPriorities(prev => [...prev, {
      id: Date.now().toString(), title: newTitle.trim(), owner: newOwner,
      urgent: newUrgent, done: false, created_at: new Date().toISOString()
    }])
    setNewTitle(''); setNewOwner('todos'); setNewUrgent(false); setShowAdd(false)
  }

  const pending = filtered.filter(p => !p.done)
  const done = filtered.filter(p => p.done)

  // Highlight dates that have priorities
  const highlightDates = priorities.map(p => parseISO(p.created_at))

  return (
    <div className="flex gap-6">
      {/* ── LEFT: main content ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Olá, {user?.name} 👋</h2>
          <p className="text-sm text-gray-500">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>

        {/* Search + owner filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar prioridade..." />
          </div>
          <div className="flex gap-1.5">
            {(['all','A','E','G'] as const).map(o => (
              <button key={o} onClick={() => setFilterOwner(o)}
                className={`text-xs px-3 py-2 rounded-xl font-medium border transition-colors ${
                  filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-[#1B4332]/30'
                }`}>
                {o === 'all' ? 'Todos' : o}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming meetings */}
        {upcoming.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Próximas reuniões
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {upcoming.map(m => (
                <div key={m.id} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">{formatMeetingDate(m.date)}</p>
                  </div>
                  <div className="flex gap-1">
                    {m.participants.map(p => (
                      <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>{p}</span>
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={12} /> Prioridades {filtered.length > 0 && <span className="font-normal">({pending.length} pendentes)</span>}
            </h3>
            <button onClick={() => setShowAdd(true)} className="text-[#1B4332] flex items-center gap-1 text-xs font-medium hover:opacity-80">
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {showAdd && (
            <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 mb-3 space-y-3">
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPriority()}
                placeholder="Nova prioridade..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
              <div className="flex gap-2 flex-wrap">
                {(['A','E','G','todos'] as Owner[]).map(o => (
                  <button key={o} onClick={() => setNewOwner(o)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${newOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                    {OWNER_LABELS[o]}
                  </button>
                ))}
                <button onClick={() => setNewUrgent(!newUrgent)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${newUrgent ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'}`}>
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
              <div key={p.id} className={`bg-white rounded-xl border px-4 py-3 flex items-start gap-3 ${p.urgent ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
                <button onClick={() => toggleDone(p.id)} className="mt-0.5 flex-shrink-0"><Circle size={18} className="text-gray-300" /></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-snug">{p.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {p.urgent && <span className="text-[10px] text-red-600 font-bold">🔴 URGENTE</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p.owner]}`}>{OWNER_LABELS[p.owner]}</span>
                  </div>
                </div>
                <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-gray-500 flex-shrink-0"><X size={14} /></button>
              </div>
            ))}
            {pending.length === 0 && !showAdd && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma prioridade{search ? ' encontrada' : ' pendente'}</p>
            )}
          </div>

          {done.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">{done.length} concluída(s)</p>
              <div className="space-y-1.5 opacity-50">
                {done.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3">
                    <button onClick={() => toggleDone(p.id)}><CheckCircle2 size={18} className="text-[#1B4332]" /></button>
                    <p className="text-sm text-gray-500 line-through">{p.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── RIGHT: calendar panel (desktop only) ── */}
      <RightPanel
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        highlightDates={highlightDates}
      />
    </div>
  )
}
