import { useState, useCallback } from 'react'
import { useMeetings } from '../hooks/useLocalData'
import {
  format, isPast, parseISO, startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths,
  subDays, addDays as addD, eachDayOfInterval, getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar, Repeat, Plus, X, ChevronLeft, ChevronRight, List,
  ExternalLink, Clock,
} from 'lucide-react'
import type { Meeting, Owner } from '../types'
import { SearchBar } from '../components/SearchBar'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  D: 'bg-pink-100 text-pink-700',
  todos: 'bg-gray-100 text-gray-600',
}

const OWNER_NAMES: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', D: 'Daniela', todos: 'Todos',
}

type MeetingTag = NonNullable<Meeting['tag']>

const TAG_CONFIG: Record<MeetingTag, { label: string; color: string; desc: string }> = {
  estrategica:  { label: 'Estratégica',  color: 'bg-purple-100 text-purple-700', desc: 'Definição de rumo' },
  operacional:  { label: 'Operacional',  color: 'bg-blue-100 text-blue-700',    desc: 'Execução do dia a dia' },
  cultura:      { label: 'Cultura',      color: 'bg-green-100 text-green-700',  desc: 'Time e valores' },
  alinhamento:  { label: 'Alinhamento',  color: 'bg-gray-200 text-gray-600',    desc: 'Sócios e líderes' },
  cliente:      { label: 'Cliente',      color: 'bg-orange-100 text-orange-700',desc: 'Reunião com cliente' },
  financeiro:   { label: 'Financeiro',   color: 'bg-yellow-100 text-yellow-700',desc: 'Financeiro e contrato' },
  outro:        { label: 'Outro',        color: 'bg-slate-100 text-slate-600',  desc: 'Outro' },
}

const EMPTY_MEETING_FORM = {
  title: '',
  date: '',
  participants: ['A', 'E', 'G'] as Owner[],
  notes: '',
  ata: '',
  tag: '' as MeetingTag | '',
  recurring: false,
}

// ─────────────────────────────────────────────
// Meeting Detail / Edit Modal
// ─────────────────────────────────────────────
interface MeetingModalProps {
  meeting: Meeting | null
  defaultDate?: string
  onSave: (data: Omit<Meeting, 'id'>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

function MeetingModal({ meeting, defaultDate, onSave, onDelete, onClose }: MeetingModalProps) {
  const [form, setStaticForm] = useState(() => meeting ? {
    title: meeting.title,
    date: format(parseISO(meeting.date), "yyyy-MM-dd'T'HH:mm"),
    participants: meeting.participants,
    notes: meeting.notes ?? '',
    ata: meeting.ata ?? '',
    tag: (meeting.tag ?? '') as MeetingTag | '',
    recurring: meeting.recurring ?? false,
  } : {
    ...EMPTY_MEETING_FORM,
    date: defaultDate ?? '',
  })

  const set = (field: string, value: unknown) => setStaticForm(p => ({ ...p, [field]: value }))

  const toggleParticipant = (o: Owner) =>
    set('participants', form.participants.includes(o) ? form.participants.filter(p => p !== o) : [...form.participants, o])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSave({
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
      participants: form.participants,
      notes: form.notes || undefined,
      ata: form.ata || undefined,
      tag: (form.tag as MeetingTag) || undefined,
      recurring: form.recurring || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900">{meeting ? 'Reunião' : 'Nova Reunião'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Título *</label>
            <input required autoFocus value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ex: Reunião de alinhamento semanal"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Data e horário *</label>
            <input required type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Participantes</label>
            <div className="flex gap-2 flex-wrap">
              {(['A','E','G','D'] as Owner[]).map(o => (
                <button key={o} type="button" onClick={() => toggleParticipant(o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.participants.includes(o) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                  {OWNER_NAMES[o]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de reunião</label>
            <div className="flex gap-1.5 flex-wrap">
              <button type="button" onClick={() => set('tag', '')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!form.tag ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                —
              </button>
              {(Object.keys(TAG_CONFIG) as MeetingTag[]).map(t => (
                <button key={t} type="button" onClick={() => set('tag', t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.tag === t ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}
                  title={TAG_CONFIG[t].desc}>
                  {TAG_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notas / pauta</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Tópicos da reunião, contexto..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">ATA da reunião</label>
            <textarea value={form.ata} onChange={e => set('ata', e.target.value)}
              placeholder="Decisões tomadas, responsáveis, próximos passos..."
              rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.recurring} onChange={e => set('recurring', e.target.checked)}
              className="rounded accent-[#1B4332]" />
            <span className="text-sm text-gray-700 flex items-center gap-1.5"><Repeat size={13} className="text-gray-400" /> Reunião recorrente</span>
          </label>

          <div className="flex gap-3 pt-1 pb-2">
            {meeting && onDelete && (
              <button type="button" onClick={() => { onDelete(meeting.id); onClose() }}
                className="px-4 py-3 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                Excluir
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-bold hover:bg-[#1B4332]/90 transition-colors">
              {meeting ? 'Salvar alterações' : 'Criar reunião'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Meeting Card
// ─────────────────────────────────────────────
interface MeetingCardProps {
  meeting: Meeting
  onClick: () => void
  past?: boolean
}

function MeetingCard({ meeting: m, onClick, past }: MeetingCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm
        ${past ? 'opacity-40 border-gray-100 bg-white' : 'bg-white border-gray-100 hover:border-[#1B4332]/20'}
        ${m.recurring ? 'border-dashed' : ''}`}>
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{m.title}</p>
        {m.recurring && <Repeat size={10} className="text-gray-400 flex-shrink-0 mt-0.5" />}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1.5">
        <Clock size={9} />
        {format(parseISO(m.date), 'HH:mm')}
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        {m.tag && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TAG_CONFIG[m.tag].color}`}>
            {TAG_CONFIG[m.tag].label}
          </span>
        )}
        {m.participants.slice(0, 3).map(p => (
          <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>{p}</span>
        ))}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
type ViewMode = 'semanal' | 'lista' | 'dia' | 'mes'

export function AgendaPage() {
  const [meetings, setMeetings] = useMeetings()
  const [viewMode, setViewMode] = useState<ViewMode>('semanal')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [search, setSearch] = useState('')
  const [filterParticipant, setFilterParticipant] = useState<Owner | 'all'>('all')
  const [filterTag, setFilterTag] = useState<MeetingTag | 'all'>('all')
  const [modalMeeting, setModalMeeting] = useState<Meeting | null | undefined>(undefined)
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const applyFilters = useCallback((m: Meeting) => {
    if (filterParticipant !== 'all' && !m.participants.includes(filterParticipant)) return false
    if (filterTag !== 'all' && m.tag !== filterTag) return false
    if (search) {
      const q = search.toLowerCase()
      if (!m.title.toLowerCase().includes(q) && !(m.notes?.toLowerCase().includes(q)) && !(m.ata?.toLowerCase().includes(q))) return false
    }
    return true
  }, [filterParticipant, filterTag, search])

  const meetingsForDay = (day: Date) =>
    meetings.filter(m => isSameDay(parseISO(m.date), day) && applyFilters(m))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const allFiltered = meetings.filter(applyFilters)
  const upcoming = allFiltered.filter(m => !isPast(parseISO(m.date))).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const past = allFiltered.filter(m => isPast(parseISO(m.date))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const openNew = (defaultDate?: string) => {
    setModalMeeting(null)
    setModalDefaultDate(defaultDate)
  }

  const handleSave = (data: Omit<Meeting, 'id'>) => {
    if (modalMeeting) {
      setMeetings(prev => prev.map(m => m.id === modalMeeting.id ? { ...m, ...data } : m))
    } else {
      setMeetings(prev => [...prev, { id: Date.now().toString(), ...data }])
    }
    setModalMeeting(undefined)
  }

  const handleDelete = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id))
    setModalMeeting(undefined)
  }

  // Month view helpers
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calStart = subDays(monthStart, getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1)
  const calEnd = addD(monthEnd, getDay(monthEnd) === 0 ? 0 : 7 - getDay(monthEnd))
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agenda</h2>
          <p className="text-xs text-gray-400 mt-0.5">{meetings.length} reuniões registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('dia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'dia' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Dia
            </button>
            <button onClick={() => setViewMode('semanal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'semanal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Calendar size={12} /> Semanal
            </button>
            <button onClick={() => setViewMode('mes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'mes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Mensal
            </button>
            <button onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <List size={12} /> Lista
            </button>
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-[#1B4332]/90 transition-colors">
            <Plus size={15} /> Nova
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar reunião..." />
        <div className="flex gap-1.5 flex-wrap">
          {(['all','A','E','G','D'] as const).map(o => (
            <button key={o} onClick={() => setFilterParticipant(o)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterParticipant === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              {o === 'all' ? 'Todos' : OWNER_NAMES[o as Owner]}
            </button>
          ))}
          <span className="text-gray-300 self-center">·</span>
          <button onClick={() => setFilterTag('all')}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterTag === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
            Todos tipos
          </button>
          {(Object.keys(TAG_CONFIG) as MeetingTag[]).map(t => (
            <button key={t} onClick={() => setFilterTag(t)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterTag === t ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              {TAG_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Google Calendar info card */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Calendar size={16} className="text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700 flex-1">
          Para integrar com Google Agenda, acesse{' '}
          <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 inline-flex items-center gap-0.5">
            calendar.google.com <ExternalLink size={10} />
          </a>{' '}
          → Configurações → Exportar calendário → importe o arquivo .ics
        </p>
      </div>

      {/* ── DAY VIEW ─────────────────────────────── */}
      {viewMode === 'dia' && (
        <div>
          {/* Day navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedDay(d => subDays(d, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className={`text-base font-bold ${isToday(selectedDay) ? 'text-[#1B4332]' : 'text-gray-900'}`}>
                {format(selectedDay, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {isToday(selectedDay) && <p className="text-xs text-[#1B4332]/60 font-medium">Hoje</p>}
            </div>
            <div className="flex items-center gap-1">
              {!isToday(selectedDay) && (
                <button onClick={() => setSelectedDay(new Date())}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  Hoje
                </button>
              )}
              <button onClick={() => setSelectedDay(d => addD(d, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day meetings */}
          {(() => {
            const dayMeetings = meetingsForDay(selectedDay)
            const upcomingDay = dayMeetings.filter(m => !isPast(parseISO(m.date)))
            const pastDay = dayMeetings.filter(m => isPast(parseISO(m.date)))
            return (
              <div>
                {dayMeetings.length === 0 ? (
                  <div
                    onClick={() => openNew(format(selectedDay, "yyyy-MM-dd'T'09:00"))}
                    className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#1B4332]/30 hover:bg-[#1B4332]/2 transition-colors">
                    <Calendar size={32} className="text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">Nenhuma reunião neste dia</p>
                    <p className="text-xs text-gray-300 mt-1">Clique para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDay.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Próximas</p>
                        {upcomingDay.map(m => (
                          <MeetingCard key={m.id} meeting={m} onClick={() => setModalMeeting(m)} />
                        ))}
                      </div>
                    )}
                    {pastDay.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Realizadas</p>
                        {pastDay.map(m => (
                          <MeetingCard key={m.id} meeting={m} past onClick={() => setModalMeeting(m)} />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => openNew(format(selectedDay, "yyyy-MM-dd'T'09:00"))}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-[#1B4332]/30 hover:text-[#1B4332] transition-colors">
                      <Plus size={14} /> Adicionar reunião neste dia
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── WEEKLY VIEW ─────────────────────────────── */}
      {viewMode === 'semanal' && (
        <div>
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">
                {format(weekStart, "d 'de' MMMM", { locale: ptBR })} – {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Hoje
              </button>
              <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 gap-2 min-h-[400px]">
            {weekDays.map(day => {
              const dayMeetings = meetingsForDay(day)
              const pastMeetings = dayMeetings.filter(m => isPast(parseISO(m.date)))
              const upcomingMeetings = dayMeetings.filter(m => !isPast(parseISO(m.date)))
              const isCurrentDay = isToday(day)

              return (
                <div key={day.toISOString()} className="flex flex-col">
                  {/* Day header */}
                  <div className={`text-center py-2 mb-2 rounded-xl ${isCurrentDay ? 'bg-[#1B4332] text-white' : 'bg-gray-50 text-gray-600'}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wide">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-base font-bold leading-tight ${isCurrentDay ? 'text-white' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>

                  {/* Clickable day area */}
                  <div
                    onClick={() => openNew(format(day, "yyyy-MM-dd'T'09:00"))}
                    className="flex-1 w-full rounded-xl border border-dashed border-gray-100 hover:border-[#1B4332]/20 hover:bg-[#1B4332]/2 transition-colors min-h-[60px] p-1.5 flex flex-col gap-1.5 cursor-pointer">
                    {upcomingMeetings.map(m => (
                      <div key={m.id} onClick={e => { e.stopPropagation(); setModalMeeting(m) }}>
                        <MeetingCard meeting={m} onClick={() => setModalMeeting(m)} />
                      </div>
                    ))}
                    {pastMeetings.map(m => (
                      <div key={m.id} onClick={e => { e.stopPropagation(); setModalMeeting(m) }}>
                        <MeetingCard meeting={m} past onClick={() => setModalMeeting(m)} />
                      </div>
                    ))}
                    {dayMeetings.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <Plus size={12} className="text-gray-200" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MONTH VIEW ─────────────────────────────── */}
      {viewMode === 'mes' && (
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonthDate(d => subMonths(d, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 capitalize">
                {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMonthDate(new Date())}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Hoje
              </button>
              <button onClick={() => setMonthDate(d => addMonths(d, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map(day => {
              const dayMeetings = meetingsForDay(day)
              const inMonth = day.getMonth() === monthDate.getMonth()
              const isCurrentDay = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); setViewMode('dia') }}
                  className={`min-h-[72px] rounded-xl p-1.5 cursor-pointer transition-colors border ${
                    isCurrentDay
                      ? 'bg-[#1B4332] border-[#1B4332]'
                      : inMonth
                        ? 'bg-white border-gray-100 hover:border-[#1B4332]/30 hover:bg-[#1B4332]/3'
                        : 'bg-gray-50/50 border-gray-50 opacity-40'
                  }`}>
                  <p className={`text-xs font-bold mb-1 ${isCurrentDay ? 'text-white' : inMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {dayMeetings.slice(0, 3).map(m => (
                      <div key={m.id}
                        onClick={e => { e.stopPropagation(); setModalMeeting(m) }}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded font-medium truncate ${
                          isCurrentDay ? 'bg-white/20 text-white' : (m.tag ? TAG_CONFIG[m.tag].color : 'bg-[#1B4332]/10 text-[#1B4332]')
                        }`}>
                        {format(parseISO(m.date), 'HH:mm')} {m.title}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <p className={`text-[9px] font-bold ${isCurrentDay ? 'text-white/70' : 'text-gray-400'}`}>
                        +{dayMeetings.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────── */}
      {viewMode === 'lista' && (
        <div className="space-y-4">
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar size={12} /> Próximas ({upcoming.length})
            </h3>
            {upcoming.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma reunião agendada</p>}
            <div className="space-y-2">
              {upcoming.map(m => (
                <button key={m.id} onClick={() => setModalMeeting(m)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 hover:border-[#1B4332]/20 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                      <p className="text-xs text-[#1B4332] font-medium mt-0.5">
                        {format(parseISO(m.date), "EEEE, dd 'de' MMMM · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {m.recurring && <Repeat size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.tag && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAG_CONFIG[m.tag].color}`}>{TAG_CONFIG[m.tag].label}</span>}
                    {m.participants.map(p => (
                      <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>{p}</span>
                    ))}
                  </div>
                  {m.notes && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{m.notes}</p>}
                </button>
              ))}
            </div>
          </section>

          {past.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Realizadas ({past.length})</h3>
              <div className="space-y-2">
                {past.map(m => (
                  <button key={m.id} onClick={() => setModalMeeting(m)}
                    className="w-full text-left bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3 opacity-50 hover:opacity-80 transition-opacity">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{m.title}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(m.date), "dd/MM/yyyy · HH:mm")}</p>
                    </div>
                    <div className="flex gap-1 items-center flex-wrap">
                      {m.tag && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAG_CONFIG[m.tag].color}`}>{TAG_CONFIG[m.tag].label}</span>}
                      {m.participants.map(p => (
                        <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[p]}`}>{p}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal */}
      {modalMeeting !== undefined && (
        <MeetingModal
          meeting={modalMeeting ?? null}
          defaultDate={modalDefaultDate}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setModalMeeting(undefined); setModalDefaultDate(undefined) }}
        />
      )}
    </div>
  )
}
