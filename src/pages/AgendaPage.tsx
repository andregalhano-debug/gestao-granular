import { useMeetings } from '../hooks/useLocalData'
import { format, isPast, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Repeat, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { Owner } from '../types'
import { SearchBar } from '../components/SearchBar'
import { RightPanel } from '../components/RightPanel'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700', E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700', todos: 'bg-gray-100 text-gray-600',
}

export function AgendaPage() {
  const [meetings, setMeetings] = useMeetings()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newParticipants, setNewParticipants] = useState<Owner[]>(['A','E','G'])
  const [newNotes, setNewNotes] = useState('')
  const [search, setSearch] = useState('')
  const [filterParticipant, setFilterParticipant] = useState<Owner | 'all'>('all')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const filterByDate = (dateStr: string) => {
    if (!startDate) return true
    const d = parseISO(dateStr)
    if (endDate) return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })
    return format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
  }

  const applyFilters = (m: typeof meetings[0]) => {
    if (!filterByDate(m.date)) return false
    if (filterParticipant !== 'all' && !m.participants.includes(filterParticipant)) return false
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) &&
        !(m.notes?.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  }

  const upcoming = meetings.filter(m => !isPast(parseISO(m.date)) && applyFilters(m))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const past = meetings.filter(m => isPast(parseISO(m.date)) && applyFilters(m))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5)

  const toggleParticipant = (o: Owner) =>
    setNewParticipants(prev => prev.includes(o) ? prev.filter(p => p !== o) : [...prev, o])

  const addMeeting = () => {
    if (!newTitle.trim() || !newDate) return
    setMeetings(prev => [...prev, {
      id: Date.now().toString(), title: newTitle.trim(),
      date: new Date(newDate).toISOString(), participants: newParticipants,
      notes: newNotes || undefined,
    }])
    setNewTitle(''); setNewDate(''); setNewNotes(''); setShowAdd(false)
  }

  const remove = (id: string) => setMeetings(prev => prev.filter(m => m.id !== id))

  const highlightDates = meetings.map(m => parseISO(m.date))

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Agenda</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium">
            <Plus size={15} /> Nova
          </button>
        </div>

        <div className="space-y-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar reunião..." />
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterParticipant('all')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterParticipant === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              Todos
            </button>
            {(['A','E','G'] as Owner[]).map(o => (
              <button key={o} onClick={() => setFilterParticipant(o)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterParticipant === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {o === 'A' ? 'André' : o === 'E' ? 'Eduardo' : 'Gabriel'}
              </button>
            ))}
          </div>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 space-y-3">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da reunião..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
            <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
            <div>
              <p className="text-[10px] text-gray-500 mb-1.5 font-medium uppercase">Participantes</p>
              <div className="flex gap-2">
                {(['A','E','G'] as Owner[]).map(o => (
                  <button key={o} onClick={() => toggleParticipant(o)}
                    className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors ${newParticipants.includes(o) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Observações (opcional)..."
              rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332] resize-none" />
            <div className="flex gap-2">
              <button onClick={addMeeting} className="flex-1 bg-[#1B4332] text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
              <button onClick={() => setShowAdd(false)} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
            </div>
          </div>
        )}

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar size={12} /> Próximas ({upcoming.length})
          </h3>
          {upcoming.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma reunião agendada</p>}
          <div className="space-y-2">
            {upcoming.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                    <p className="text-xs text-[#1B4332] font-medium mt-0.5">
                      {format(parseISO(m.date), "EEEE, dd 'de' MMMM · HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <button onClick={() => remove(m.id)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
                </div>
                <div className="flex items-center gap-2">
                  {m.participants.map(p => (
                    <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>{p}</span>
                  ))}
                  {m.recurring && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Repeat size={10} /> Recorrente</span>}
                </div>
                {m.notes && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{m.notes}</p>}
              </div>
            ))}
          </div>
        </section>

        {past.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Realizadas recentemente</h3>
            <div className="space-y-2 opacity-60">
              {past.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{m.title}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(m.date), "dd/MM/yyyy · HH:mm")}</p>
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
      </div>

      <RightPanel startDate={startDate} endDate={endDate} onDateChange={(s,e) => { setStartDate(s); setEndDate(e) }} highlightDates={highlightDates} />
    </div>
  )
}
