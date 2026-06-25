import { useState } from 'react'
import { useClients } from '../hooks/useLocalData'
import {
  Users, DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Copy, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, Owner } from '../types'

const STAGE_CONFIG = {
  prospecto:  { label: 'Prospecto',  color: 'bg-gray-100 text-gray-600',     order: 0 },
  contato:    { label: 'Contato',    color: 'bg-blue-100 text-blue-700',     order: 1 },
  proposta:   { label: 'Proposta',   color: 'bg-yellow-100 text-yellow-700', order: 2 },
  negociacao: { label: 'Negociação', color: 'bg-orange-100 text-orange-700', order: 3 },
  ativo:      { label: 'Ativo',      color: 'bg-green-100 text-green-700',   order: 4 },
  pausado:    { label: 'Pausado',    color: 'bg-red-100 text-red-700',       order: 5 },
}

const OWNER_COLORS: Record<Owner, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  D: 'bg-pink-100 text-pink-700',
  todos: 'bg-gray-100 text-gray-600',
}

const LOYALTY_CONFIG = {
  novo:       { label: 'Novo',       color: 'bg-blue-50 text-blue-600' },
  recorrente: { label: 'Recorrente', color: 'bg-green-50 text-green-700' },
  risco:      { label: 'Risco',      color: 'bg-red-50 text-red-600' },
  campea:     { label: 'Campeã',     color: 'bg-purple-50 text-purple-700' },
}

const SEGMENT_COLORS: Record<Client['segment'], string> = {
  food:   'bg-orange-100 text-orange-700',
  market: 'bg-blue-100 text-blue-700',
  farma:  'bg-green-100 text-green-700',
  outro:  'bg-gray-100 text-gray-600',
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
interface KPICardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color?: string
}
function KPICard({ label, value, sub, icon, color = 'bg-[#1B4332]/10' }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Section Wrapper
// ─────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors">
        {title}
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export function DashboardPage() {
  const [clients] = useClients()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeClients = clients.filter(c => c.stage === 'ativo')
  const pipelineClients = clients.filter(c => ['prospecto','contato','proposta','negociacao'].includes(c.stage))
  const mrr = activeClients.reduce((s, c) => s + (c.monthly_revenue ?? 0), 0)
  const pipelineRevenue = pipelineClients.reduce((s, c) => s + (c.monthly_revenue ?? 0), 0)
  const churnCount = clients.filter(c => c.relationship_status === 'churn').length
  const churnRate = clients.length > 0 ? Math.round((churnCount / clients.length) * 100) : 0

  // Receita por cliente sorted
  const byRevenue = [...clients]
    .filter(c => (c.monthly_revenue ?? 0) > 0)
    .sort((a, b) => (b.monthly_revenue ?? 0) - (a.monthly_revenue ?? 0))
  const maxRevenue = byRevenue[0]?.monthly_revenue ?? 1

  // Stages kanban
  const stages = Object.keys(STAGE_CONFIG) as Client['stage'][]

  // Contratos
  const withContracts = clients.filter(c => c.contract_end)
  const today = new Date()

  // Clusters by segment
  const segments = ['food', 'market', 'farma', 'outro'] as Client['segment'][]
  const clusterData = segments.map(seg => {
    const cs = clients.filter(c => c.segment === seg)
    return {
      seg,
      count: cs.length,
      revenue: cs.reduce((s, c) => s + (c.monthly_revenue ?? 0), 0),
    }
  }).filter(d => d.count > 0)

  // CRM communications
  const crmClients = clients.filter(c =>
    c.relationship_status === 'churn' || c.loyalty === 'risco' || c.relationship_status === 'perdido'
  )

  const suggestedMessage = (c: Client): string => {
    if (c.relationship_status === 'churn') return `Olá${c.contact_name ? ' ' + c.contact_name : ''}! Percebemos que não nos comunicamos há algum tempo. Gostaríamos de entender como podemos ajudar e explorar novas oportunidades juntos. Vamos agendar uma conversa rápida?`
    if (c.relationship_status === 'perdido') return `Olá${c.contact_name ? ' ' + c.contact_name : ''}! Gostaríamos de retomar contato e apresentar uma proposta de recuperação personalizada para a ${c.name}. Temos novidades que podem fazer sentido para vocês.`
    return `Olá${c.contact_name ? ' ' + c.contact_name : ''}! Passando para checar como está indo na ${c.name} e ver se há algo em que possamos apoiar. Fique à vontade para compartilhar qualquer feedback!`
  }

  const copyMessage = (id: string, msg: string) => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users size={40} className="text-gray-200 mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-1">Nenhum cliente cadastrado</h2>
        <p className="text-sm text-gray-400">Adicione clientes na seção Clientes para ver o dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-xs text-gray-400 mt-0.5">Visão financeira e comercial — {clients.length} clientes</p>
      </div>

      {/* ── KPIs ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Clientes ativos"
          value={String(activeClients.length)}
          sub={`de ${clients.length} total`}
          icon={<Users size={18} className="text-[#1B4332]" />}
        />
        <KPICard
          label="MRR"
          value={mrr > 0 ? `R$ ${fmt(mrr)}` : '—'}
          sub="receita mensal recorrente"
          icon={<DollarSign size={18} className="text-green-700" />}
          color="bg-green-50"
        />
        <KPICard
          label="Pipeline"
          value={pipelineRevenue > 0 ? `R$ ${fmt(pipelineRevenue)}` : `${pipelineClients.length} clientes`}
          sub="potencial em negociação"
          icon={<TrendingUp size={18} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <KPICard
          label="Taxa de Churn"
          value={`${churnRate}%`}
          sub={`${churnCount} cliente${churnCount !== 1 ? 's' : ''} em churn`}
          icon={<TrendingDown size={18} className="text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* ── RECEITA POR CLIENTE ────────────────── */}
      <Section title="Receita por cliente (MRR)">
        {byRevenue.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum cliente com receita mensal cadastrada</p>
        ) : (
          <div className="space-y-2.5">
            {byRevenue.map(c => {
              const pct = Math.round(((c.monthly_revenue ?? 0) / (maxRevenue || 1)) * 100)
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-gray-800 truncate">{c.name}</span>
                      {c.loyalty && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${LOYALTY_CONFIG[c.loyalty].color}`}>
                          {LOYALTY_CONFIG[c.loyalty].label}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${OWNER_COLORS[c.owner]}`}>
                        {c.owner}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">R$ {fmt(c.monthly_revenue ?? 0)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-[#1B4332] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── PIPELINE KANBAN ───────────────────── */}
      <Section title="Pipeline Kanban">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map(stage => {
            const stageCl = clients.filter(c => c.stage === stage)
            return (
              <div key={stage}>
                <div className="mb-2 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_CONFIG[stage].color}`}>
                    {STAGE_CONFIG[stage].label}
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{stageCl.length}</span>
                </div>
                <div className="space-y-1.5">
                  {stageCl.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-100 rounded-lg h-10 flex items-center justify-center">
                      <span className="text-[10px] text-gray-300">—</span>
                    </div>
                  ) : stageCl.map(c => (
                    <div key={c.id} className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight line-clamp-2">{c.name}</p>
                      {c.revenue_potential && (
                        <p className="text-[9px] text-green-600 mt-0.5 truncate">{c.revenue_potential}</p>
                      )}
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${OWNER_COLORS[c.owner]}`}>{c.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── CONTRATOS ─────────────────────────── */}
      <Section title="Contratos">
        {withContracts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum cliente com data de contrato cadastrada</p>
        ) : (
          <div className="space-y-2">
            {withContracts
              .sort((a, b) => new Date(a.contract_end!).getTime() - new Date(b.contract_end!).getTime())
              .map(c => {
                const endDate = parseISO(c.contract_end!)
                const daysLeft = differenceInDays(endDate, today)
                const isExpired = daysLeft < 0
                const isUrgent = !isExpired && daysLeft <= 30

                return (
                  <div key={c.id} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${isExpired ? 'bg-red-50 border-red-100' : isUrgent ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {c.contract_start && <span>Início: {format(parseISO(c.contract_start), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                        <span>Fim: {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">Expirado há {Math.abs(daysLeft)}d</span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {daysLeft === 0 ? 'Vence hoje' : `${daysLeft}d restantes`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </Section>

      {/* ── CLUSTERIZAÇÃO ─────────────────────── */}
      <Section title="Clusterização por segmento">
        {clusterData.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum dado disponível</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {clusterData.map(({ seg, count, revenue }) => (
              <div key={seg} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEGMENT_COLORS[seg]}`}>
                  {seg.charAt(0).toUpperCase() + seg.slice(1)}
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-2 leading-none">{count}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">cliente{count !== 1 ? 's' : ''}</p>
                {revenue > 0 && (
                  <p className="text-xs text-green-700 font-semibold mt-1.5">R$ {fmt(revenue)}/mês</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── CRM COMUNICAÇÃO ───────────────────── */}
      <Section title="CRM Comunicação — Disparos sugeridos" defaultOpen={false}>
        {crmClients.length === 0 ? (
          <div className="text-center py-6">
            <Check size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum cliente em risco ou churn no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {crmClients.map(c => {
              const msg = suggestedMessage(c)
              const isCopied = copiedId === c.id
              const actionLabel = c.relationship_status === 'churn'
                ? 'Reativar contato'
                : c.relationship_status === 'perdido'
                ? 'Proposta de recuperação'
                : 'Atenção: risco de churn'

              return (
                <div key={c.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${OWNER_COLORS[c.owner]}`}>{c.owner}</span>
                      {c.relationship_status && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          {c.relationship_status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                      <AlertTriangle size={9} /> {actionLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5 leading-relaxed italic">
                    "{msg}"
                  </p>
                  <button
                    onClick={() => copyMessage(c.id, msg)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${isCopied ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-[#1B4332]/30 hover:text-[#1B4332]'}`}>
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    {isCopied ? 'Copiado!' : 'Copiar mensagem'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}
