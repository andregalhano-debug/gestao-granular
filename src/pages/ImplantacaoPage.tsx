import { useState } from 'react'
import { Plus, X, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Fase = 'planejamento' | 'infraestrutura' | 'importacao_dados' | 'treinamento' | 'testes' | 'piloto' | 'lancamento' | 'acompanhamento'
type Prioridade = 'alta' | 'media' | 'baixa'
type FeedbackTipo = 'bug' | 'melhoria' | 'desenvolvimento' | 'duvida'
type FeedbackStatus = 'novo' | 'em_analise' | 'em_desenvolvimento' | 'resolvido'

interface Area {
  id: string
  nome: string
  responsavel: string
  fase: Fase
  progresso: number
  prioridade: Prioridade
  modulos: string[]
  notas: string
}

interface Feedback {
  id: string
  tipo: FeedbackTipo
  titulo: string
  descricao: string
  prioridade: Prioridade
  area: string
  status: FeedbackStatus
  data: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const AREAS_INIT: Area[] = [
  { id: 'financeiro', nome: 'Financeiro', responsavel: 'Maria Santos', fase: 'testes', progresso: 75, prioridade: 'alta', modulos: ['Contas a Pagar', 'Contas a Receber', 'Fluxo de Caixa'], notas: '' },
  { id: 'compras', nome: 'Compras', responsavel: 'João Silva', fase: 'treinamento', progresso: 55, prioridade: 'media', modulos: ['Pedido de Compra', 'Fornecedores', 'Cotação'], notas: '' },
  { id: 'estoque', nome: 'Estoque', responsavel: 'Ana Costa', fase: 'lancamento', progresso: 90, prioridade: 'alta', modulos: ['Entrada/Saída', 'Inventário', 'Localização'], notas: '' },
  { id: 'vendas', nome: 'Vendas', responsavel: 'Carlos Mendes', fase: 'planejamento', progresso: 15, prioridade: 'baixa', modulos: ['Pedido de Venda', 'Clientes', 'Faturamento'], notas: '' },
  { id: 'producao', nome: 'Produção', responsavel: 'Fernanda Lima', fase: 'importacao_dados', progresso: 40, prioridade: 'alta', modulos: ['Ordens de Produção', 'MRP', 'Apontamentos'], notas: '' },
]

const FEEDBACKS_INIT: Feedback[] = [
  { id: '1', tipo: 'bug', titulo: 'Erro ao importar planilha de fornecedores', descricao: 'Sistema retorna erro 500 ao tentar importar planilha XLSX de fornecedores.', prioridade: 'alta', area: 'compras', status: 'novo', data: '2026-06-20' },
  { id: '2', tipo: 'melhoria', titulo: 'Adicionar filtro por data no relatório', descricao: 'Relatório de estoque não possui filtro por período, dificultando análise.', prioridade: 'alta', area: 'estoque', status: 'em_analise', data: '2026-06-18' },
  { id: '3', tipo: 'bug', titulo: 'Cálculo de IPI incorreto em NF entrada', descricao: 'O IPI está sendo calculado sobre base errada nas notas de entrada.', prioridade: 'alta', area: 'financeiro', status: 'em_desenvolvimento', data: '2026-06-15' },
  { id: '4', tipo: 'desenvolvimento', titulo: 'Integração com transportadora', descricao: 'Necessário integrar módulo de vendas com API da transportadora.', prioridade: 'media', area: 'vendas', status: 'novo', data: '2026-06-22' },
]

const FASES: { id: Fase; label: string; color: string }[] = [
  { id: 'planejamento', label: 'Planejamento', color: 'bg-gray-100 text-gray-700' },
  { id: 'infraestrutura', label: 'Infraestrutura', color: 'bg-blue-100 text-blue-700' },
  { id: 'importacao_dados', label: 'Importação de Dados', color: 'bg-orange-100 text-orange-700' },
  { id: 'treinamento', label: 'Treinamento', color: 'bg-purple-100 text-purple-700' },
  { id: 'testes', label: 'Testes (UAT)', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'piloto', label: 'Piloto', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'lancamento', label: 'Lançamento', color: 'bg-green-100 text-green-700' },
  { id: 'acompanhamento', label: 'Acompanhamento', color: 'bg-teal-100 text-teal-700' },
]

const FASE_DOT: Record<Fase, string> = {
  planejamento: 'bg-gray-400', infraestrutura: 'bg-blue-500', importacao_dados: 'bg-orange-500',
  treinamento: 'bg-purple-500', testes: 'bg-yellow-500', piloto: 'bg-indigo-500',
  lancamento: 'bg-green-600', acompanhamento: 'bg-teal-500',
}

const CHECKLIST_PHASES: { fase: Fase; itens: { desc: string; cat: string }[] }[] = [
  { fase: 'planejamento', itens: [
    { desc: 'Mapeamento dos processos AS-IS', cat: 'Processo' },
    { desc: 'Análise de gap', cat: 'Análise' },
    { desc: 'Definição do escopo', cat: 'Escopo' },
    { desc: 'RACI matrix aprovada', cat: 'Governança' },
    { desc: 'Cronograma aprovado', cat: 'Governança' },
  ]},
  { fase: 'infraestrutura', itens: [
    { desc: 'Acessos criados e validados', cat: 'TI' },
    { desc: 'Perfis de permissão configurados', cat: 'TI' },
    { desc: 'Ambiente de treinamento configurado', cat: 'TI' },
    { desc: 'Conectividade validada', cat: 'TI' },
  ]},
  { fase: 'importacao_dados', itens: [
    { desc: 'Mapeamento de dados legados', cat: 'Dados' },
    { desc: 'Template preenchido e validado', cat: 'Dados' },
    { desc: 'Limpeza de dados realizada', cat: 'Dados' },
    { desc: 'Dados mestres importados', cat: 'Dados' },
    { desc: 'Saldos validados pelo responsável', cat: 'Validação' },
  ]},
  { fase: 'treinamento', itens: [
    { desc: 'Material elaborado', cat: 'Conteúdo' },
    { desc: 'Super usuários treinados', cat: 'Pessoas' },
    { desc: 'Usuários finais treinados', cat: 'Pessoas' },
    { desc: 'Sandbox disponível', cat: 'TI' },
    { desc: 'Taxa ≥ 90% atingida', cat: 'Qualidade' },
  ]},
  { fase: 'testes', itens: [
    { desc: 'Cenários documentados', cat: 'Qualidade' },
    { desc: 'Testes executados pelos usuários', cat: 'Qualidade' },
    { desc: 'Defeitos críticos resolvidos', cat: 'Qualidade' },
    { desc: 'Sign-off formal assinado', cat: 'Governança' },
    { desc: 'Teste de integração concluído', cat: 'TI' },
  ]},
  { fase: 'piloto', itens: [
    { desc: 'Critérios de go-live aprovados', cat: 'Governança' },
    { desc: 'Piloto com volume real', cat: 'Processo' },
    { desc: 'Suporte hypercare posicionado', cat: 'Suporte' },
    { desc: 'Métricas registradas', cat: 'Qualidade' },
    { desc: 'Lições aprendidas documentadas', cat: 'Conhecimento' },
  ]},
  { fase: 'lancamento', itens: [
    { desc: 'Runbook executado', cat: 'TI' },
    { desc: 'Usuários notificados', cat: 'Comunicação' },
    { desc: 'Primeiras transações validadas', cat: 'Validação' },
    { desc: 'Rollback plan validado', cat: 'TI' },
    { desc: 'Equipe hypercare posicionada', cat: 'Suporte' },
  ]},
  { fase: 'acompanhamento', itens: [
    { desc: 'Métricas semanais sendo registradas', cat: 'Qualidade' },
    { desc: 'Review 30 dias realizado', cat: 'Governança' },
    { desc: 'Feedbacks triados', cat: 'Processo' },
    { desc: 'Adoção ≥ 80% atingida', cat: 'Qualidade' },
    { desc: 'Reunião de encerramento realizada', cat: 'Governança' },
  ]},
]

const DIRECTIVES = [
  { urgency: 'urgente' as const, text: 'Vendas em Planejamento com 15% — risco de atraso crítico no cronograma' },
  { urgency: 'alta' as const, text: 'Bug de IPI em Financeiro bloqueia sign-off do UAT' },
  { urgency: 'normal' as const, text: 'Compras precisa acelerar treinamento para manter cronograma' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function progressColor(p: number) {
  if (p < 50) return 'bg-red-500'
  if (p <= 80) return 'bg-yellow-500'
  return 'bg-green-600'
}

function faseInfo(id: Fase) {
  return FASES.find(f => f.id === id)!
}

function prioridadeBadge(p: Prioridade) {
  const map: Record<Prioridade, string> = { alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-gray-100 text-gray-600' }
  return map[p]
}

function faseIndex(f: Fase) {
  return FASES.findIndex(x => x.id === f)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="bg-gray-100 rounded-full h-2 w-full">
      <div className={`${progressColor(value)} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

function FaseBadge({ fase }: { fase: Fase }) {
  const info = faseInfo(fase)
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
}

function PrioridadeDot({ p }: { p: Prioridade }) {
  const colors: Record<Prioridade, string> = { alta: 'bg-red-500', media: 'bg-yellow-500', baixa: 'bg-gray-400' }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[p]}`} />
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

function TabVisaoGeral({ areas }: { areas: Area[] }) {
  const progMedio = Math.round(areas.reduce((s, a) => s + a.progresso, 0) / areas.length)
  const criticas = areas.filter(a => a.progresso < 50).length
  const concluidas = areas.filter(a => a.progresso > 85).length
  const feedbacksAbertos = FEEDBACKS_INIT.filter(f => f.status !== 'resolvido').length

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Parceiro</p>
            <p className="text-lg font-bold text-gray-900">Alimentos São Paulo Ltda</p>
            <p className="text-sm text-gray-500">Indústria Alimentícia</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Início: 01/04/2026</p>
            <p>Previsão: 30/09/2026</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={progMedio} />
          </div>
          <span className="text-sm font-bold text-gray-700 w-10 text-right">{progMedio}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Progresso geral da implantação</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Progresso Médio', value: `${progMedio}%`, sub: 'todas as áreas', color: 'text-green-700' },
          { label: 'Áreas Críticas', value: criticas, sub: 'abaixo de 50%', color: 'text-red-600' },
          { label: 'Áreas Concluídas', value: concluidas, sub: 'acima de 85%', color: 'text-green-700' },
          { label: 'Feedbacks Abertos', value: feedbacksAbertos, sub: 'pendentes', color: 'text-yellow-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            <p className="text-[10px] text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Area cards grid */}
      <div>
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Áreas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {areas.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-gray-900 text-sm">{a.nome}</p>
                <PrioridadeDot p={a.prioridade} />
              </div>
              <p className="text-xs text-gray-500 mb-2">{a.responsavel}</p>
              <FaseBadge fase={a.fase} />
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={a.progresso} /></div>
                <span className="text-xs font-bold text-gray-600">{a.progresso}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Directives */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Diretivas da IA</p>
        <div className="space-y-2">
          {DIRECTIVES.map((d, i) => {
            const styles: Record<typeof d.urgency, { bar: string; badge: string; bg: string }> = {
              urgente: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', bg: 'bg-red-50 border-red-100' },
              alta: { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
              normal: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            }
            const s = styles[d.urgency]
            return (
              <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${s.bg}`}>
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${s.bar}`} />
                <div className="flex-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${s.badge}`}>{d.urgency}</span>
                  <p className="text-sm text-gray-700 mt-1">{d.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Áreas ───────────────────────────────────────────────────────────────

function TabAreas({ areas, setAreas }: { areas: Area[]; setAreas: React.Dispatch<React.SetStateAction<Area[]>> }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editVals, setEditVals] = useState<{ responsavel: string; notas: string }>({ responsavel: '', notas: '' })

  function startEdit(a: Area) {
    setEditing(a.id)
    setEditVals({ responsavel: a.responsavel, notas: a.notas })
  }

  function saveEdit(id: string) {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, ...editVals } : a))
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      {areas.map(a => (
        <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-gray-900">{a.nome}</p>
              <p className="text-xs text-gray-500">{a.responsavel} · Responsável da Área</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioridadeBadge(a.prioridade)}`}>
                {a.prioridade}
              </span>
              <button
                onClick={() => editing === a.id ? setEditing(null) : startEdit(a)}
                className="text-xs text-[#1B4332] font-medium hover:underline"
              >
                {editing === a.id ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <FaseBadge fase={a.fase} />
            <div className="flex-1"><ProgressBar value={a.progresso} /></div>
            <span className="text-xs font-bold text-gray-600">{a.progresso}%</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {a.modulos.map(m => (
              <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
          {editing === a.id ? (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Responsável</p>
                <input
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
                  value={editVals.responsavel}
                  onChange={e => setEditVals(v => ({ ...v, responsavel: e.target.value }))}
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Notas</p>
                <textarea
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332] resize-none"
                  value={editVals.notas}
                  onChange={e => setEditVals(v => ({ ...v, notas: e.target.value }))}
                  placeholder="Observações sobre esta área..."
                />
              </div>
              <button onClick={() => saveEdit(a.id)} className="bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium">
                Salvar
              </button>
            </div>
          ) : a.notas ? (
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">{a.notas}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Cronograma ─────────────────────────────────────────────────────────

function TabCronograma({ areas }: { areas: Area[] }) {
  return (
    <div className="space-y-6">
      {/* Phase timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Linha do Tempo por Fase</p>
        <div className="space-y-3">
          {FASES.map((fase, fi) => (
            <div key={fase.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-500">{fi + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-700">{fase.label}</p>
                  {areas.filter(a => a.fase === fase.id).map(a => (
                    <span key={a.id} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${FASE_DOT[a.fase]}`} />
                      <span className="text-xs text-gray-500">{a.nome}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary matrix */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Matriz de Status</p>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-semibold text-gray-600 pb-2 pr-4">Área</th>
              {FASES.map(f => (
                <th key={f.id} className="text-center font-semibold text-gray-600 pb-2 px-1 whitespace-nowrap">
                  {f.label.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map(a => {
              const cur = faseIndex(a.fase)
              return (
                <tr key={a.id} className="border-t border-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-700">{a.nome}</td>
                  {FASES.map((f, fi) => {
                    const cell = fi < cur ? '✓' : fi === cur ? '◉' : '○'
                    const cls = fi < cur ? 'text-green-600 font-bold' : fi === cur ? 'text-[#1B4332] font-black' : 'text-gray-300'
                    return (
                      <td key={f.id} className={`text-center py-2 px-1 ${cls}`}>{cell}</td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Checklists ─────────────────────────────────────────────────────────

function TabChecklists({ areas }: { areas: Area[] }) {
  const [selectedArea, setSelectedArea] = useState(areas[0].id)
  const [selectedFase, setSelectedFase] = useState<Fase>('planejamento')
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const phaseItems = CHECKLIST_PHASES.find(p => p.fase === selectedFase)?.itens ?? []
  const done = phaseItems.filter((_, i) => checks[`${selectedArea}-${selectedFase}-${i}`]).length

  return (
    <div className="space-y-4">
      {/* Area selector */}
      <div className="flex flex-wrap gap-2">
        {areas.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedArea(a.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedArea === a.id ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'}`}
          >
            {a.nome}
          </button>
        ))}
      </div>

      {/* Phase selector */}
      <div className="flex flex-wrap gap-1.5">
        {FASES.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFase(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedFase === f.id ? 'bg-[#1B4332] text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">{faseInfo(selectedFase).label}</p>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {done}/{phaseItems.length} itens
          </span>
        </div>
        <div className="space-y-2">
          {phaseItems.map((item, i) => {
            const key = `${selectedArea}-${selectedFase}-${i}`
            const checked = !!checks[key]
            return (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="mt-0.5 accent-[#1B4332] flex-shrink-0"
                />
                <span className={`text-sm flex-1 ${checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.desc}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                  {item.cat}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Feedbacks ───────────────────────────────────────────────────────────

const TIPO_STYLES: Record<FeedbackTipo, { border: string; badge: string; label: string }> = {
  bug: { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700', label: 'Bug' },
  melhoria: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'Melhoria' },
  desenvolvimento: { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Desenvolvimento' },
  duvida: { border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: 'Dúvida' },
}

const STATUS_COLS: { id: FeedbackStatus; label: string }[] = [
  { id: 'novo', label: 'Novo' },
  { id: 'em_analise', label: 'Em Análise' },
  { id: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
  { id: 'resolvido', label: 'Resolvido' },
]

function nextStatus(s: FeedbackStatus): FeedbackStatus | null {
  const order: FeedbackStatus[] = ['novo', 'em_analise', 'em_desenvolvimento', 'resolvido']
  const i = order.indexOf(s)
  return i < order.length - 1 ? order[i + 1] : null
}

function nextStatusLabel(s: FeedbackStatus) {
  const n = nextStatus(s)
  if (!n) return null
  return STATUS_COLS.find(c => c.id === n)?.label ?? null
}

function TabFeedbacks({ areas }: { areas: Area[] }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(FEEDBACKS_INIT)
  const [showForm, setShowForm] = useState(false)
  const [filterTipo, setFilterTipo] = useState<FeedbackTipo | 'all'>('all')
  const [filterArea, setFilterArea] = useState<string | 'all'>('all')
  const [form, setForm] = useState<Omit<Feedback, 'id' | 'data' | 'status'>>({
    tipo: 'bug', titulo: '', descricao: '', prioridade: 'media', area: areas[0].id,
  })

  function submitFeedback() {
    if (!form.titulo.trim()) return
    setFeedbacks(prev => [...prev, { ...form, id: Date.now().toString(), data: new Date().toISOString().slice(0, 10), status: 'novo' }])
    setForm({ tipo: 'bug', titulo: '', descricao: '', prioridade: 'media', area: areas[0].id })
    setShowForm(false)
  }

  function advance(id: string) {
    setFeedbacks(prev => prev.map(f => {
      if (f.id !== id) return f
      const n = nextStatus(f.status)
      return n ? { ...f, status: n } : f
    }))
  }

  const filtered = feedbacks.filter(f =>
    (filterTipo === 'all' || f.tipo === filterTipo) &&
    (filterArea === 'all' || f.area === filterArea)
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterTipo('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterTipo === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}
          >Todos tipos</button>
          {(Object.keys(TIPO_STYLES) as FeedbackTipo[]).map(t => (
            <button key={t} onClick={() => setFilterTipo(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterTipo === t ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
              {TIPO_STYLES[t].label}
            </button>
          ))}
          <span className="text-gray-300 self-center">·</span>
          <button
            onClick={() => setFilterArea('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterArea === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}
          >Todas áreas</button>
          {areas.map(a => (
            <button key={a.id} onClick={() => setFilterArea(a.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterArea === a.id ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
              {a.nome}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium">
          <Plus size={14} /> Novo Feedback
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Novo Feedback</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Tipo</p>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
                value={form.tipo} onChange={e => setForm(v => ({ ...v, tipo: e.target.value as FeedbackTipo }))}>
                {(Object.keys(TIPO_STYLES) as FeedbackTipo[]).map(t => <option key={t} value={t}>{TIPO_STYLES[t].label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Prioridade</p>
              <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
                value={form.prioridade} onChange={e => setForm(v => ({ ...v, prioridade: e.target.value as Prioridade }))}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Área</p>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
              value={form.area} onChange={e => setForm(v => ({ ...v, area: e.target.value }))}>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Título</p>
            <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332]"
              value={form.titulo} onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
              placeholder="Descreva o problema ou sugestão..." />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Descrição</p>
            <textarea rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B4332] resize-none"
              value={form.descricao} onChange={e => setForm(v => ({ ...v, descricao: e.target.value }))}
              placeholder="Detalhes adicionais..." />
          </div>
          <div className="flex gap-2">
            <button onClick={submitFeedback} className="flex-1 bg-[#1B4332] text-white rounded-xl py-2 text-sm font-medium">Enviar</button>
            <button onClick={() => setShowForm(false)} className="px-4 border border-gray-200 rounded-xl text-sm text-gray-500">Cancelar</button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_COLS.map(col => {
          const cards = filtered.filter(f => f.status === col.id)
          return (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{col.label}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map(f => {
                  const ts = TIPO_STYLES[f.tipo]
                  const next = nextStatusLabel(f.status)
                  const areaName = areas.find(a => a.id === f.area)?.nome ?? f.area
                  return (
                    <div key={f.id} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${ts.border} p-3`}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ts.badge}`}>{ts.label}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${prioridadeBadge(f.prioridade)}`}>{f.prioridade}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 leading-snug mt-1">{f.titulo}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{areaName}</span>
                        <span className="text-[10px] text-gray-400">{f.data}</span>
                      </div>
                      {next && (
                        <button
                          onClick={() => advance(f.id)}
                          className="mt-2 flex items-center gap-1 text-[10px] text-[#1B4332] font-medium hover:underline"
                        >
                          <ChevronRight size={10} /> {next}
                        </button>
                      )}
                    </div>
                  )
                })}
                {cards.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Nenhum</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'visao' | 'areas' | 'cronograma' | 'checklists' | 'feedbacks'

const TABS: { id: Tab; label: string }[] = [
  { id: 'visao', label: 'Visão Geral' },
  { id: 'areas', label: 'Áreas' },
  { id: 'cronograma', label: 'Cronograma' },
  { id: 'checklists', label: 'Checklists' },
  { id: 'feedbacks', label: 'Feedbacks' },
]

export function ImplantacaoPage() {
  const [tab, setTab] = useState<Tab>('visao')
  const [areas, setAreas] = useState<Area[]>(AREAS_INIT)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-[#1B4332] text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'visao' && <TabVisaoGeral areas={areas} />}
      {tab === 'areas' && <TabAreas areas={areas} setAreas={setAreas} />}
      {tab === 'cronograma' && <TabCronograma areas={areas} />}
      {tab === 'checklists' && <TabChecklists areas={areas} />}
      {tab === 'feedbacks' && <TabFeedbacks areas={areas} />}
    </div>
  )
}
