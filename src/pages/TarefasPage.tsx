import { useState } from 'react'
import { CheckCircle2, Circle, Plus, ChevronDown, ChevronUp, X, Edit2, Check, RotateCcw, Trash2, Kanban, List } from 'lucide-react'
import { useTasks, useDeletedTasks } from '../hooks/useLocalData'
import { parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns'
import type { Owner, Task } from '../types'
import { SearchBar } from '../components/SearchBar'
import { RightPanel } from '../components/RightPanel'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700', E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700', D: 'bg-pink-100 text-pink-700',
  todos: 'bg-gray-100 text-gray-600',
}
const OWNER_LABELS: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', D: 'Daniela', todos: 'Todos'
}
const PRIORITY_COLORS = {
  alta: 'text-red-600 bg-red-50', media: 'text-yellow-600 bg-yellow-50', baixa: 'text-gray-500 bg-gray-50',
}
const AREA_LABELS: Record<Task['area'], string> = {
  produto: '⚙️ Produto', comercial: '💼 Comercial', juridico: '⚖️ Jurídico',
  financeiro: '💰 Financeiro', geral: '📌 Geral',
}

// ── Task Card ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  t: Task
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  faded?: boolean
}

function TaskCard({ t, onToggle, onRemove, onEdit, faded }: TaskCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 group hover:shadow-sm transition-shadow ${faded ? 'opacity-50' : ''}`}>
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {t.done ? <CheckCircle2 size={18} className="text-[#1B4332]" /> : <Circle size={18} className="text-gray-300" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${t.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
        {t.notes && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.notes}</p>}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[t.owner]}`}>{OWNER_LABELS[t.owner]}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
          {t.deadline && <span className="text-[10px] text-gray-400">{format(parseISO(t.deadline), 'dd/MM')}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onEdit} className="text-gray-400 hover:text-[#1B4332] p-0.5" title="Editar"><Edit2 size={13} /></button>
        <button onClick={onRemove} className="text-gray-200 hover:text-red-400 p-0.5" title="Excluir"><X size={13} /></button>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  task: Task
  onSave: (fields: Partial<Task>) => void
  onCancel: () => void
}

function EditModal({ task, onSave, onCancel }: EditModalProps) {
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
function DeletedTasksHistory({ deleted, onRestore }: { deleted: Task[]; onRestore: (t: Task) => void }) {
  const [open, setOpen] = useState(false)
  if (deleted.length === 0) return null

  const monthOld = deleted.filter(t => {
    if (!t.deleted_at) return false
    return Date.now() - new Date(t.deleted_at).getTime() > 30 * 24 * 60 * 60 * 1000
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <Trash2 size={12} /> {deleted.length} excluída(s)
          {monthOld.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{monthOld.length} com +30 dias</span>
          )}
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {monthOld.length > 0 && (
            <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              💡 {monthOld.length} tarefa(s) com mais de 30 dias excluídas. Considere limpá-las.
            </p>
          )}
          {deleted.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 line-through truncate">{t.title}</p>
                <div className="flex gap-1 mt-0.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold ${OWNER_COLORS[t.owner]}`}>{t.owner}</span>
                  <span className="text-[9px] text-gray-300">{t.deleted_at ? format(parseISO(t.deleted_at), 'dd/MM/yyyy') : ''}</span>
                </div>
              </div>
              <button onClick={() => onRestore(t)} className="text-[10px] text-[#1B4332] font-medium flex items-center gap-1 hover:opacity-80">
                <RotateCcw size={10} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main TarefasPage ──────────────────────────────────────────────────────────
export function TarefasPage() {
  const [tasks, setTasks] = useTasks()
  const [deletedTasks, setDeletedTasks] = useDeletedTasks()
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [filterArea, setFilterArea] = useState<Task['area'] | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all')
  const [showDone, setShowDone] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState<Owner>('todos')
  const [newPriority, setNewPriority] = useState<Task['priority']>('media')
  const [newArea, setNewArea] = useState<Task['area']>('geral')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const filterByDate = (dateStr: string) => {
    if (!startDate) return true
    const d = parseISO(dateStr)
    if (endDate) return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })
    return format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
  }

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const remove = (id: string) => {
    const t = tasks.find(x => x.id === id)
    if (t) setDeletedTasks(prev => [...prev, { ...t, deleted_at: new Date().toISOString() }])
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const restoreTask = (t: Task) => {
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
      done: false, priority: newPriority, area: newArea, created_at: new Date().toISOString()
    }])
    setNewTitle(''); setNewPriority('media'); setNewArea('geral'); setShowAdd(false)
  }

  const filtered = tasks.filter(t => {
    if (!showDone && t.done) return false
    if (!filterByDate(t.created_at)) return false
    if (filterOwner !== 'all' && t.owner !== filterOwner && t.owner !== 'todos') return false
    if (filterArea !== 'all' && t.area !== filterArea) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pending = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  const byArea = (Object.keys(AREA_LABELS) as Task['area'][]).reduce<Record<string, Task[]>>((acc, area) => {
    const items = pending.filter(t => t.area === area)
    if (items.length > 0) acc[area] = items
    return acc
  }, {})

  const highlightDates = tasks.map(t => parseISO(t.created_at))

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-900">Tarefas</h2>
          <div className="flex items-center gap-2">
            {/* List/Kanban toggle */}
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
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-[#1B4332]/30'}`}>
                {o === 'all' ? 'Todos' : OWNER_LABELS[o]}
              </button>
            ))}
            <span className="text-gray-300 self-center">·</span>
            {(['all', ...Object.keys(AREA_LABELS)] as (Task['area'] | 'all')[]).map(a => (
              <button key={a} onClick={() => setFilterArea(a)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterArea === a ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-[#1B4332]/30'}`}>
                {a === 'all' ? 'Todas áreas' : AREA_LABELS[a as Task['area']]}
              </button>
            ))}
            <span className="text-gray-300 self-center">·</span>
            {(['all','alta','media','baixa'] as (Task['priority'] | 'all')[]).map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterPriority === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-[#1B4332]/30'}`}>
                {p === 'all' ? 'Prioridade' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 space-y-3">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Título da tarefa..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Responsável</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['A','E','G','D','todos'] as Owner[]).map(o => (
                    <button key={o} onClick={() => setNewOwner(o)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                      {o === 'todos' ? 'Todos' : o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Prioridade</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['alta','media','baixa'] as Task['priority'][]).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newPriority === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Área</p>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(AREA_LABELS) as [Task['area'], string][]).map(([a, label]) => (
                  <button key={a} onClick={() => setNewArea(a)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${newArea === a ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addTask} className="flex-1 bg-[#1B4332] text-white rounded-lg py-2 text-sm font-medium">Salvar</button>
              <button onClick={() => setShowAdd(false)} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <>
            {Object.entries(byArea).map(([area, items]) => (
              <section key={area}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {AREA_LABELS[area as Task['area']]} <span className="font-normal">({items.length})</span>
                </h3>
                <div className="space-y-2">
                  {items.sort((a,b) => a.priority === 'alta' ? -1 : b.priority === 'alta' ? 1 : 0).map(t => (
                    <TaskCard key={t.id} t={t}
                      onToggle={() => toggle(t.id)}
                      onRemove={() => remove(t.id)}
                      onEdit={() => setEditingTask(t)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {pending.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma tarefa{search ? ' encontrada' : ' pendente'}</p>
            )}
          </>
        )}

        {/* ── Kanban view (by area) ── */}
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {(Object.keys(AREA_LABELS) as Task['area'][]).map(area => {
                const items = pending.filter(t => t.area === area)
                return (
                  <div key={area} className="w-56 flex-shrink-0">
                    <div className="bg-[#1B4332]/10 rounded-t-xl px-3 py-2">
                      <p className="text-xs font-bold text-[#1B4332]">{AREA_LABELS[area]}</p>
                      <p className="text-[10px] text-[#1B4332]/60">{items.length} tarefa(s)</p>
                    </div>
                    <div className="bg-gray-50 rounded-b-xl p-2 space-y-2 min-h-[120px]">
                      {items.sort((a,b) => a.priority === 'alta' ? -1 : b.priority === 'alta' ? 1 : 0).map(t => (
                        <TaskCard key={t.id} t={t}
                          onToggle={() => toggle(t.id)}
                          onRemove={() => remove(t.id)}
                          onEdit={() => setEditingTask(t)}
                        />
                      ))}
                      {items.length === 0 && <p className="text-[10px] text-gray-300 text-center pt-4">—</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
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
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Deleted tasks history */}
        <div>
          <button onClick={() => setShowDeleted(d => !d)} className="flex items-center gap-2 text-xs text-gray-400 font-medium py-1">
            {showDeleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Histórico de excluídas ({deletedTasks.length})
          </button>
          {showDeleted && <DeletedTasksHistory deleted={deletedTasks} onRestore={restoreTask} />}
        </div>
      </div>

      <RightPanel startDate={startDate} endDate={endDate} onDateChange={(s,e) => { setStartDate(s); setEndDate(e) }} highlightDates={highlightDates} />

      {/* Edit modal */}
      {editingTask && (
        <EditModal task={editingTask} onSave={fields => updateTask(editingTask.id, fields)} onCancel={() => setEditingTask(null)} />
      )}
    </div>
  )
}
