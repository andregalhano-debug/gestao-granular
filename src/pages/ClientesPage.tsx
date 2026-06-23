import { useState } from 'react'
import { useClients } from '../hooks/useLocalData'
import { ChevronRight, TrendingUp, CheckCircle, User, X } from 'lucide-react'
import type { Client } from '../types'

const STAGE_CONFIG = {
  prospecto:   { label: 'Prospecto',   color: 'bg-gray-100 text-gray-600',   icon: '🎯' },
  contato:     { label: 'Contato',     color: 'bg-blue-100 text-blue-700',   icon: '📞' },
  proposta:    { label: 'Proposta',    color: 'bg-yellow-100 text-yellow-700', icon: '📄' },
  negociacao:  { label: 'Negociação',  color: 'bg-orange-100 text-orange-700', icon: '🤝' },
  ativo:       { label: 'Ativo',       color: 'bg-green-100 text-green-700',  icon: '✅' },
  pausado:     { label: 'Pausado',     color: 'bg-red-100 text-red-700',      icon: '⏸️' },
}

export function ClientesPage() {
  const [clients, setClients] = useClients()
  const [selected, setSelected] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<Client['stage'] | 'all'>('all')

  const filtered = clients.filter(c => filterStage === 'all' || c.stage === filterStage)
  const active = filtered.filter(c => c.stage === 'ativo').length
  const pipeline = filtered.filter(c => ['contato','proposta','negociacao'].includes(c.stage)).length

  const updateStage = (id: string, stage: Client['stage']) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, stage, last_update: new Date().toISOString() } : c))
  }

  const selectedClient = clients.find(c => c.id === selected)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> {active} ativos</span>
          <span className="flex items-center gap-1"><TrendingUp size={12} className="text-orange-500" /> {pipeline} pipeline</span>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStage('all')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filterStage === 'all' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}
        >
          Todos
        </button>
        {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStage(s)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${filterStage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white'}`}
          >
            {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id === selected ? null : c.id)}
            className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-[#1B4332]/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STAGE_CONFIG[c.stage].color}`}>
                  {STAGE_CONFIG[c.stage].label}
                </span>
              </div>
              {c.next_action && (
                <p className="text-xs text-gray-500 truncate">→ {c.next_action}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {c.revenue_potential && (
                <span className="text-[10px] text-green-600 font-medium hidden sm:block">{c.revenue_potential}</span>
              )}
              <span className="text-[10px] text-gray-400 font-medium">{c.owner}</span>
              <ChevronRight size={14} className={`text-gray-300 transition-transform ${selected === c.id ? 'rotate-90' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Detail drawer */}
      {selectedClient && (
        <div className="bg-white rounded-2xl border border-[#1B4332]/15 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{selectedClient.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400"><X size={16} /></button>
          </div>

          <div className="space-y-2">
            {selectedClient.contact_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={13} /> {selectedClient.contact_name}
              </div>
            )}
            <p className="text-sm text-gray-700 leading-relaxed">{selectedClient.notes}</p>
            {selectedClient.next_action && (
              <div className="bg-[#1B4332]/5 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-[#1B4332] mb-0.5">Próxima ação</p>
                <p className="text-sm text-gray-800">{selectedClient.next_action}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Alterar stage</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STAGE_CONFIG) as Client['stage'][]).map(s => (
                <button
                  key={s}
                  onClick={() => updateStage(selectedClient.id, s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    selectedClient.stage === s ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
