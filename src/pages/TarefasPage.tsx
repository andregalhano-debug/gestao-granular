import { useState } from 'react'
import { CheckCircle2, Circle, Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useTasks } from '../hooks/useLocalData'
import type { Owner, Task } from '../types'

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  todos: 'bg-gray-100 text-gray-600',
}

const OWNER_LABELS: Record<Owner, string> = {
  A: 'André', E: 'Eduardo', G: 'Gabriel', todos: 'Todos'
}

const PRIORITY_COLORS = {
  alta: 'text-red-600 bg-red-50',
  media: 'text-yellow-600 bg-yellow-50',
  baixa: 'text-gray-500 bg-gray-50',
}

const AREA_LABELS = {
  produto: '⚙️ Produto',
  comercial: '💼 Comercial',
  juridico: '⚖️ Jurídico',
  financeiro: '💰 Financeiro',
  geral: '📌 Geral',
}

export function TarefasPage() {
  const [tasks, setTasks] = useTasks()
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [showDone, setShowDone] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newOwner, setNewOwner] = useState<Owner>('todos')
  const [newPriority, setNewPriority] = useState<Task['priority']>('media')
  const [newArea, setNewArea] = useState<Task['area']>('geral')

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id: string) => setTasks(prev => prev.filter(t => t.id !== id))

  const addTask = () => {
    if (!newTitle.trim()) return
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      owner: newOwner,
      done: false,
      priority: newPriority,
      area: newArea,
      created_at: new Date().toISOString()
    }])
    setNewTitle('')
    setNewPriority('media')
    setNewArea('geral')
    setShowAdd(false)
  }

  const filtered = tasks.filter(t => {
    if (!showDone && t.done) return false
    if (filterOwner !== 'all' && t.owner !== filterOwner && t.owner !== 'todos') return false
    return true
  })

  const pending = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  // Group pending by area
  const byArea = Object.keys(AREA_LABELS).reduce<Record<string, Task[]>>((acc, area) => {
    const items = pending.filter(t => t.area === area)
    if (items.length > 0) acc[area] = items
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tarefas</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={15} /> Nova
        </button>
      </div>

      {/* Owner filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'A', 'E', 'G'] as const).map(o => (
          <button
            key={o}
            onClick={() => setFilterOwner(o)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'
            }`}
          >
            {o === 'all' ? 'Todos' : OWNER_LABELS[o]}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#1B4332]/20 p-4 space-y-3">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Título da tarefa..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase">Responsável</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['A','E','G','todos'] as Owner[]).map(o => (
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

      {/* Tasks by area */}
      {Object.entries(byArea).map(([area, items]) => (
        <section key={area}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {AREA_LABELS[area as Task['area']]} <span className="font-normal">({items.length})</span>
          </h2>
          <div className="space-y-2">
            {items
              .sort((a,b) => (a.priority === 'alta' ? -1 : b.priority === 'alta' ? 1 : 0))
              .map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3">
                <button onClick={() => toggle(t.id)} className="mt-0.5 flex-shrink-0">
                  <Circle size={18} className="text-gray-300" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-snug">{t.title}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[t.owner]}`}>
                      {OWNER_LABELS[t.owner]}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="text-gray-200 hover:text-gray-400 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Done */}
      {done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2"
          >
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {done.length} concluída(s)
          </button>
          {showDone && (
            <div className="space-y-1.5 opacity-50">
              {done.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3">
                  <button onClick={() => toggle(t.id)}>
                    <CheckCircle2 size={18} className="text-[#1B4332]" />
                  </button>
                  <p className="text-sm text-gray-500 line-through">{t.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
