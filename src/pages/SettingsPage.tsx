import { useState } from 'react'
import { Settings, Users, Shield, Edit2, Check, Lock, Eye, Trash2 } from 'lucide-react'
import { useAuth, ALL_USERS } from '../hooks/useAuth'

type Role = 'admin' | 'editor' | 'viewer'

interface UserConfig {
  email: string
  name: string
  initials: string
  role: Role
  active: boolean
  canManageUsers: boolean
  canDeleteData: boolean
  canAccessSettings: boolean
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

const ROLE_DESC: Record<Role, string> = {
  admin: 'Acesso total ao sistema',
  editor: 'Pode criar e editar dados',
  viewer: 'Somente leitura',
}

const ROLE_COLOR: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const OWNER_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700',
  E: 'bg-purple-100 text-purple-700',
  G: 'bg-orange-100 text-orange-700',
  D: 'bg-pink-100 text-pink-700',
}

function initConfigs(): UserConfig[] {
  try {
    const stored = localStorage.getItem('gg_user_configs')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return ALL_USERS.map(u => ({
    email: u.email,
    name: u.name,
    initials: u.initials,
    role: u.role,
    active: true,
    canManageUsers: u.role === 'admin',
    canDeleteData: u.role === 'admin',
    canAccessSettings: u.role === 'admin',
  }))
}

function saveConfigs(configs: UserConfig[]) {
  localStorage.setItem('gg_user_configs', JSON.stringify(configs))
}

export function SettingsPage() {
  const { user } = useAuth()
  const [configs, setConfigs] = useState<UserConfig[]>(initConfigs)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserConfig>>({})
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users')
  const [saved, setSaved] = useState(false)

  const isAdmin = user?.role === 'admin'

  const startEdit = (cfg: UserConfig) => {
    setEditingEmail(cfg.email)
    setEditForm({ ...cfg })
  }

  const cancelEdit = () => {
    setEditingEmail(null)
    setEditForm({})
  }

  const saveEdit = () => {
    const updated = configs.map(c => c.email === editingEmail ? { ...c, ...editForm } as UserConfig : c)
    setConfigs(updated)
    saveConfigs(updated)
    setEditingEmail(null)
    setEditForm({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleActive = (email: string) => {
    if (email === user?.email) return
    const updated = configs.map(c => c.email === email ? { ...c, active: !c.active } : c)
    setConfigs(updated)
    saveConfigs(updated)
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock size={40} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-1">Acesso restrito</h2>
        <p className="text-sm text-gray-400">Apenas administradores podem acessar as configurações.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 flex items-center justify-center">
            <Settings size={20} className="text-[#1B4332]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configurações</h2>
            <p className="text-xs text-gray-400">Gerencie usuários e permissões do sistema</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
            <Check size={14} /> Salvo
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          <Users size={14} /> Usuários
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          <Shield size={14} /> Segurança
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Usuários do sistema ({configs.length})</p>
          {configs.map(cfg => (
            <div key={cfg.email} className={`bg-white rounded-xl border p-4 transition-all ${!cfg.active ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:border-gray-200'}`}>
              {editingEmail === cfg.email ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${OWNER_COLORS[cfg.initials] ?? 'bg-gray-100 text-gray-600'}`}>
                      {cfg.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cfg.name}</p>
                      <p className="text-xs text-gray-400">{cfg.email}</p>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Função</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['admin', 'editor', 'viewer'] as Role[]).map(r => (
                        <button
                          key={r}
                          onClick={() => setEditForm(f => ({ ...f, role: r, canManageUsers: r === 'admin', canDeleteData: r === 'admin', canAccessSettings: r === 'admin' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${editForm.role === r ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                    {editForm.role && <p className="text-[10px] text-gray-400 mt-1">{ROLE_DESC[editForm.role as Role]}</p>}
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Permissões específicas</p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canManageUsers', label: 'Gerenciar usuários' },
                        { key: 'canDeleteData', label: 'Excluir dados' },
                        { key: 'canAccessSettings', label: 'Acessar configurações' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(editForm as Record<string, unknown>)[key]}
                            onChange={e => setEditForm(f => ({ ...f, [key]: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                      <Check size={13} /> Salvar
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${OWNER_COLORS[cfg.initials] ?? 'bg-gray-100 text-gray-600'}`}>
                    {cfg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{cfg.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[cfg.role]}`}>{ROLE_LABELS[cfg.role]}</span>
                      {!cfg.active && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Inativo</span>}
                      {cfg.email === user?.email && <span className="text-[10px] text-[#1B4332] bg-[#1B4332]/10 px-1.5 py-0.5 rounded-full">Você</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{cfg.email}</p>
                    <div className="flex gap-2 mt-1">
                      {cfg.canManageUsers && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Shield size={9} /> Usuários</span>}
                      {cfg.canDeleteData && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Trash2 size={9} /> Excluir</span>}
                      {cfg.canAccessSettings && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Settings size={9} /> Config</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cfg.email !== user?.email && (
                      <button
                        onClick={() => toggleActive(cfg.email)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
                        title={cfg.active ? 'Desativar' : 'Ativar'}
                      >
                        {cfg.active ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(cfg)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1B4332]/30 hover:text-[#1B4332] transition-colors flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Shield size={16} className="text-[#1B4332]" /> Política de acesso
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Modo Particular</p>
                  <p className="text-xs text-blue-600 mt-0.5">Itens marcados como privados são visíveis somente para o usuário que os criou. Os demais membros não veem essas anotações.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Autenticação</p>
                  <p className="text-xs text-amber-600 mt-0.5">Login com e-mail e senha. Sessão salva localmente no navegador. Faça logout ao usar computadores compartilhados.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Dados</p>
                  <p className="text-xs text-green-600 mt-0.5">Informações armazenadas localmente no navegador. Histórico de exclusões mantido por 30 dias para recuperação.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Lock size={16} className="text-[#1B4332]" /> Senhas
            </div>
            <p className="text-sm text-gray-500">Senha padrão atual: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">granular2026</code></p>
            <p className="text-xs text-gray-400 mt-1">Para alterar senhas individuais, contate o administrador do sistema.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline EyeOff icon since it may not be in the version
function EyeOff({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
