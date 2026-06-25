import { useState, useRef } from 'react'
import { CheckCircle2, Circle, Plus, ChevronDown, ChevronUp, X, Check, RotateCcw, Trash2, Kanban, List, Calendar } from 'lucide-react'
import { useTasks, useDeletedTasks } from '../hooks/useLocalData'
import { parseISO, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import type { Owner, Task } from '../types'
import { SearchBar } from '../components/SearchBar'
import { RightPanel } from '../components/RightPanel'
import { useAuth } from '../hooks/useAuth'
import type { UserConfig } from './SettingsPage'

function getUserConfig(email: string): UserConfig | null {
  try {
    const configs = JSON.parse(localStorage.getItem('gg_user_configs') ?? '[]') as UserConfig[]
    return configs.find(c => c.email === email) ?? null
  } catch { return null }
}

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700', E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700', D: 'bg-pink-100 text-pink-700',
  todos: 'bg-gray-100 text-gray-600',
}
const OWNER_LABELS: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', D: 'Daniela', todos: 'Todos'
}
const PRIORITY_COLORS: Record<Task['priority'], string> = {
  alta: 'text-red-600 bg-red-50', media: 'text-yellow-600 bg-yellow-50', baixa: 'text-gray-500 bg-gray-50',
}
const AREA_LABELS: Record<Task['area'], string> = {
  produto: '⚙️ Produto', comercial: '💼 Comercial', juridico: '⚖️ Jurídico',
  financeiro: '💰 Financeiro', geral: '📌 Geral', marketing: '📣 Marketing', operacoes: '🔧 Operações',
}

// ── Date Inline Edit ──────────────────────────────────────────────────────────
function DateBadge({ value, onChange }: { value?: string; onChange: (d: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (editing) {
    return (
      <input
        autoFocus
        type="date"
        defaultValue={value ?? ''}
        onBlur={e => { onChange(e.target.value); setEditing(false) }}
        onKeyDown={e => { if (e.key === 'Enter') { onChange((e.target as HTMLInputElement).value); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="text-[9px] border border-[#1B4332]/30 rounded px-1 py-0.5 focus:outline-none focus:border-[#1B4332] w-24"
        onClick={e => e.stopPropagation()}
      />
    )
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); setEditing(true) }}
      className="flex items-center gap-0.5 text-[9px] text-gray-400 hover:text-[#1B4332] transition-colors"
      title="Clique para alterar prazo"
    >
      <Calendar size={9} />
      {value ? format(parseISO(value), 'dd/MM') : 'prazo'}
    </button>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  t: Task
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  onDateChange: (d: string) => void
  faded?: boolean
  draggable?: boolean
  onDragStart?: () => void
}

function TaskCard({ t, onToggle, onRemove, onEdit, onDateChange, faded, draggable, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-start gap-2 group hover:shadow-sm transition-shadow cursor-pointer ${faded ? 'opacity-50' : ''}`}
      onClick={onEdit}
    >
      <button onClick={e => { e.stopPropagation(); onToggle() }} className="mt-0.5 flex-shrink-0">
        {t.done ? <CheckCircle2 size={16} className="text-[#1B4332]" /> : <Circle size={16} className="text-gray-300" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug ${t.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
        {t.notes && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.notes}</p>}
        <div className="flex gap-1 mt-1 flex-wrap items-center">
          <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${OWNER_COLORS[t.owner]}`}>{OWNER_LABELS[t.owner]}</span>
          <span className={`text-[9px] font-medium px-1 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
          <DateBadge value={t.deadline} onChange={d => { onDateChange(d) }} />
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-gray-200 hover:text-red-400 p-0.5"><X size={11} /></button>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ task, onSave, onCancel }: { task: Task; onSave: (f: Partial<Task>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(task.title)
  const [owner, setOwner] = useState<Owner>(task.owner)
  const [priority, setPriority] = useState<Task['priority']>(task.priority)
  const [area, setArea] = useState<Task['area']>(task.area)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [deadline, setDeadline] = useState(task.deadline ?? '')

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Editar tarefa</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Responsável</p>
            <div className="flex gap-1 flex-wrap">
              {(['A','E','G','D','todos'] as Owner[]).map(o => (
                <button key={o} onClick={() => setOwner(o)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${owner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                  {o === 'todos' ? 'Todos' : o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Prazo</p>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-[#1B4332]" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Prioridade</p>
          <div className="flex gap-1.5">
            {(['alta','media','baixa'] as Task['priority'][]).map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${priority === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Área</p>
          <div className="flex gap-1 flex-wrap">
            {(Object.entries(AREA_LABELS) as [Task['area'], string][]).map(([a, label]) => (
              <button key={a} onClick={() => setArea(a)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${area === a ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Notas</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332] resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave({ title, owner, priority, area, notes: notes || undefined, deadline: deadline || undefined })}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1B4332] text-white rounded-xl py-2 text-sm font-medium">
            <Check size={13} /> Salvar
          </button>
          <button onClick={onCancel} className="px-4 border border-gray-200 rounded-xl text-sm text-gray-500">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Deleted Tasks History ─────────────────────────────────────────────────────
function DeletedHistory({ deleted, onRestore }: { deleted: Task[]; onRestore: (t: Task) => void }) {
  const [open, setOpen] = useState(false)
  if (deleted.length === 0) return null
  const monthOld = deleted.filter(t => t.deleted_at && Date.now() - new Date(t.deleted_at).getTime() > 30 * 24 * 60 * 60 * 1000)
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
          {monthOld.length > 0 && <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">💡 {monthOld.length} tarefa(s) com mais de 30 dias excluídas.</p>}
          {deleted.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 line-through truncate">{t.title}</p>
                <div className="flex gap-1 mt-0.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold ${OWNER_COLORS[t.owner]}`}>{t.owner}</span>
                  <span className="text-[9px] text-gray-300">{t.deleted_at ? format(parseISO(t.deleted_at), 'dd/MM/yyyy') : ''}</span>
                </div>
              </div>
              <button onClick={() => onRestore(t)} className="text-[10px] text-[#1B4332] font-medium flex items-center gap-1">
                <RotateCcw size={10} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Kanban Column (extracted to respect React rules of hooks) ─────────────────
interface KanbanColumnProps {
  area: Task['area']
  items: Task[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (t: Task) => void
  onDateChange: (id: string, d: string) => void
  onDragStart: (t: Task) => void
  onDrop: (area: Task['area']) => void
}

function KanbanColumn({ area, items, onToggle, onRemove, onEdit, onDateChange, onDragStart, onDrop }: KanbanColumnProps) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={`flex-shrink-0 w-48 flex flex-col rounded-xl border-2 transition-colors ${over ? 'border-[#1B4332]/40' : 'border-transparent'}`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(area) }}
    >
      <div className="bg-[#1B4332]/10 rounded-t-xl px-3 py-2">
        <p className="text-xs font-bold text-[#1B4332]">{AREA_LABELS[area]}</p>
        <p className="text-[10px] text-[#1B4332]/60">{items.length} pendente(s)</p>
      </div>
      <div className="bg-gray-50 rounded-b-xl p-2 space-y-2 min-h-[100px] flex-1">
        {items.map(t => (
          <TaskCard key={t.id} t={t}
            onToggle={() => onToggle(t.id)}
            onRemove={() => onRemove(t.id)}
            onEdit={() => onEdit(t)}
            onDateChange={d => onDateChange(t.id, d)}
            draggable
            onDragStart={() => onDragStart(t)}
          />
        ))}
        {items.length === 0 && <p className="text-[10px] text-gray-300 text-center pt-4">—</p>}
      </div>
    </div>
  )
}

// ── Main TarefasPage ──────────────────────────────────────────────────────────
export function TarefasPage() {
  const { user } = useAuth()
  const userConfig = getUserConfig(user?.email ?? '')
  const visibleAreas = (user?.role === 'admin' || !userConfig?.allowedAreas)
    ? (Object.keys(AREA_LABELS) as Task['area'][])
    : (Object.keys(AREA_LABELS) as Task['area'][]).filter(a => userConfig!.allowedAreas!.includes(a))

  const [tasks, setTasks] = useTasks()
  const [deletedTasks, setDeletedTasks] = useDeletedTasks()
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [filterArea, setFilterArea] = useState<Task['area'] | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all')
  const [showDone, setShowDone] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState<Owner>('todos')
  const [newPriority, setNewPriority] = useState<Task['priority']>('media')
  const [newArea, setNewArea] = useState<Task['area']>('geral')
  const [newDeadline, setNewDeadline] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const dragItem = useRef<Task | null>(null)

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const remove = (id: string) => {
    const t = tasks.find(x => x.id === id)
    if (t) setDeletedTasks(prev => [...prev, { ...t, deleted_at: new Date().toISOString() }])
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const restoreTask = (t: Task) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deleted_at: _, ...rest } = t as Task & { deleted_at?: string }
    setTasks(prev => [...prev, { ...rest, done: false }])
    setDeletedTasks(prev => prev.filter(x => x.id !== t.id))
  }

  const updateTask = (id: string, fields: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
    setEditingTask(null)
  }

  const addTask = () => {
    if (!newTitle.trim()) return
    setTasks(prev => [...prev, {
      id: Date.now().toString(), title: newTitle.trim(), owner: newOwner,
      done: false, priority: newPriority, area: newArea,
      deadline: newDeadline || undefined,
      notes: newNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    }])
    setNewTitle(''); setNewPriority('media'); setNewArea('geral'); setNewDeadline(''); setNewNotes(''); setShowAdd(false)
  }

  const handleDragStart = (t: Task) => { dragItem.current = t }
  const handleDropOnArea = (area: Task['area']) => {
    if (!dragItem.current || dragItem.current.area === area) return
    updateTask(dragItem.current.id, { area })
    dragItem.current = null
  }

  const filtered = tasks.filter(t => {
    if (filterOwner !== 'all' && t.owner !== filterOwner && t.owner !== 'todos') return false
    if (filterArea !== 'all' && t.area !== filterArea) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (startDate && endDate && t.deadline) {
      const d = parseISO(t.deadline)
      if (!isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })) return false
    }
    return true
  })

  const sortTasks = (arr: Task[]) => [...arr].sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    if (a.deadline) return -1
    if (b.deadline) return 1
    const pOrder = { alta: 0, media: 1, baixa: 2 }
    return pOrder[a.priority] - pOrder[b.priority]
  })

  const pending = sortTasks(filtered.filter(t => !t.done))
  const done = filtered.filter(t => t.done)

  const byArea = visibleAreas.reduce<Record<string, Task[]>>((acc, area) => {
    acc[area] = pending.filter(t => t.area === area)
    return acc
  }, {})

  // Highlight dates: deadlines of all tasks
  const highlightDates = tasks
    .filter(t => t.deadline && !t.done)
    .map(t => parseISO(t.deadline!))

  return (
    <div className="flex gap-4">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-900">Tarefas</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <List size={12} /> Lista
              </button>
              <button onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <Kanban size={12} /> Kanban
              </button>
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium">
              <Plus size={15} /> Nova
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar tarefa..." />
          <div className="flex gap-1.5 flex-wrap">
            {(['all','A','E','G','D'] as const).map(o => (
              <button key={o} onClick={() => setFilterOwner(o)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {o === 'all' ? 'Todos' : OWNER_LABELS[o]}
              </button>
            ))}
            <span className="text-gray-300 self-center">·</span>
            {(['all', ...Object.keys(AREA_LABELS)] as (Task['area'] | 'all')[]).map(a => (
              <button key={a} onClick={() => setFilterArea(a)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterArea === a ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {a === 'all' ? 'Todas áreas' : AREA_LABELS[a as Task['area']]}
              </button>
            ))}
            <span className="text-gray-300 self-center">·</span>
            {(['all','alta','media','baixa'] as (Task['priority'] | 'all')[]).map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterPriority === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {p === 'all' ? 'Prioridade' : p}
              </button>
            ))}
          </div>
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 text-xs text-[#1B4332] bg-[#1B4332]/5 px-3 py-1.5 rounded-lg w-fit">
              <Calendar size={11} />
              Prazo filtrado por data
              <button onClick={() => { setStartDate(null); setEndDate(null) }} className="text-gray-400 hover:text-red-400">
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 space-y-3">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Título da tarefa..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Responsável</p>
                <div className="flex gap-1 flex-wrap">
                  {(['A','E','G','D','todos'] as Owner[]).map(o => (
                    <button key={o} onClick={() => setNewOwner(o)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                      {o === 'todos' ? 'Todos' : o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Prazo</p>
                <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-[#1B4332]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Prioridade</p>
                <div className="flex gap-1 flex-wrap">
                  {(['alta','media','baixa'] as Task['priority'][]).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newPriority === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Área</p>
                <div className="flex gap-1 flex-wrap">
                  {(Object.entries(AREA_LABELS) as [Task['area'], string][]).map(([a, label]) => (
                    <button key={a} onClick={() => setNewArea(a)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newArea === a ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Notas</p>
              <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2}
                placeholder="Observações adicionais..."
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332] resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={addTask} className="flex-1 bg-[#1B4332] text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
              <button onClick={() => setShowAdd(false)} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
            </div>
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3" style={{ minWidth: `${visibleAreas.length * 200}px` }}>
              {visibleAreas.map(area => (
                <KanbanColumn
                  key={area}
                  area={area}
                  items={byArea[area] ?? []}
                  onToggle={toggle}
                  onRemove={remove}
                  onEdit={setEditingTask}
                  onDateChange={(id, d) => updateTask(id, { deadline: d || undefined })}
                  onDragStart={handleDragStart}
                  onDrop={handleDropOnArea}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <>
            {visibleAreas.map(area => {
              const items = pending.filter(t => t.area === area)
              if (items.length === 0) return null
              return (
                <section key={area}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {AREA_LABELS[area]} <span className="font-normal">({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map(t => (
                      <TaskCard key={t.id} t={t}
                        onToggle={() => toggle(t.id)}
                        onRemove={() => remove(t.id)}
                        onEdit={() => setEditingTask(t)}
                        onDateChange={d => updateTask(t.id, { deadline: d || undefined })}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
            {pending.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma tarefa pendente</p>}
          </>
        )}

        {/* Completed tasks */}
        {done.length > 0 && (
          <section>
            <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2">
              {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {done.length} concluída(s)
            </button>
            {showDone && (
              <div className="space-y-1.5">
                {done.map(t => (
                  <TaskCard key={t.id} t={t} faded
                    onToggle={() => toggle(t.id)}
                    onRemove={() => remove(t.id)}
                    onEdit={() => setEditingTask(t)}
                    onDateChange={d => updateTask(t.id, { deadline: d || undefined })}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Deleted history */}
        <div>
          <button onClick={() => setShowDeleted(d => !d)} className="flex items-center gap-2 text-xs text-gray-400 font-medium py-1">
            {showDeleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Histórico de excluídas ({deletedTasks.length})
          </button>
          {showDeleted && <DeletedHistory deleted={deletedTasks} onRestore={restoreTask} />}
        </div>

        {/* Edit modal */}
        {editingTask && (
          <EditModal task={editingTask} onSave={fields => updateTask(editingTask.id, fields)} onCancel={() => setEditingTask(null)} />
        )}
      </div>

      {/* Right panel: date filter */}
      <RightPanel
        startDate={startDate}
        endDate={endDate}
        onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }}
        highlightDates={highlightDates}
        defaultCollapsed={false}
      />
    </div>
  )
}
