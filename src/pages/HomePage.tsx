import { useState, useRef } from 'react'
import {
  AlertCircle, CheckCircle2, Circle, Plus, X, Calendar, List,
  Kanban, Lock, Unlock, ChevronDown, ChevronUp, Clock,
  Check, Trash2, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react'
import { usePriorities, useMeetings, useDeletedPriorities } from '../hooks/useLocalData'
import { useAuth } from '../hooks/useAuth'
import {
  format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek,
  addDays, addWeeks, subWeeks, addMonths, subMonths, startOfMonth,
  endOfMonth, eachDayOfInterval, isSameDay, isSameMonth
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Owner, Priority } from '../types'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  D: 'bg-pink-100 text-pink-700',
  todos: 'bg-gray-100 text-gray-600',
}
const OWNER_LABELS: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', D: 'Daniela', todos: 'Todos'
}

const TEMA_COLORS = [
  '#1B4332','#1d4ed8','#7c3aed','#be185d','#b45309',
  '#0f766e','#dc2626','#16a34a','#9333ea','#ea580c',
]
function getTemaColor(tema: string, all: string[]): string {
  const idx = all.indexOf(tema)
  return TEMA_COLORS[idx % TEMA_COLORS.length]
}

function formatMeetingDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return `Hoje ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Amanhã ${format(d, 'HH:mm')}`
  return format(d, "dd/MM · HH:mm", { locale: ptBR })
}

// ── Add/Edit Form ─────────────────────────────────────────────────────────────
interface FormProps {
  initial?: Partial<Priority>
  onSave: (p: Partial<Priority>) => void
  onCancel: () => void
  currentUser: string
  privateMode: boolean
  defaultDate?: string
}

function PriorityForm({ initial, onSave, onCancel, currentUser, privateMode, defaultDate }: FormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [owner, setOwner] = useState<Owner>(initial?.owner ?? 'todos')
  const [urgent, setUrgent] = useState(initial?.urgent ?? false)
  const [important, setImportant] = useState(initial?.important ?? false)
  const [isPrivate, setIsPrivate] = useState(initial?.private ?? privateMode)
  const [tema, setTema] = useState(initial?.tema ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? '')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(), owner, urgent, important,
      private: isPrivate, privateOwner: isPrivate ? currentUser : undefined,
      tema: tema.trim() || undefined, description: description.trim() || undefined,
      date: date || undefined,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 space-y-3 shadow-lg">
      <input
        autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="Título da prioridade..."
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Responsável</p>
          <div className="flex gap-1 flex-wrap">
            {(['A','E','G','D','todos'] as Owner[]).map(o => (
              <button key={o} onClick={() => setOwner(o)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${owner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                {o === 'todos' ? 'Todos' : o}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Data</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#1B4332] w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Tema</p>
          <input value={tema} onChange={e => setTema(e.target.value)}
            placeholder="Ex: Comercial, Produto..."
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1B4332]" />
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Descrição breve</p>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Contexto rápido..."
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1B4332]" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setUrgent(!urgent)}
          className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors ${urgent ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'}`}>
          🔴 Urgente
        </button>
        <button onClick={() => setImportant(!important)}
          className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors ${important ? 'bg-amber-400 text-white border-amber-400' : 'border-gray-200 text-gray-600'}`}>
          ⭐ Importante
        </button>
        <button onClick={() => setIsPrivate(!isPrivate)}
          className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors flex items-center gap-1 ${isPrivate ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-200 text-gray-600'}`}>
          {isPrivate ? <Lock size={9} /> : <Unlock size={9} />} Particular
        </button>
      </div>
      {(urgent || important) && (
        <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <strong className="text-gray-600">Matriz Eisenhower:</strong>{' '}
          {urgent && important ? '🔴⭐ Urgente + Importante → Faça agora' :
           urgent ? '🔴 Urgente, não importante → Delegue' :
           '⭐ Importante, não urgente → Planeje com cuidado'}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 bg-[#1B4332] text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
        <button onClick={onCancel} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
      </div>
    </div>
  )
}

// ── Priority Card (click to open detail) ─────────────────────────────────────
interface CardProps {
  p: Priority
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  draggable?: boolean
  onDragStart?: () => void
}

function PriorityCard({ p, onToggle, onRemove, onEdit, draggable, onDragStart }: CardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onEdit}
      className={`bg-white rounded-xl border px-3 py-2.5 cursor-pointer group transition-shadow hover:shadow-sm ${
        p.urgent ? 'border-red-200 bg-red-50/50' :
        p.important ? 'border-amber-200 bg-amber-50/30' :
        p.done ? 'border-gray-100 opacity-60' :
        'border-gray-100'
      } ${p.private ? 'ring-1 ring-purple-200' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className="mt-0.5 flex-shrink-0"
          title={p.done ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {p.done
            ? <CheckCircle2 size={16} className="text-[#1B4332]" />
            : <Circle size={16} className="text-gray-300 group-hover:text-gray-400" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-snug ${p.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{p.title}</p>
          {p.description && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.description}</p>}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {p.urgent && <span className="text-[9px] text-red-600 font-bold">🔴</span>}
            {p.important && <span className="text-[9px] text-amber-600 font-bold">⭐</span>}
            {p.private && <Lock size={8} className="text-purple-400" />}
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${OWNER_COLORS[p.owner]}`}>{p.owner === 'todos' ? 'All' : p.owner}</span>
            {p.tema && (
              <span className="text-[9px] text-white font-medium px-1 py-0.5 rounded-full" style={{ backgroundColor: '#1B4332' }}>{p.tema}</span>
            )}
            {p.date && <span className="text-[9px] text-gray-400">{format(parseISO(p.date), 'dd/MM')}</span>}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5"
        >
          <X size={11} />
        </button>
      </div>
      {p.done && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={e => { e.stopPropagation(); onToggle() }}
            className="flex items-center gap-1 text-[10px] font-medium text-[#1B4332] hover:text-[#1B4332]/70 transition-colors"
          >
            <RotateCcw size={10} /> Reabrir
          </button>
        </div>
      )}
    </div>
  )
}

// ── Drag Confirm Popup ────────────────────────────────────────────────────────
interface DragConfirmProps {
  priority: Priority
  toDate: Date
  onConfirm: () => void
  onCancel: () => void
}

function DragConfirmPopup({ priority, toDate, onConfirm, onCancel }: DragConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Confirmar mudança de data</h3>
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-sm text-gray-700 font-medium">{priority.title}</p>
          <div className="flex gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[priority.owner]}`}>{OWNER_LABELS[priority.owner]}</span>
            {priority.tema && <span className="text-[10px] text-white font-medium px-1.5 py-0.5 rounded-full bg-[#1B4332]">{priority.tema}</span>}
            {priority.description && <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded-full bg-gray-200">{priority.description}</span>}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Mover para <strong className="text-[#1B4332] capitalize">{format(toDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</strong>?
        </p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 bg-[#1B4332] text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1.5">
            <Check size={14} /> Confirmar
          </button>
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
interface KanbanColProps {
  date: Date
  items: Priority[]
  isToday: boolean
  onDrop: (date: Date) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (p: Priority) => void
  onDragStart: (p: Priority) => void
  onDoubleClick: (date: Date) => void
}

function KanbanColumn({ date, items, isToday: itIsToday, onDrop, onToggle, onRemove, onEdit, onDragStart, onDoubleClick }: KanbanColProps) {
  const [over, setOver] = useState(false)
  const pending = items.filter(p => !p.done)
  const done = items.filter(p => p.done)

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col rounded-xl border-2 transition-colors ${over ? 'border-[#1B4332]/40 bg-[#1B4332]/5' : 'border-transparent'}`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(date) }}
      onDoubleClick={() => onDoubleClick(date)}
    >
      {/* Column header */}
      <div className={`px-3 py-2 rounded-t-xl text-center flex-shrink-0 ${itIsToday ? 'bg-[#1B4332]' : 'bg-white border border-gray-100'}`}>
        <p className={`text-[9px] font-bold uppercase tracking-wider ${itIsToday ? 'text-white/70' : 'text-gray-400'}`}>
          {format(date, 'EEE', { locale: ptBR })}
        </p>
        <p className={`text-lg font-black leading-none ${itIsToday ? 'text-white' : 'text-gray-700'}`}>
          {format(date, 'd')}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 p-1.5 space-y-1.5 min-h-[100px] bg-gray-50/50 rounded-b-xl">
        {pending.map(p => (
          <PriorityCard key={p.id} p={p}
            onToggle={() => onToggle(p.id)}
            onRemove={() => onRemove(p.id)}
            onEdit={() => onEdit(p)}
            draggable
            onDragStart={() => onDragStart(p)}
          />
        ))}
        {done.map(p => (
          <PriorityCard key={p.id} p={p}
            onToggle={() => onToggle(p.id)}
            onRemove={() => onRemove(p.id)}
            onEdit={() => onEdit(p)}
          />
        ))}
        {items.length === 0 && (
          <p className="text-[9px] text-gray-300 text-center pt-3 select-none">duplo clique para adicionar</p>
        )}
      </div>
    </div>
  )
}

// ── Monthly Grid ──────────────────────────────────────────────────────────────
function MonthlyGrid({
  baseDate, priorities, onToggle, onRemove, onEdit, onDoubleClickDay
}: {
  baseDate: Date; priorities: Priority[];
  onToggle: (id: string) => void; onRemove: (id: string) => void; onEdit: (p: Priority) => void
  onDoubleClickDay: (d: Date) => void
}) {
  const firstDay = startOfMonth(baseDate)
  const lastDay = endOfMonth(baseDate)
  const days = eachDayOfInterval({ start: startOfWeek(firstDay, { weekStartsOn: 0 }), end: endOfWeek(lastDay, { weekStartsOn: 0 }) })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const itemsForDay = (d: Date) => priorities.filter(p => p.date && isSameDay(parseISO(p.date), d))
  const selectedItems = selectedDay ? itemsForDay(selectedDay) : []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 text-center">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <p key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const items = itemsForDay(d)
          const inMonth = isSameMonth(d, baseDate)
          const todayD = isToday(d)
          const sel = selectedDay && isSameDay(d, selectedDay)
          return (
            <button key={d.toISOString()}
              onClick={() => setSelectedDay(prev => prev && isSameDay(prev, d) ? null : d)}
              onDoubleClick={() => onDoubleClickDay(d)}
              className={`rounded-xl p-1.5 text-left transition-all min-h-[56px] border ${
                sel ? 'border-[#1B4332] bg-[#1B4332]/5' :
                todayD ? 'border-[#1B4332]/30 bg-[#1B4332]/5' :
                !inMonth ? 'border-transparent' :
                'border-gray-100 bg-white hover:border-gray-200'
              }`}>
              <span className={`text-xs font-bold ${!inMonth ? 'text-gray-300' : todayD ? 'text-[#1B4332]' : 'text-gray-600'}`}>
                {format(d, 'd')}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {items.slice(0,2).map(p => (
                  <div key={p.id} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${p.urgent ? 'bg-red-100 text-red-700' : p.important ? 'bg-amber-100 text-amber-700' : 'bg-[#1B4332]/10 text-[#1B4332]'}`}>
                    {p.title}
                  </div>
                ))}
                {items.length > 2 && <div className="text-[9px] text-gray-400">+{items.length - 2}</div>}
              </div>
            </button>
          )
        })}
      </div>
      {selectedDay && selectedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-700 mb-2 capitalize">
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="space-y-2">
            {selectedItems.map(p => (
              <PriorityCard key={p.id} p={p} onToggle={() => onToggle(p.id)} onRemove={() => onRemove(p.id)} onEdit={() => onEdit(p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Daily View ────────────────────────────────────────────────────────────────
function DailyView({
  date, priorities, onToggle, onRemove, onEdit
}: { date: Date; priorities: Priority[]; onToggle: (id: string) => void; onRemove: (id: string) => void; onEdit: (p: Priority) => void }) {
  const items = priorities.filter(p => p.date && isSameDay(parseISO(p.date), date))
  const unscheduled = priorities.filter(p => !p.date && !p.done)
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 capitalize">
          {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <div className="space-y-2">
          {items.map(p => <PriorityCard key={p.id} p={p} onToggle={() => onToggle(p.id)} onRemove={() => onRemove(p.id)} onEdit={() => onEdit(p)} />)}
          {items.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Nenhuma prioridade para este dia</p>}
        </div>
      </div>
      {unscheduled.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sem data</p>
          <div className="space-y-2">
            {unscheduled.map(p => <PriorityCard key={p.id} p={p} onToggle={() => onToggle(p.id)} onRemove={() => onRemove(p.id)} onEdit={() => onEdit(p)} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Theme Summary ─────────────────────────────────────────────────────────────
function ThemeSummary({ priorities }: { priorities: Priority[] }) {
  const pending = priorities.filter(p => !p.done && p.tema)
  const allTemas = Array.from(new Set(pending.map(p => p.tema!)))
  if (allTemas.length === 0) return null
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
        <Clock size={10} /> Distribuição de temas
      </p>
      <div className="space-y-2">
        {allTemas.map(tema => {
          const count = pending.filter(p => p.tema === tema).length
          const pct = Math.round((count / pending.length) * 100)
          const color = getTemaColor(tema, allTemas)
          return (
            <div key={tema}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="font-medium text-gray-700">{tema}</span>
                <span className="text-gray-400">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Deleted History ───────────────────────────────────────────────────────────
function DeletedHistory({ deleted, onRestore }: { deleted: Priority[]; onRestore: (p: Priority) => void }) {
  const [open, setOpen] = useState(false)
  if (deleted.length === 0) return null
  const monthOld = deleted.filter(p => p.deleted_at && Date.now() - new Date(p.deleted_at).getTime() > 30 * 24 * 60 * 60 * 1000)
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <Trash2 size={12} /> {deleted.length} excluída(s)
          {monthOld.length > 0 && <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{monthOld.length} com +30 dias</span>}
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {monthOld.length > 0 && (
            <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              💡 {monthOld.length} prioridade(s) com mais de 30 dias excluídas.
            </p>
          )}
          {deleted.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 line-through truncate">{p.title}</p>
                <p className="text-[9px] text-gray-300">{p.deleted_at ? format(parseISO(p.deleted_at), 'dd/MM/yyyy') : ''}</p>
              </div>
              <button onClick={() => onRestore(p)} className="text-[10px] text-[#1B4332] font-medium flex items-center gap-1">
                <RotateCcw size={10} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  priority, onSave, onCancel, currentUser, privateMode
}: { priority: Priority; onSave: (f: Partial<Priority>) => void; onCancel: () => void; currentUser: string; privateMode: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-16">
      <div className="w-full max-w-md">
        <PriorityForm
          initial={priority}
          onSave={onSave}
          onCancel={onCancel}
          currentUser={currentUser}
          privateMode={privateMode}
        />
      </div>
    </div>
  )
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export function HomePage() {
  const { user } = useAuth()
  const [priorities, setPriorities] = usePriorities()
  const [deletedPriorities, setDeletedPriorities] = useDeletedPriorities()
  const [meetings] = useMeetings()

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [calView, setCalView] = useState<'day' | 'week' | 'month'>('week')
  const [baseDate, setBaseDate] = useState(new Date())
  const [privateMode, setPrivateMode] = useState(false)
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showDoneCollapsed, setShowDoneCollapsed] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>()
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)

  const dragItem = useRef<Priority | null>(null)
  const [dragConfirm, setDragConfirm] = useState<{ priority: Priority; toDate: Date } | null>(null)

  // ── Filtering ─────────────────────────────────────────────────────────────
  const visiblePriorities = priorities.filter(p => {
    if (p.private && p.privateOwner !== user?.email) return false
    if (privateMode && !p.private) return false
    if (filterOwner !== 'all' && p.owner !== filterOwner) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const pending = visiblePriorities.filter(p => !p.done)
  const done = visiblePriorities.filter(p => p.done)

  // ── Navigation ────────────────────────────────────────────────────────────
  const goPrev = () => {
    if (calView === 'day') setBaseDate(d => addDays(d, -1))
    else if (calView === 'week') setBaseDate(d => subWeeks(d, 1))
    else setBaseDate(d => subMonths(d, 1))
  }
  const goNext = () => {
    if (calView === 'day') setBaseDate(d => addDays(d, 1))
    else if (calView === 'week') setBaseDate(d => addWeeks(d, 1))
    else setBaseDate(d => addMonths(d, 1))
  }
  const navLabel = () => {
    if (calView === 'day') return format(baseDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    if (calView === 'week') {
      const s = startOfWeek(baseDate, { weekStartsOn: 0 })
      const e = endOfWeek(baseDate, { weekStartsOn: 0 })
      return `${format(s, 'dd MMM', { locale: ptBR })} – ${format(e, 'dd MMM yyyy', { locale: ptBR })}`
    }
    return format(baseDate, 'MMMM yyyy', { locale: ptBR })
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(baseDate, { weekStartsOn: 0 }), i))
  const itemsForDay = (d: Date) => visiblePriorities.filter(p => p.date && isSameDay(parseISO(p.date), d))
  const unscheduled = pending.filter(p => !p.date)

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addPriority = (fields: Partial<Priority>) => {
    setPriorities(prev => [...prev, {
      id: Date.now().toString(),
      title: fields.title!,
      owner: fields.owner ?? 'todos',
      urgent: fields.urgent ?? false,
      important: fields.important ?? false,
      done: false,
      private: fields.private ?? false,
      privateOwner: fields.privateOwner,
      tema: fields.tema,
      description: fields.description,
      date: fields.date,
      created_at: new Date().toISOString(),
    }])
    setShowAdd(false)
    setAddDefaultDate(undefined)
  }

  const updatePriority = (id: string, fields: Partial<Priority>) => {
    setPriorities(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    setEditingPriority(null)
  }

  const toggleDone = (id: string) => setPriorities(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p))

  const removePriority = (id: string) => {
    const p = priorities.find(x => x.id === id)
    if (p) setDeletedPriorities(prev => [...prev, { ...p, deleted_at: new Date().toISOString() }])
    setPriorities(prev => prev.filter(p => p.id !== id))
  }

  const restorePriority = (p: Priority) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deleted_at: _, ...rest } = p as Priority & { deleted_at?: string }
    setPriorities(prev => [...prev, { ...rest, done: false }])
    setDeletedPriorities(prev => prev.filter(x => x.id !== p.id))
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (p: Priority) => { dragItem.current = p }
  const handleDrop = (toDate: Date) => {
    if (!dragItem.current) return
    setDragConfirm({ priority: dragItem.current, toDate })
    dragItem.current = null
  }
  const confirmDrag = () => {
    if (!dragConfirm) return
    updatePriority(dragConfirm.priority.id, { date: format(dragConfirm.toDate, 'yyyy-MM-dd') })
    setDragConfirm(null)
  }

  // ── Double-click on column ────────────────────────────────────────────────
  const handleDoubleClickDate = (d: Date) => {
    setAddDefaultDate(format(d, 'yyyy-MM-dd'))
    setShowAdd(true)
  }

  const upcoming = meetings
    .filter(m => new Date(m.date) >= new Date())
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Olá, {user?.name} 👋</h2>
          <p className="text-sm text-gray-500 capitalize">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <button
          onClick={() => setPrivateMode(m => !m)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${privateMode ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-500 hover:border-purple-300'}`}
        >
          {privateMode ? <Lock size={12} /> : <Unlock size={12} />}
          {privateMode ? 'Particular' : 'Compartilhado'}
        </button>
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
      <section className="space-y-3">
        {/* Sub-header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={12} /> Prioridades
            <span className="font-normal">({pending.length} pendentes)</span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <Kanban size={12} /> Kanban
              </button>
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <List size={12} /> Lista
              </button>
            </div>
            <button onClick={() => { setAddDefaultDate(undefined); setShowAdd(true) }}
              className="flex items-center gap-1 bg-[#1B4332] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-90">
              <Plus size={12} /> Adicionar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar prioridade..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1B4332] flex-1 min-w-[140px]" />
          <div className="flex gap-1">
            {(['all','A','E','G','D'] as const).map(o => (
              <button key={o} onClick={() => setFilterOwner(o)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {o === 'all' ? 'Todos' : o}
              </button>
            ))}
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <PriorityForm
            defaultDate={addDefaultDate}
            onSave={addPriority}
            onCancel={() => { setShowAdd(false); setAddDefaultDate(undefined) }}
            currentUser={user?.email ?? ''}
            privateMode={privateMode}
          />
        )}

        {/* ── KANBAN VIEW ── */}
        {viewMode === 'kanban' && (
          <div className="space-y-4">
            {/* Cal controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(['day','week','month'] as const).map(v => (
                  <button key={v} onClick={() => setCalView(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calView === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    {v === 'day' ? 'Diário' : v === 'week' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={14} /></button>
                <button onClick={() => setBaseDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-600 hover:border-[#1B4332]/30">Hoje</button>
                <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={14} /></button>
              </div>
              <p className="text-sm font-semibold text-gray-700 capitalize flex-1">{navLabel()}</p>
            </div>

            {calView === 'week' && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {weekDays.map(d => (
                  <KanbanColumn key={d.toISOString()} date={d} items={itemsForDay(d)} isToday={isToday(d)}
                    onDrop={handleDrop} onToggle={toggleDone} onRemove={removePriority}
                    onEdit={setEditingPriority} onDragStart={handleDragStart}
                    onDoubleClick={handleDoubleClickDate}
                  />
                ))}
              </div>
            )}
            {calView === 'day' && (
              <DailyView date={baseDate} priorities={visiblePriorities} onToggle={toggleDone} onRemove={removePriority} onEdit={setEditingPriority} />
            )}
            {calView === 'month' && (
              <MonthlyGrid baseDate={baseDate} priorities={visiblePriorities} onToggle={toggleDone} onRemove={removePriority} onEdit={setEditingPriority} onDoubleClickDay={handleDoubleClickDate} />
            )}

            {/* Unscheduled */}
            {(calView === 'week' || calView === 'month') && unscheduled.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sem data ({unscheduled.length})</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {unscheduled.map(p => (
                    <PriorityCard key={p.id} p={p} onToggle={() => toggleDone(p.id)} onRemove={() => removePriority(p.id)} onEdit={() => setEditingPriority(p)} />
                  ))}
                </div>
              </div>
            )}

            <ThemeSummary priorities={visiblePriorities} />
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {pending.map(p => (
              <PriorityCard key={p.id} p={p} onToggle={() => toggleDone(p.id)} onRemove={() => removePriority(p.id)} onEdit={() => setEditingPriority(p)} />
            ))}
            {pending.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma prioridade pendente</p>}

            {/* Completed (collapsed by default) */}
            {done.length > 0 && (
              <div className="mt-2">
                <button onClick={() => setShowDoneCollapsed(c => !c)}
                  className="flex items-center gap-2 text-xs text-gray-400 font-medium w-full text-left py-1">
                  {showDoneCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  {done.length} concluída(s)
                </button>
                {!showDoneCollapsed && (
                  <div className="space-y-1.5 mt-2">
                    {done.map(p => (
                      <PriorityCard key={p.id} p={p} onToggle={() => toggleDone(p.id)} onRemove={() => removePriority(p.id)} onEdit={() => setEditingPriority(p)} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <ThemeSummary priorities={visiblePriorities} />
          </div>
        )}

        {/* Completed in kanban view (always collapsed) */}
        {viewMode === 'kanban' && done.length > 0 && (
          <div>
            <button onClick={() => setShowDoneCollapsed(c => !c)}
              className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              {showDoneCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              {done.length} concluída(s)
            </button>
            {!showDoneCollapsed && (
              <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {done.map(p => (
                  <PriorityCard key={p.id} p={p} onToggle={() => toggleDone(p.id)} onRemove={() => removePriority(p.id)} onEdit={() => setEditingPriority(p)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deleted history */}
        <DeletedHistory deleted={deletedPriorities} onRestore={restorePriority} />
      </section>

      {/* Edit modal */}
      {editingPriority && (
        <DetailModal
          priority={editingPriority}
          onSave={fields => updatePriority(editingPriority.id, fields)}
          onCancel={() => setEditingPriority(null)}
          currentUser={user?.email ?? ''}
          privateMode={privateMode}
        />
      )}

      {/* Drag confirm */}
      {dragConfirm && (
        <DragConfirmPopup priority={dragConfirm.priority} toDate={dragConfirm.toDate} onConfirm={confirmDrag} onCancel={() => setDragConfirm(null)} />
      )}
    </div>
  )
}
