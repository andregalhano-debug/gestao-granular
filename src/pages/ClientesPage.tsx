import { useState } from 'react'
import { useClients } from '../hooks/useLocalData'
import { ChevronRight, TrendingUp, CheckCircle, User, X, Plus, Globe, Phone, Edit2, Trash2, ExternalLink, AtSign } from 'lucide-react'
import { parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns'
import type { Client, Owner } from '../types'
import { SearchBar } from '../components/SearchBar'
import { RightPanel } from '../components/RightPanel'

const STAGE_CONFIG = {
  prospecto:   { label: 'Prospecto',   color: 'bg-gray-100 text-gray-600',     icon: '🎯' },
  contato:     { label: 'Contato',     color: 'bg-blue-100 text-blue-700',     icon: '📞' },
  proposta:    { label: 'Proposta',    color: 'bg-yellow-100 text-yellow-700', icon: '📄' },
  negociacao:  { label: 'Negociação',  color: 'bg-orange-100 text-orange-700', icon: '🤝' },
  ativo:       { label: 'Ativo',       color: 'bg-green-100 text-green-700',   icon: '✅' },
  pausado:     { label: 'Pausado',     color: 'bg-red-100 text-red-700',       icon: '⏸️' },
}

const SEGMENT_LABELS: Record<Client['segment'], string> = {
  food: 'Food', market: 'Market', farma: 'Farma', outro: 'Outro',
}

const EMPTY_FORM: Omit<Client, 'id' | 'last_update'> = {
  name: '', stage: 'prospecto', owner: 'A', segment: 'food',
  notes: '', briefing: '', next_action: '', contact_name: '',
  phone: '', instagram: '', website: '', revenue_potential: '', tags: [],
}

function normalizeInstagram(val: string) {
  if (!val) return ''
  const clean = val.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
  return clean
}

function instagramUrl(handle: string) {
  return `https://instagram.com/${normalizeInstagram(handle)}`
}

interface FormModalProps {
  initial: Omit<Client, 'id' | 'last_update'>
  onSave: (data: Omit<Client, 'id' | 'last_update'>) => void
  onClose: () => void
  isEdit?: boolean
}

function ClientFormModal({ initial, onSave, onClose, isEdit }: FormModalProps) {
  const [form, setForm] = useState(initial)
  const [tagInput, setTagInput] = useState('')

  const set = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !(form.tags ?? []).includes(t)) {
      set('tags', [...(form.tags ?? []), t])
      setTagInput('')
    }
  }

  const removeTag = (t: string) => set('tags', (form.tags ?? []).filter(x => x !== t))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nome / Empresa *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: MartMinas, SAJ & Manish..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
            />
          </div>

          {/* Stage + Segment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 bg-white">
                {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
                  <option key={s} value={s}>{STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Segmento</label>
              <select value={form.segment} onChange={e => set('segment', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 bg-white">
                {(Object.keys(SEGMENT_LABELS) as Client['segment'][]).map(s => (
                  <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Responsável</label>
            <div className="flex gap-2">
              {(['A', 'E', 'G'] as Owner[]).map(o => (
                <button key={o} type="button" onClick={() => set('owner', o)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${form.owner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                  {o === 'A' ? 'André' : o === 'E' ? 'Eduardo' : 'Gabriel'}
                </button>
              ))}
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nome do contato</label>
              <input
                value={form.contact_name ?? ''}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="Ex: Rodrigo, Bia..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp / Telefone</label>
              <input
                value={form.phone ?? ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="(31) 9 9999-9999"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
              />
            </div>
          </div>

          {/* Instagram + Site */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Instagram</label>
              <input
                value={form.instagram ?? ''}
                onChange={e => set('instagram', e.target.value)}
                placeholder="@usuario ou URL"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Site</label>
              <input
                value={form.website ?? ''}
                onChange={e => set('website', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
              />
            </div>
          </div>

          {/* Potencial */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Potencial de receita</label>
            <input
              value={form.revenue_potential ?? ''}
              onChange={e => set('revenue_potential', e.target.value)}
              placeholder="Ex: R$18.200/mês"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
            />
          </div>

          {/* Briefing */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Briefing</label>
            <textarea
              value={form.briefing ?? ''}
              onChange={e => set('briefing', e.target.value)}
              placeholder="Contexto do cliente, histórico, perfil, dores, oportunidades..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none"
            />
          </div>

          {/* Notas rápidas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Observações rápidas, últimos contatos..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none"
            />
          </div>

          {/* Próxima ação */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Próxima ação</label>
            <input
              value={form.next_action ?? ''}
              onChange={e => set('next_action', e.target.value)}
              placeholder="Ex: Enviar proposta até sexta"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Adicionar tag..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50"
              />
              <button type="button" onClick={addTag}
                className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors">
                +
              </button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(form.tags ?? []).map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-[#1B4332]/10 text-[#1B4332] px-2 py-0.5 rounded-full font-medium">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-[#1B4332]/50 hover:text-[#1B4332]"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-bold hover:bg-[#1B4332]/90 transition-colors">
              {isEdit ? 'Salvar alterações' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ClientesPage() {
  const [clients, setClients] = useClients()
  const [selected, setSelected] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<Client['stage'] | 'all'>('all')
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filterByDate = (dateStr: string) => {
    if (!startDate) return true
    const d = parseISO(dateStr)
    if (endDate) return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })
    return format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
  }

  const filtered = clients.filter(c => {
    if (!filterByDate(c.last_update)) return false
    if (filterStage !== 'all' && c.stage !== filterStage) return false
    if (filterOwner !== 'all' && c.owner !== filterOwner) return false
    if (search) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) &&
          !c.notes.toLowerCase().includes(q) &&
          !(c.next_action?.toLowerCase().includes(q)) &&
          !(c.briefing?.toLowerCase().includes(q)) &&
          !(c.contact_name?.toLowerCase().includes(q)) &&
          !(c.tags?.some(t => t.toLowerCase().includes(q)))) return false
    }
    return true
  })

  const updateStage = (id: string, stage: Client['stage']) =>
    setClients(prev => prev.map(c => c.id === id ? { ...c, stage, last_update: new Date().toISOString() } : c))

  const handleCreate = (data: Omit<Client, 'id' | 'last_update'>) => {
    const newClient: Client = {
      ...data,
      id: Date.now().toString(),
      last_update: new Date().toISOString(),
    }
    setClients(prev => [newClient, ...prev])
    setShowForm(false)
    setSelected(newClient.id)
  }

  const handleEdit = (data: Omit<Client, 'id' | 'last_update'>) => {
    if (!editingClient) return
    setClients(prev => prev.map(c => c.id === editingClient.id
      ? { ...c, ...data, last_update: new Date().toISOString() }
      : c
    ))
    setEditingClient(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Remover este cliente?')) return
    setClients(prev => prev.filter(c => c.id !== id))
    setSelected(null)
  }

  const selectedClient = clients.find(c => c.id === selected)
  const highlightDates = clients.map(c => parseISO(c.last_update))

  const active = clients.filter(c => c.stage === 'ativo').length
  const pipeline = clients.filter(c => ['contato','proposta','negociacao'].includes(c.stage)).length

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
            <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> {active} ativos</span>
              <span className="flex items-center gap-1"><TrendingUp size={12} className="text-orange-500" /> {pipeline} pipeline</span>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#1B4332]/90 transition-colors">
            <Plus size={15} /> Novo cliente
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente, notas, tags..." />
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterStage('all')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterStage === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              Todos
            </button>
            {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
              <button key={s} onClick={() => setFilterStage(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterStage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
              </button>
            ))}
            <span className="text-gray-300 self-center">·</span>
            {(['all','A','E','G'] as const).map(o => (
              <button key={o} onClick={() => setFilterOwner(o)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
                {o === 'all' ? 'Responsável' : o}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)}
              className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-[#1B4332]/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STAGE_CONFIG[c.stage].color}`}>
                    {STAGE_CONFIG[c.stage].label}
                  </span>
                  {(c.tags ?? []).slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1B4332]/8 text-[#1B4332]/70 font-medium hidden sm:inline">{t}</span>
                  ))}
                </div>
                {c.next_action && <p className="text-xs text-gray-500 truncate">→ {c.next_action}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.revenue_potential && <span className="text-[10px] text-green-600 font-medium hidden sm:block">{c.revenue_potential}</span>}
                <span className="text-[10px] text-gray-400 font-medium">{c.owner}</span>
                <ChevronRight size={14} className={`text-gray-300 transition-transform ${selected === c.id ? 'rotate-90' : ''}`} />
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente encontrado</p>}
        </div>

        {/* Detail panel */}
        {selectedClient && (
          <div className="bg-white rounded-2xl border border-[#1B4332]/15 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-base">{selectedClient.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_CONFIG[selectedClient.stage].color}`}>
                    {STAGE_CONFIG[selectedClient.stage].label}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{SEGMENT_LABELS[selectedClient.segment]}</span>
                </div>
                {selectedClient.contact_name && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <User size={12} /> {selectedClient.contact_name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setEditingClient(selectedClient)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/5 rounded-lg transition-colors" title="Editar">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(selectedClient.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Links de contato */}
            {(selectedClient.phone || selectedClient.instagram || selectedClient.website) && (
              <div className="flex flex-wrap gap-2">
                {selectedClient.phone && (
                  <a href={`https://wa.me/${selectedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium">
                    <Phone size={12} /> {selectedClient.phone}
                  </a>
                )}
                {selectedClient.instagram && (
                  <a href={instagramUrl(selectedClient.instagram)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors font-medium">
                    <AtSign size={12} /> @{normalizeInstagram(selectedClient.instagram)}
                  </a>
                )}
                {selectedClient.website && (
                  <a href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
                    <Globe size={12} /> <ExternalLink size={10} /> Site
                  </a>
                )}
              </div>
            )}

            {/* Potencial */}
            {selectedClient.revenue_potential && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-semibold">{selectedClient.revenue_potential}</span>
              </div>
            )}

            {/* Briefing */}
            {selectedClient.briefing && (
              <div className="bg-[#1B4332]/4 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#1B4332] mb-1.5 uppercase tracking-wide">Briefing</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedClient.briefing}</p>
              </div>
            )}

            {/* Notas */}
            {selectedClient.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Notas</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedClient.notes}</p>
              </div>
            )}

            {/* Próxima ação */}
            {selectedClient.next_action && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">Próxima ação</p>
                <p className="text-sm text-gray-800">{selectedClient.next_action}</p>
              </div>
            )}

            {/* Tags */}
            {(selectedClient.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(selectedClient.tags ?? []).map(t => (
                  <span key={t} className="text-xs bg-[#1B4332]/10 text-[#1B4332] px-2.5 py-0.5 rounded-full font-medium">{t}</span>
                ))}
              </div>
            )}

            {/* Stage */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Alterar stage</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
                  <button key={s} onClick={() => updateStage(selectedClient.id, s)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${selectedClient.stage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                    {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-gray-300">Atualizado em {format(parseISO(selectedClient.last_update), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        )}
      </div>

      <RightPanel startDate={startDate} endDate={endDate} onDateChange={(s,e) => { setStartDate(s); setEndDate(e) }} highlightDates={highlightDates} />

      {/* Modals */}
      {showForm && (
        <ClientFormModal initial={EMPTY_FORM} onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
      {editingClient && (
        <ClientFormModal
          isEdit
          initial={{
            name: editingClient.name,
            stage: editingClient.stage,
            owner: editingClient.owner,
            segment: editingClient.segment,
            notes: editingClient.notes,
            briefing: editingClient.briefing ?? '',
            next_action: editingClient.next_action ?? '',
            contact_name: editingClient.contact_name ?? '',
            phone: editingClient.phone ?? '',
            instagram: editingClient.instagram ?? '',
            website: editingClient.website ?? '',
            revenue_potential: editingClient.revenue_potential ?? '',
            tags: editingClient.tags ?? [],
          }}
          onSave={handleEdit}
          onClose={() => setEditingClient(null)}
        />
      )}
    </div>
  )
}
