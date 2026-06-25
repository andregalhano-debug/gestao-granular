import { useState } from 'react'
import { useClients, useDeletedClients, useChangeLog, appendLog } from '../hooks/useLocalData'
import { useAuth } from '../hooks/useAuth'
import {
  TrendingUp, CheckCircle, X, Plus, Globe, Phone, Edit2, Trash2,
  ExternalLink, AtSign, ChevronDown, ChevronUp, RotateCcw, User,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, Owner } from '../types'
import { SearchBar } from '../components/SearchBar'

const STAGE_CONFIG = {
  prospecto:  { label: 'Prospecto',  color: 'bg-gray-100 text-gray-600',     icon: '🎯' },
  contato:    { label: 'Contato',    color: 'bg-blue-100 text-blue-700',     icon: '📞' },
  proposta:   { label: 'Proposta',   color: 'bg-yellow-100 text-yellow-700', icon: '📄' },
  negociacao: { label: 'Negociação', color: 'bg-orange-100 text-orange-700', icon: '🤝' },
  ativo:      { label: 'Ativo',      color: 'bg-green-100 text-green-700',   icon: '✅' },
  pausado:    { label: 'Pausado',    color: 'bg-red-100 text-red-700',       icon: '⏸️' },
}

const REL_STATUS_CONFIG = {
  ativo:       { label: 'Ativo',       color: 'bg-green-100 text-green-700' },
  perdido:     { label: 'Perdido',     color: 'bg-red-100 text-red-700' },
  recuperado:  { label: 'Recuperado',  color: 'bg-green-100 text-green-700' },
  churn:       { label: 'Churn',       color: 'bg-gray-200 text-gray-600' },
}

const LOYALTY_CONFIG = {
  novo:       { label: 'Novo',       color: 'bg-blue-50 text-blue-600' },
  recorrente: { label: 'Recorrente', color: 'bg-green-50 text-green-700' },
  risco:      { label: 'Risco',      color: 'bg-red-50 text-red-600' },
  campea:     { label: 'Campeã',     color: 'bg-purple-50 text-purple-700' },
}

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

const SEGMENT_LABELS: Record<Client['segment'], string> = {
  food: 'Food', market: 'Market', farma: 'Farma', outro: 'Outro',
}

const EMPTY_FORM: Omit<Client, 'id' | 'last_update'> = {
  name: '', stage: 'prospecto', owner: 'A', segment: 'food',
  notes: '', briefing: '', next_action: '', contact_name: '',
  phone: '', instagram: '', website: '', revenue_potential: '',
  monthly_revenue: undefined, contract_start: '', contract_end: '',
  loyalty: undefined, relationship_status: undefined, tags: [],
}

function normalizeInstagram(val: string) {
  if (!val) return ''
  return val.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
}

function instagramUrl(handle: string) {
  return `https://instagram.com/${normalizeInstagram(handle)}`
}

// ─────────────────────────────────────────────
// Form Modal
// ─────────────────────────────────────────────
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

          {/* Relationship status + Loyalty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status relacionamento</label>
              <select value={form.relationship_status ?? ''} onChange={e => set('relationship_status', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 bg-white">
                <option value="">—</option>
                {(Object.keys(REL_STATUS_CONFIG) as NonNullable<Client['relationship_status']>[]).map(s => (
                  <option key={s} value={s}>{REL_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fidelidade</label>
              <select value={form.loyalty ?? ''} onChange={e => set('loyalty', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 bg-white">
                <option value="">—</option>
                {(Object.keys(LOYALTY_CONFIG) as NonNullable<Client['loyalty']>[]).map(l => (
                  <option key={l} value={l}>{LOYALTY_CONFIG[l].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Responsável</label>
            <div className="flex gap-2">
              {(['A', 'E', 'G', 'D'] as Owner[]).map(o => (
                <button key={o} type="button" onClick={() => set('owner', o)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${form.owner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                  {OWNER_NAMES[o]}
                </button>
              ))}
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nome do contato</label>
              <input value={form.contact_name ?? ''} onChange={e => set('contact_name', e.target.value)}
                placeholder="Ex: Rodrigo, Bia..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp / Telefone</label>
              <input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)}
                placeholder="(31) 9 9999-9999" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
          </div>

          {/* Instagram + Site */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Instagram</label>
              <input value={form.instagram ?? ''} onChange={e => set('instagram', e.target.value)}
                placeholder="@usuario ou URL" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Site</label>
              <input value={form.website ?? ''} onChange={e => set('website', e.target.value)}
                placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
          </div>

          {/* Potencial + MRR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Potencial de receita</label>
              <input value={form.revenue_potential ?? ''} onChange={e => set('revenue_potential', e.target.value)}
                placeholder="Ex: R$18.200/mês" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Receita mensal (R$)</label>
              <input type="number" min={0} value={form.monthly_revenue ?? ''} onChange={e => set('monthly_revenue', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
          </div>

          {/* Contract dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Início do contrato</label>
              <input type="date" value={form.contract_start ?? ''} onChange={e => set('contract_start', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fim do contrato</label>
              <input type="date" value={form.contract_end ?? ''} onChange={e => set('contract_end', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
            </div>
          </div>

          {/* Briefing */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Briefing</label>
            <textarea value={form.briefing ?? ''} onChange={e => set('briefing', e.target.value)}
              placeholder="Contexto do cliente, histórico, perfil, dores, oportunidades..."
              rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none" />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Observações rápidas, últimos contatos..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50 resize-none" />
          </div>

          {/* Próxima ação */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Próxima ação</label>
            <input value={form.next_action ?? ''} onChange={e => set('next_action', e.target.value)}
              placeholder="Ex: Enviar proposta até sexta" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Adicionar tag..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]/50" />
              <button type="button" onClick={addTag} className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors">+</button>
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

// ─────────────────────────────────────────────
// Inline expanded client detail
// ─────────────────────────────────────────────
interface ClientDetailProps {
  client: Client
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onStageChange: (stage: Client['stage']) => void
  onRelStatusChange: (status: Client['relationship_status']) => void
  onOwnerChange: (owner: Owner) => void
}

function ClientDetail({ client: c, onEdit, onDelete, onClose, onStageChange, onRelStatusChange, onOwnerChange }: ClientDetailProps) {
  return (
    <div className="bg-white rounded-b-2xl border border-t-0 border-[#1B4332]/15 px-4 pb-4 pt-3 space-y-3">
      {/* Contact links */}
      {(c.phone || c.instagram || c.website) && (
        <div className="flex flex-wrap gap-2">
          {c.phone && (
            <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium">
              <Phone size={12} /> {c.phone}
            </a>
          )}
          {c.instagram && (
            <a href={instagramUrl(c.instagram)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors font-medium">
              <AtSign size={12} /> @{normalizeInstagram(c.instagram)}
            </a>
          )}
          {c.website && (
            <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
              <Globe size={12} /> <ExternalLink size={10} /> Site
            </a>
          )}
        </div>
      )}

      {/* Contact name */}
      {c.contact_name && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <User size={12} /> {c.contact_name}
        </div>
      )}

      {/* Revenue */}
      {(c.revenue_potential || c.monthly_revenue) && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {c.revenue_potential && (
            <span className="flex items-center gap-1 text-green-700 font-semibold">
              <TrendingUp size={13} className="text-green-600" /> {c.revenue_potential}
            </span>
          )}
          {c.monthly_revenue != null && (
            <span className="text-xs text-gray-500">MRR: <strong className="text-gray-700">R$ {c.monthly_revenue.toLocaleString('pt-BR')}</strong></span>
          )}
        </div>
      )}

      {/* Contract */}
      {(c.contract_start || c.contract_end) && (
        <div className="text-xs text-gray-500 flex gap-3">
          {c.contract_start && <span>Início: <strong>{format(parseISO(c.contract_start), 'dd/MM/yyyy')}</strong></span>}
          {c.contract_end && <span>Fim: <strong>{format(parseISO(c.contract_end), 'dd/MM/yyyy')}</strong></span>}
        </div>
      )}

      {/* Briefing */}
      {c.briefing && (
        <div className="bg-[#1B4332]/4 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-[#1B4332] mb-1 uppercase tracking-wide">Briefing</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.briefing}</p>
        </div>
      )}

      {/* Notes */}
      {c.notes && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 mb-1">Notas</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.notes}</p>
        </div>
      )}

      {/* Next action */}
      {c.next_action && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Próxima ação</p>
          <p className="text-sm text-gray-800">{c.next_action}</p>
        </div>
      )}

      {/* Tags */}
      {(c.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(c.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-[#1B4332]/10 text-[#1B4332] px-2.5 py-0.5 rounded-full font-medium">{t}</span>
          ))}
        </div>
      )}

      {/* Stage changer */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Alterar stage</p>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
            <button key={s} onClick={() => onStageChange(s)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-colors ${c.stage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
              {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Relationship status */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Status relacionamento</p>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => onRelStatusChange(undefined)}
            className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-colors ${!c.relationship_status ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
            —
          </button>
          {(Object.keys(REL_STATUS_CONFIG) as NonNullable<Client['relationship_status']>[]).map(s => (
            <button key={s} onClick={() => onRelStatusChange(s)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-colors ${c.relationship_status === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
              {REL_STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Owner selector */}
      <div>
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Responsável</p>
        <div className="flex gap-1.5 flex-wrap">
          {(['A','E','G','D'] as Owner[]).map(o => (
            <button key={o} onClick={() => onOwnerChange(o)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-colors ${c.owner === o ? OWNER_COLORS[o] + ' border-transparent' : 'border-gray-200 text-gray-600'}`}>
              {OWNER_NAMES[o]}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-gray-300">
          Atualizado {format(parseISO(c.last_update), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/5 rounded-lg transition-colors" title="Editar">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
type RelFilter = Client['relationship_status'] | 'all'

export function ClientesPage() {
  const { user } = useAuth()
  const [clients, setClients] = useClients()
  const [deletedClients, setDeletedClients] = useDeletedClients()
  const [log, setLog] = useChangeLog()

  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<Client['stage'] | 'all'>('all')
  const [filterRel, setFilterRel] = useState<RelFilter>('all')
  const [filterOwner, setFilterOwner] = useState<Owner | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const userName = user?.name ?? 'Sistema'

  const filtered = clients.filter(c => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false
    if (filterOwner !== 'all' && c.owner !== filterOwner) return false
    if (filterRel !== 'all') {
      if (!c.relationship_status || c.relationship_status !== filterRel) return false
    }
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

  const activeCount = clients.filter(c => c.stage === 'ativo').length
  const pipelineCount = clients.filter(c => ['contato','proposta','negociacao'].includes(c.stage)).length

  const updateClient = (id: string, patch: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch, last_update: new Date().toISOString() } : c))
  }

  const handleCreate = (data: Omit<Client, 'id' | 'last_update'>) => {
    const newClient: Client = { ...data, id: Date.now().toString(), last_update: new Date().toISOString() }
    setClients(prev => [newClient, ...prev])
    appendLog(log, setLog, userName, 'create', 'Cliente', `Criou cliente "${newClient.name}"`)
    setShowForm(false)
    setExpanded(newClient.id)
  }

  const handleEdit = (data: Omit<Client, 'id' | 'last_update'>) => {
    if (!editingClient) return
    setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...data, last_update: new Date().toISOString() } : c))
    appendLog(log, setLog, userName, 'update', 'Cliente', `Editou cliente "${editingClient.name}"`)
    setEditingClient(null)
  }

  const handleDelete = (id: string) => {
    const target = clients.find(c => c.id === id)
    if (!target) return
    if (!confirm(`Remover "${target.name}"?`)) return
    const withTimestamp: Client = { ...target, deleted_at: new Date().toISOString() }
    setDeletedClients(prev => [withTimestamp, ...prev])
    setClients(prev => prev.filter(c => c.id !== id))
    appendLog(log, setLog, userName, 'delete', 'Cliente', `Removeu cliente "${target.name}"`)
    if (expanded === id) setExpanded(null)
  }

  const handleRestore = (id: string) => {
    const target = deletedClients.find(c => c.id === id)
    if (!target) return
    const { deleted_at, ...restored } = target
    setClients(prev => [{ ...restored, last_update: new Date().toISOString() }, ...prev])
    setDeletedClients(prev => prev.filter(c => c.id !== id))
    appendLog(log, setLog, userName, 'update', 'Cliente', `Restaurou cliente "${target.name}"`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
          <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> {activeCount} ativos</span>
            <span className="flex items-center gap-1"><TrendingUp size={12} className="text-orange-500" /> {pipelineCount} pipeline</span>
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
            Todos stages
          </button>
          {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
            <button key={s} onClick={() => setFilterStage(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterStage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterRel('all')}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterRel === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
            Todos status
          </button>
          {(Object.keys(REL_STATUS_CONFIG) as NonNullable<Client['relationship_status']>[]).map(s => (
            <button key={s} onClick={() => setFilterRel(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterRel === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              {REL_STATUS_CONFIG[s].label}
            </button>
          ))}
          <span className="text-gray-300 self-center">·</span>
          {(['all','A','E','G','D'] as const).map(o => (
            <button key={o} onClick={() => setFilterOwner(o)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${filterOwner === o ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}>
              {o === 'all' ? 'Responsável' : OWNER_NAMES[o as Owner]}
            </button>
          ))}
        </div>
      </div>

      {/* Client list with inline accordion */}
      <div className="space-y-1.5">
        {filtered.map(c => (
          <div key={c.id}>
            {/* Row */}
            <button
              onClick={() => setExpanded(c.id === expanded ? null : c.id)}
              className={`w-full bg-white border px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-[#1B4332]/20 transition-colors
                ${expanded === c.id ? 'rounded-t-xl border-b-0 border-[#1B4332]/20' : 'rounded-xl border-gray-100'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STAGE_CONFIG[c.stage].color}`}>
                    {STAGE_CONFIG[c.stage].label}
                  </span>
                  {c.relationship_status && (
                    <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${REL_STATUS_CONFIG[c.relationship_status].color}`}>
                      {REL_STATUS_CONFIG[c.relationship_status].label}
                    </span>
                  )}
                  {c.loyalty && (
                    <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full hidden sm:inline ${LOYALTY_CONFIG[c.loyalty].color}`}>
                      {LOYALTY_CONFIG[c.loyalty].label}
                    </span>
                  )}
                  {(c.tags ?? []).slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1B4332]/8 text-[#1B4332]/70 font-medium hidden sm:inline">{t}</span>
                  ))}
                </div>
                {c.next_action && <p className="text-xs text-gray-500 truncate">→ {c.next_action}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.monthly_revenue != null && (
                  <span className="text-[10px] text-green-600 font-medium hidden sm:block">R$ {c.monthly_revenue.toLocaleString('pt-BR')}</span>
                )}
                {c.revenue_potential && !c.monthly_revenue && (
                  <span className="text-[10px] text-green-600 font-medium hidden sm:block">{c.revenue_potential}</span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[c.owner]}`}>
                  {c.owner}
                </span>
                {expanded === c.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-300" />}
              </div>
            </button>

            {/* Inline detail */}
            {expanded === c.id && (
              <ClientDetail
                client={c}
                onEdit={() => setEditingClient(c)}
                onDelete={() => handleDelete(c.id)}
                onClose={() => setExpanded(null)}
                onStageChange={stage => updateClient(c.id, { stage })}
                onRelStatusChange={relationship_status => updateClient(c.id, { relationship_status })}
                onOwnerChange={owner => updateClient(c.id, { owner })}
              />
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente encontrado</p>
        )}
      </div>

      {/* Histórico (lixeira) */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="flex items-center gap-2">
            <RotateCcw size={14} className="text-gray-400" />
            Histórico de clientes removidos ({deletedClients.length})
          </span>
          {showHistory ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {showHistory && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {deletedClients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum cliente removido</p>
            )}
            {deletedClients.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3 opacity-60 hover:opacity-80 transition-opacity">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    Removido em {c.deleted_at ? format(parseISO(c.deleted_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </p>
                </div>
                <button onClick={() => handleRestore(c.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors flex-shrink-0">
                  <RotateCcw size={11} /> Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
            monthly_revenue: editingClient.monthly_revenue,
            contract_start: editingClient.contract_start ?? '',
            contract_end: editingClient.contract_end ?? '',
            loyalty: editingClient.loyalty,
            relationship_status: editingClient.relationship_status,
            tags: editingClient.tags ?? [],
          }}
          onSave={handleEdit}
          onClose={() => setEditingClient(null)}
        />
      )}
    </div>
  )
}
