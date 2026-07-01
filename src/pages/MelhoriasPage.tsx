import { useState, useMemo } from 'react'
import {
  Plus, X, Sparkles, Wand2, AlertTriangle, CheckCircle2, Clock,
  BarChart3, LayoutGrid, Lock, Bell, ArrowRight, TrendingUp,
  Target, Activity, Zap, Filter,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useImprovements, useImprovementNotifications } from '../hooks/useLocalData'
import type {
  Improvement, ImprovementStatus, ImprovementType,
  ImprovementPriority, ImprovementNotification,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const GRANULAR_MENUS = [
  { path: '/', label: 'Home', desc: 'Prioridades e agenda' },
  { path: '/dashboard', label: 'Dashboard', desc: 'Receita e CRM' },
  { path: '/agenda', label: 'Agenda', desc: 'Reuniões e eventos' },
  { path: '/tarefas', label: 'Tarefas', desc: 'Checklist da equipe' },
  { path: '/clientes', label: 'Clientes', desc: 'Pipeline comercial' },
  { path: '/docs', label: 'Docs', desc: 'Links e documentos' },
  { path: '/implantacao', label: 'Gestão de Implantação', desc: 'Cronograma e adoção' },
  { path: '/settings', label: 'Configurações', desc: 'Usuários e permissões' },
  { path: '/geral', label: 'Geral / Sistema', desc: 'Infraestrutura e performance' },
]

const STATUS_CONFIG: Record<ImprovementStatus, {
  label: string; color: string; bg: string; bar: string;
  next?: ImprovementStatus; nextLabel?: string
}> = {
  backlog:        { label: 'Backlog',            color: 'text-gray-600',   bg: 'bg-gray-100',    bar: 'bg-gray-400',   next: 'analise',        nextLabel: 'Enviar p/ Análise' },
  analise:        { label: 'Em Análise',         color: 'text-blue-700',   bg: 'bg-blue-50',     bar: 'bg-blue-500',   next: 'desenvolvimento', nextLabel: 'Iniciar Dev' },
  desenvolvimento:{ label: 'Em Desenvolvimento', color: 'text-orange-700', bg: 'bg-orange-50',   bar: 'bg-orange-500', next: 'validacao',      nextLabel: 'Enviar p/ Validação' },
  validacao:      { label: 'Validação',          color: 'text-purple-700', bg: 'bg-purple-50',   bar: 'bg-purple-500', next: 'concluido',      nextLabel: 'Concluir ✓' },
  concluido:      { label: 'Concluído',          color: 'text-green-700',  bg: 'bg-green-50',    bar: 'bg-green-500' },
  cancelado:      { label: 'Cancelado',          color: 'text-red-600',    bg: 'bg-red-50',      bar: 'bg-red-400' },
}

const TYPE_CONFIG: Record<ImprovementType, { label: string; color: string; bg: string; icon: string }> = {
  bug:       { label: 'Bug',        color: 'text-red-700',    bg: 'bg-red-100',    icon: '🐛' },
  melhoria:  { label: 'Melhoria',   color: 'text-blue-700',   bg: 'bg-blue-100',   icon: '✨' },
  estrutural:{ label: 'Estrutural', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🏗️' },
}

const PRIORITY_CONFIG: Record<ImprovementPriority, { label: string; dot: string }> = {
  alta:  { label: 'Alta',  dot: 'bg-red-500' },
  media: { label: 'Média', dot: 'bg-yellow-500' },
  baixa: { label: 'Baixa', dot: 'bg-green-500' },
}

const EDUARDO_EMAIL = 'eduardo.lage@grupogranular.com.br'
const KANBAN_COLS: ImprovementStatus[] = ['backlog', 'analise', 'desenvolvimento', 'validacao', 'concluido']

// ─── PromptForge ──────────────────────────────────────────────────────────────

function runPromptForge(title: string, description: string, type: ImprovementType, menuLabel: string): string {
  const typeCtx: Record<ImprovementType, string> = {
    bug: 'Correção de comportamento inesperado',
    melhoria: 'Aprimoramento de funcionalidade existente',
    estrutural: 'Mudança arquitetural com impacto em múltiplas áreas',
  }
  const typeImpact: Record<ImprovementType, string> = {
    bug: 'Alto — afeta usabilidade e confiabilidade do sistema',
    melhoria: 'Médio — melhora UX sem alterar estrutura base',
    estrutural: 'Alto — requer validação estratégica antes da execução',
  }
  const behavior = type === 'bug'
    ? `O sistema deve funcionar corretamente em **${menuLabel}**, eliminando o comportamento descrito acima.`
    : `**${title}** implementado em **${menuLabel}** com experiência de uso consistente e sem regressões.`

  const lines = [
    `**Contexto:** ${typeCtx[type]} na área de ${menuLabel}.`,
    ``,
    `**Problema / Oportunidade:**`,
    description.trim(),
    ``,
    `**Comportamento Esperado:**`,
    behavior,
    ``,
    `**Critérios de Aceite:**`,
    `- [ ] Funcionalidade implementada conforme especificado`,
    `- [ ] Validado pelo solicitante no ambiente de testes`,
    `- [ ] Sem regressão em outras áreas do sistema`,
    type === 'estrutural' ? `- [ ] Aprovação estratégica do Eduardo antes do início do desenvolvimento` : null,
    ``,
    `**Impacto:** ${typeImpact[type]}`,
    ``,
    `**Área Afetada:** ${menuLabel}`,
    type === 'estrutural' ? `\n⚠️ **Atenção:** Mudança estrutural — requer aprovação do Eduardo antes de avançar para desenvolvimento.` : null,
  ]
  return lines.filter(l => l !== null).join('\n')
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

function findDuplicate(title: string, improvements: Improvement[], excludeId?: string): Improvement | null {
  const norm = title.toLowerCase().trim()
  if (norm.length < 5) return null
  return improvements.find(imp => {
    if (imp.id === excludeId || imp.status === 'cancelado') return false
    const other = imp.title.toLowerCase().trim()
    const words1 = norm.split(/\s+/).filter(w => w.length > 3)
    const words2 = other.split(/\s+/).filter(w => w.length > 3)
    const common = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
    return common.length >= 2 || other.includes(norm) || norm.includes(other)
  }) ?? null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPI({ label, value, sub, icon, color = 'text-gray-900' }: {
  label: string; value: number; sub: string; icon: React.ReactNode; color?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function ImprovementCard({ imp, isEduardo, onAdvance, onApproveEduardo, onCancel }: {
  imp: Improvement
  isEduardo: boolean
  onAdvance: () => void
  onApproveEduardo: () => void
  onCancel: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const typeConf = TYPE_CONFIG[imp.type]
  const prioConf = PRIORITY_CONFIG[imp.priority]
  const statusConf = STATUS_CONFIG[imp.status]

  const blockedByEduardo = imp.requiresEduardoApproval && imp.status === 'analise' && !imp.eduardoApprovedAt
  const nextIsConclusion = statusConf.next === 'concluido'
  const canAdvance = !!statusConf.next && !blockedByEduardo && (!nextIsConclusion || isEduardo)
  const canEduardoApprove = blockedByEduardo && isEduardo

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeConf.bg} ${typeConf.color}`}>
          {typeConf.icon} {typeConf.label}
        </span>
        <span className={`w-2 h-2 rounded-full ${prioConf.dot} flex-shrink-0`} title={`Prioridade ${prioConf.label}`} />
        {imp.requiresEduardoApproval && (
          <span className="ml-auto" title={imp.eduardoApprovedAt ? 'Aprovado pelo Eduardo' : 'Aguardando aprovação do Eduardo'}>
            {imp.eduardoApprovedAt
              ? <CheckCircle2 size={12} className="text-green-500" />
              : <Lock size={12} className="text-purple-500" />
            }
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1.5 leading-snug">{imp.title}</p>

      {/* Menu + tags */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
          {imp.affectedMenuLabel}
        </span>
        {imp.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {/* Blocked warning */}
      {blockedByEduardo && (
        <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center gap-1.5">
          <Lock size={11} className="text-purple-600 flex-shrink-0" />
          <p className="text-[10px] text-purple-700 dark:text-purple-300">Aguardando aprovação do Eduardo</p>
        </div>
      )}

      {/* Conclusion date */}
      {imp.status === 'concluido' && imp.completedAt && (
        <div className="mb-2 flex items-center gap-1">
          <CheckCircle2 size={11} className="text-green-500" />
          <span className="text-[10px] text-green-600">Concluído em {new Date(imp.completedAt).toLocaleDateString('pt-BR')}</span>
        </div>
      )}

      {/* Refined description toggle */}
      {imp.refinedDescription && (
        <button
          onClick={() => setShowDetail(v => !v)}
          className="text-[10px] text-[#1B4332] hover:underline mb-2 flex items-center gap-0.5"
        >
          <Sparkles size={10} />
          {showDetail ? 'Ocultar spec' : 'Ver spec PromptForge'}
        </button>
      )}
      {showDetail && imp.refinedDescription && (
        <pre className="text-[10px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto mb-2 text-gray-700 dark:text-gray-300">
          {imp.refinedDescription}
        </pre>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-700 gap-1 flex-wrap">
        <span className="text-[10px] text-gray-400">{imp.requesterName} · {new Date(imp.createdAt).toLocaleDateString('pt-BR')}</span>
        <div className="flex gap-1 flex-wrap">
          {imp.status !== 'concluido' && imp.status !== 'cancelado' && (
            <button
              onClick={onCancel}
              className="text-[10px] text-gray-400 hover:text-red-500 px-1.5 py-1 rounded-lg transition-colors"
              title="Cancelar"
            >
              <X size={10} />
            </button>
          )}
          {canEduardoApprove && (
            <button
              onClick={onApproveEduardo}
              className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-0.5"
            >
              <CheckCircle2 size={10} />
              Aprovar
            </button>
          )}
          {canAdvance && (
            <button
              onClick={onAdvance}
              className={`text-[10px] text-white px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5 ${
                nextIsConclusion ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1B4332] hover:bg-[#1B4332]/90'
              }`}
            >
              {statusConf.nextLabel} <ArrowRight size={10} />
            </button>
          )}
          {nextIsConclusion && !isEduardo && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={10} /> Eduardo conclui</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardView({ improvements }: { improvements: Improvement[] }) {
  const active = improvements.filter(i => i.status !== 'cancelado')
  const total = active.length
  const concluido = active.filter(i => i.status === 'concluido').length
  const emAndamento = active.filter(i => ['desenvolvimento', 'validacao'].includes(i.status)).length
  const aguardandoEduardo = active.filter(i => i.requiresEduardoApproval && i.status === 'analise' && !i.eduardoApprovedAt).length
  const taxaConclusao = total > 0 ? Math.round((concluido / total) * 100) : 0

  const byStatus = KANBAN_COLS.map(s => ({
    status: s,
    count: active.filter(i => i.status === s).length,
    config: STATUS_CONFIG[s],
  }))

  const byType = (['bug', 'melhoria', 'estrutural'] as ImprovementType[]).map(t => ({
    type: t,
    count: active.filter(i => i.type === t).length,
    config: TYPE_CONFIG[t],
  }))

  const byMenu = GRANULAR_MENUS.map(m => ({
    ...m,
    count: active.filter(i => i.affectedMenu === m.path).length,
  })).filter(m => m.count > 0).sort((a, b) => b.count - a.count)

  const byPriority = (['alta', 'media', 'baixa'] as ImprovementPriority[]).map(p => ({
    priority: p,
    count: active.filter(i => i.priority === p).length,
    config: PRIORITY_CONFIG[p],
  }))

  const recentes = [...improvements]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total de Melhorias" value={total} sub="itens ativos" icon={<Activity size={16} className="text-[#1B4332]" />} />
        <KPI label="Concluídas" value={concluido} sub={`${taxaConclusao}% do total`} icon={<CheckCircle2 size={16} className="text-green-600" />} color="text-green-600" />
        <KPI label="Em Andamento" value={emAndamento} sub="dev + validação" icon={<Clock size={16} className="text-orange-500" />} color="text-orange-500" />
        <KPI label="Aguard. Eduardo" value={aguardandoEduardo} sub="aprovação estrutural" icon={<Lock size={16} className="text-purple-600" />} color="text-purple-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#1B4332]" /> Por Status
          </h3>
          <div className="space-y-3">
            {byStatus.map(({ status, count, config }) => (
              <div key={status}>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.bar}`}
                    style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por tipo */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target size={15} className="text-[#1B4332]" /> Por Tipo
          </h3>
          <div className="space-y-3">
            {byType.map(({ type, count, config }) => (
              <div key={type} className={`p-3 rounded-xl ${config.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                    <div className="h-1.5 bg-white/50 rounded-full mt-1 w-24 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${config.color}`}>{count}</span>
                  <p className="text-[10px] text-gray-500">{total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top menus */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#1B4332]" /> Menus Mais Afetados
          </h3>
          {byMenu.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-2.5">
              {byMenu.map(m => (
                <div key={m.path} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 dark:text-gray-300 w-40 truncate">{m.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B4332] rounded-full"
                      style={{ width: `${(m.count / byMenu[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-5 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prioridade + taxa */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={15} className="text-[#1B4332]" /> Por Prioridade
          </h3>
          <div className="space-y-3">
            {byPriority.map(({ priority, count, config }) => (
              <div key={priority} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot} flex-shrink-0`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{config.label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Taxa de Conclusão</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-[#1B4332]">{taxaConclusao}%</span>
              <span className="text-xs text-gray-400 mb-1">{concluido}/{total}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[#1B4332] rounded-full transition-all" style={{ width: `${taxaConclusao}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity size={15} className="text-[#1B4332]" /> Atividade Recente
        </h3>
        {recentes.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma atividade ainda</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {recentes.map(imp => {
              const sc = STATUS_CONFIG[imp.status]
              const tc = TYPE_CONFIG[imp.type]
              const pc = PRIORITY_CONFIG[imp.priority]
              return (
                <div key={imp.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-base">{tc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{imp.title}</p>
                    <p className="text-[10px] text-gray-400">{imp.affectedMenuLabel} · {new Date(imp.updatedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${pc.dot} flex-shrink-0`} title={`Prioridade ${pc.label}`} />
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${sc.bg} ${sc.color}`}>{sc.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MelhoriasPage() {
  const { user } = useAuth()
  const [improvements, setImprovements] = useImprovements()
  const [notifications, setNotifications] = useImprovementNotifications()

  const [tab, setTab] = useState<'kanban' | 'dashboard'>('kanban')
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState<ImprovementType | 'todos'>('todos')
  const [filterMenu, setFilterMenu] = useState<string>('todos')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPromptForge, setShowPromptForge] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    refinedDescription: '',
    affectedMenu: '/agenda',
    type: 'melhoria' as ImprovementType,
    priority: 'media' as ImprovementPriority,
    tags: '',
  })

  const isEduardo = user?.email === EDUARDO_EMAIL
  const myNotifications = notifications.filter(n => n.to === user?.email && !n.read)

  const filtered = useMemo(() => improvements.filter(imp => {
    if (imp.status === 'cancelado') return false
    if (filterType !== 'todos' && imp.type !== filterType) return false
    if (filterMenu !== 'todos' && imp.affectedMenu !== filterMenu) return false
    return true
  }), [improvements, filterType, filterMenu])

  const byStatus = (status: ImprovementStatus) => filtered.filter(i => i.status === status)

  const duplicate = form.title.length > 4 ? findDuplicate(form.title, improvements) : null

  // ── Actions ──────────────────────────────────────────────────────────────────

  function advanceStatus(imp: Improvement) {
    const next = STATUS_CONFIG[imp.status].next
    if (!next) return
    const blockedByEduardo = imp.requiresEduardoApproval && imp.status === 'analise' && !imp.eduardoApprovedAt
    if (blockedByEduardo && !isEduardo) return
    if (next === 'concluido' && !isEduardo) return

    const now = new Date().toISOString()
    const updated: Improvement = {
      ...imp,
      status: next,
      updatedAt: now,
      completedAt: next === 'concluido' ? now : imp.completedAt,
      statusHistory: [...imp.statusHistory, { status: next, by: user?.name ?? 'Sistema', at: now }],
      notified: imp.notified,
    }
    setImprovements(prev => prev.map(i => i.id === imp.id ? updated : i))

    if (next === 'concluido' && imp.requester !== user?.email) {
      const notif: ImprovementNotification = {
        id: `notif-${Date.now()}`,
        improvementId: imp.id,
        improvementTitle: imp.title,
        message: `✅ A melhoria "${imp.title}" foi concluída por ${user?.name ?? 'Eduardo'}!`,
        to: imp.requester,
        read: false,
        createdAt: now,
      }
      setNotifications(prev => [notif, ...prev])
    }
  }

  function approveEduardo(imp: Improvement) {
    if (!isEduardo) return
    const now = new Date().toISOString()
    setImprovements(prev => prev.map(i =>
      i.id === imp.id ? { ...i, eduardoApprovedAt: now, updatedAt: now } : i
    ))
  }

  function cancelImprovement(imp: Improvement) {
    setImprovements(prev => prev.map(i =>
      i.id === imp.id ? { ...i, status: 'cancelado', updatedAt: new Date().toISOString() } : i
    ))
  }

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function refineWithPromptForge() {
    if (!form.title || !form.description) return
    const menu = GRANULAR_MENUS.find(m => m.path === form.affectedMenu)
    const refined = runPromptForge(form.title, form.description, form.type, menu?.label ?? form.affectedMenu)
    setForm(f => ({ ...f, refinedDescription: refined }))
    setShowPromptForge(true)
  }

  function submitImprovement() {
    if (!form.title.trim() || !form.description.trim()) return
    const menu = GRANULAR_MENUS.find(m => m.path === form.affectedMenu)
    const now = new Date().toISOString()
    const isStructural = form.type === 'estrutural'

    const imp: Improvement = {
      id: `imp-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      refinedDescription: form.refinedDescription || undefined,
      affectedMenu: form.affectedMenu,
      affectedMenuLabel: menu?.label ?? form.affectedMenu,
      type: form.type,
      priority: form.priority,
      status: 'backlog',
      requester: user?.email ?? '',
      requesterName: user?.name ?? '',
      requiresEduardoApproval: isStructural,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: 'backlog', by: user?.name ?? '', at: now }],
      notified: false,
    }

    setImprovements(prev => [imp, ...prev])

    if (isStructural) {
      const notif: ImprovementNotification = {
        id: `notif-${Date.now()}`,
        improvementId: imp.id,
        improvementTitle: imp.title,
        message: `🏗️ Nova melhoria estrutural de ${user?.name}: "${imp.title}" — requer sua aprovação antes do desenvolvimento.`,
        to: EDUARDO_EMAIL,
        read: false,
        createdAt: now,
      }
      setNotifications(prev => [notif, ...prev])
    }

    setShowModal(false)
    setForm({ title: '', description: '', refinedDescription: '', affectedMenu: '/agenda', type: 'melhoria', priority: 'media', tags: '' })
    setShowPromptForge(false)
  }

  function closeModal() {
    setShowModal(false)
    setShowPromptForge(false)
    setForm({ title: '', description: '', refinedDescription: '', affectedMenu: '/agenda', type: 'melhoria', priority: 'media', tags: '' })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Zap size={20} className="text-[#1B4332]" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Melhorias Granular Food</h1>
            <span className="text-[10px] bg-[#1B4332] text-white px-2 py-0.5 rounded-full font-medium">XP Flow</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ciclo ágil · {improvements.filter(i => i.status !== 'cancelado').length} melhorias ativas
            {isEduardo && myNotifications.length > 0 && (
              <span className="ml-2 text-purple-600 font-medium">· {myNotifications.length} pendente(s) de aprovação</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Bell size={16} />
              {myNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {myNotifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Notificações</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <X size={14} />
                  </button>
                </div>
                {notifications.filter(n => n.to === user?.email).length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">Nenhuma notificação</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-72 overflow-y-auto">
                    {notifications.filter(n => n.to === user?.email).map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${n.read ? 'opacity-60' : ''}`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</p>
                        {!n.read && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1B4332]/90 transition-colors"
          >
            <Plus size={15} />
            Nova Melhoria
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('kanban')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'kanban' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <LayoutGrid size={14} />
          Kanban
        </button>
        <button
          onClick={() => setTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'dashboard' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 size={14} />
          Dashboard
        </button>
      </div>

      {/* ── Kanban ── */}
      {tab === 'kanban' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter size={12} /> Tipo:
            </div>
            {(['todos', 'bug', 'melhoria', 'estrutural'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterType === t
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                {t === 'todos' ? 'Todos' : `${TYPE_CONFIG[t].icon} ${TYPE_CONFIG[t].label}`}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <select
              value={filterMenu}
              onChange={e => setFilterMenu(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <option value="todos">Todos os menus</option>
              {GRANULAR_MENUS.map(m => <option key={m.path} value={m.path}>{m.label}</option>)}
            </select>
          </div>

          {/* Board */}
          <div className="flex gap-4 overflow-x-auto pb-6">
            {KANBAN_COLS.map(status => {
              const config = STATUS_CONFIG[status]
              const cards = byStatus(status)
              return (
                <div key={status} className="flex-shrink-0 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                    </div>
                    {status === 'validacao' && !isEduardo && cards.length > 0 && (
                      <span className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5">
                        <Clock size={10} /> Eduardo conclui
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 min-h-[120px]">
                    {cards.map(imp => (
                      <ImprovementCard
                        key={imp.id}
                        imp={imp}
                        isEduardo={isEduardo}
                        onAdvance={() => advanceStatus(imp)}
                        onApproveEduardo={() => approveEduardo(imp)}
                        onCancel={() => cancelImprovement(imp)}
                      />
                    ))}
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center text-xs text-gray-400">
                        Nenhum item
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Dashboard ── */}
      {tab === 'dashboard' && <DashboardView improvements={improvements} />}

      {/* ── Modal: Nova Melhoria ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#1B4332]" />
                <h2 className="font-bold text-gray-900 dark:text-white">Nova Melhoria</h2>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">XP Flow</span>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Título *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Adicionar filtro por data na Agenda"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20"
                />
                {duplicate && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl flex gap-2">
                    <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Possível duplicata detectada</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                        "{duplicate.title}" já existe — Status: {STATUS_CONFIG[duplicate.status].label}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Menu / Área *</label>
                  <select
                    value={form.affectedMenu}
                    onChange={e => setForm(f => ({ ...f, affectedMenu: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]"
                  >
                    {GRANULAR_MENUS.map(m => <option key={m.path} value={m.path}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Tipo *</label>
                  <div className="flex gap-1.5">
                    {(['bug', 'melhoria', 'estrutural'] as ImprovementType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-medium border transition-all ${
                          form.type === t
                            ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} border-current`
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {TYPE_CONFIG[t].icon}<br />{TYPE_CONFIG[t].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Structural warning */}
              {form.type === 'estrutural' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl flex gap-2">
                  <AlertTriangle size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-purple-800 dark:text-purple-300">Mudança Estrutural</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                      Eduardo será notificado e precisa aprovar antes de entrar em desenvolvimento.
                    </p>
                  </div>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Prioridade</label>
                <div className="flex gap-2">
                  {(['alta', 'media', 'baixa'] as ImprovementPriority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.priority === p
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                          : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Descrição *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Descreva o problema ou oportunidade de melhoria..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 resize-none"
                />
              </div>

              {/* PromptForge */}
              <div className="border border-dashed border-[#1B4332]/40 rounded-xl p-4 bg-[#1B4332]/5 dark:bg-[#1B4332]/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#1B4332]" />
                    <span className="text-sm font-semibold text-[#1B4332]">PromptForge</span>
                    <span className="text-[10px] bg-[#1B4332]/15 text-[#1B4332] px-1.5 py-0.5 rounded-full">Refinamento Inteligente</span>
                  </div>
                  <button
                    onClick={refineWithPromptForge}
                    disabled={!form.title.trim() || !form.description.trim()}
                    className="flex items-center gap-1 text-xs bg-[#1B4332] text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-[#1B4332]/90 transition-colors"
                  >
                    <Wand2 size={12} />
                    Refinar
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estrutura sua descrição em critérios de aceite, impacto e comportamento esperado — tornando a execução mais assertiva.
                </p>
                {showPromptForge && form.refinedDescription && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Especificação Refinada</span>
                      <button
                        onClick={() => { setForm(f => ({ ...f, refinedDescription: '' })); setShowPromptForge(false) }}
                        className="text-[10px] text-red-400 hover:text-red-600"
                      >
                        Descartar
                      </button>
                    </div>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 whitespace-pre-wrap font-mono leading-relaxed max-h-52 overflow-y-auto">
                      {form.refinedDescription}
                    </pre>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Tags <span className="text-gray-400 font-normal text-xs">(separadas por vírgula)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Ex: UX, mobile, performance"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitImprovement}
                disabled={!form.title.trim() || !form.description.trim()}
                className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-medium hover:bg-[#1B4332]/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap size={14} />
                Enviar para Backlog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
