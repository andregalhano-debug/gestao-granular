import { useState } from 'react'
import { Settings, Users, Shield, Edit2, Check, Lock, Trash2, FileText, LayoutGrid } from 'lucide-react'
import { useAuth, ALL_USERS } from '../hooks/useAuth'
import { useChangeLog } from '../hooks/useLocalData'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Role = 'admin' | 'editor' | 'viewer'
type ActiveTab = 'users' | 'security' | 'log'

export interface UserConfig {
  email: string
  name: string
  initials: string
  role: Role
  active: boolean
  canManageUsers: boolean
  canDeleteData: boolean
  canAccessSettings: boolean
  allowedMenus?: string[]   // undefined = all allowed
  allowedAreas?: string[]   // undefined = all allowed
}

const ALL_MENUS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/tarefas', label: 'Tarefas' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/docs', label: 'Docs & Links' },
  { to: '/settings', label: 'Configurações' },
]

const ALL_AREAS = [
  { key: 'produto', label: '⚙️ Produto' },
  { key: 'comercial', label: '💼 Comercial' },
  { key: 'juridico', label: '⚖️ Jurídico' },
  { key: 'financeiro', label: '💰 Financeiro' },
  { key: 'geral', label: '📌 Geral' },
  { key: 'marketing', label: '📣 Marketing' },
  { key: 'operacoes', label: '🔧 Operações' },
]

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

const LOG_ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

export function initConfigs(): UserConfig[] {
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
    allowedMenus: undefined,
    allowedAreas: undefined,
  }))
}

export function saveConfigs(configs: UserConfig[]) {
  localStorage.setItem('gg_user_configs', JSON.stringify(configs))
}

// ─────────────────────────────────────────────
// Inline EyeOff
// ─────────────────────────────────────────────
function EyeOff({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// Password change inline form
// ─────────────────────────────────────────────
function PasswordSection({ userEmail }: { userEmail: string }) {
  const [showForm, setShowForm] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!currentPw) { setError('Digite a senha atual.'); return }
    if (newPw.length < 6) { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (newPw !== confirmPw) { setError('As senhas não coincidem.'); return }

    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('gg_passwords') ?? '{}') } catch { return {} }
    })() as Record<string, string>
    const STATIC_PW = 'granular2026'
    const currentStored = stored[userEmail]
    const expectedPw = currentStored ?? STATIC_PW
    if (currentPw !== expectedPw) { setError('Senha atual incorreta.'); return }

    stored[userEmail] = newPw
    localStorage.setItem('gg_passwords', JSON.stringify(stored))
    setSuccess(true)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => { setSuccess(false); setShowForm(false) }, 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Lock size={16} className="text-[#1B4332]" /> Senha
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#1B4332]/30 hover:text-[#1B4332] transition-colors">
            Alterar senha
          </button>
        )}
      </div>

      {!showForm ? (
        <p className="text-sm text-gray-500">Senha atual: <span className="font-mono tracking-widest text-gray-700">••••••••</span></p>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Senha atual</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nova senha</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar nova senha</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]/50" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1.5"><Check size={12} /> Senha alterada com sucesso!</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 bg-[#1B4332] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
              <Check size={13} /> Salvar
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); setCurrentPw(''); setNewPw(''); setConfirmPw('') }}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export function SettingsPage() {
  const { user } = useAuth()
  const [log] = useChangeLog()
  const [configs, setConfigs] = useState<UserConfig[]>(initConfigs)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserConfig>>({})
  const [activeTab, setActiveTab] = useState<ActiveTab>('users')
  const [saved, setSaved] = useState(false)

  const isAdmin = user?.role === 'admin'

  const startEdit = (cfg: UserConfig) => {
    setEditingEmail(cfg.email)
    setEditForm({
      ...cfg,
      allowedMenus: cfg.allowedMenus ?? ALL_MENUS.map(m => m.to),
      allowedAreas: cfg.allowedAreas ?? ALL_AREAS.map(a => a.key),
    })
  }

  const cancelEdit = () => {
    setEditingEmail(null)
    setEditForm({})
  }

  const saveEdit = () => {
    const form = { ...editForm }
    // If all menus are selected, store undefined (all allowed)
    if (form.allowedMenus && form.allowedMenus.length === ALL_MENUS.length) {
      form.allowedMenus = undefined
    }
    // If all areas are selected, store undefined (all allowed)
    if (form.allowedAreas && form.allowedAreas.length === ALL_AREAS.length) {
      form.allowedAreas = undefined
    }
    const updated = configs.map(c => c.email === editingEmail ? { ...c, ...form } as UserConfig : c)
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

  const toggleMenu = (to: string) => {
    const current = (editForm.allowedMenus ?? ALL_MENUS.map(m => m.to))
    const next = current.includes(to) ? current.filter(m => m !== to) : [...current, to]
    setEditForm(f => ({ ...f, allowedMenus: next }))
  }

  const toggleArea = (key: string) => {
    const current = (editForm.allowedAreas ?? ALL_AREAS.map(a => a.key))
    const next = current.includes(key) ? current.filter(a => a !== key) : [...current, key]
    setEditForm(f => ({ ...f, allowedAreas: next }))
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

  const sortedLog = [...log].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

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
        <button onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Users size={14} /> Usuários
        </button>
        <button onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Shield size={14} /> Segurança
        </button>
        <button onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'log' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <FileText size={14} /> Log de alterações
        </button>
      </div>

      {/* ── USERS TAB ──────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Usuários do sistema ({configs.length})</p>
          {configs.map(cfg => (
            <div key={cfg.email} className={`bg-white rounded-xl border p-4 transition-all ${!cfg.active ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:border-gray-200'}`}>
              {editingEmail === cfg.email ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${OWNER_COLORS[cfg.initials] ?? 'bg-gray-100 text-gray-600'}`}>
                      {cfg.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cfg.name}</p>
                      <p className="text-xs text-gray-400">{cfg.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Função</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['admin', 'editor', 'viewer'] as Role[]).map(r => (
                        <button key={r} onClick={() => setEditForm(f => ({ ...f, role: r, canManageUsers: r === 'admin', canDeleteData: r === 'admin', canAccessSettings: r === 'admin' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${editForm.role === r ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'}`}>
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                    {editForm.role && <p className="text-[10px] text-gray-400 mt-1">{ROLE_DESC[editForm.role as Role]}</p>}
                  </div>

                  {/* Specific permissions */}
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-1.5">Permissões específicas</p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canManageUsers', label: 'Gerenciar usuários' },
                        { key: 'canDeleteData', label: 'Excluir dados' },
                        { key: 'canAccessSettings', label: 'Acessar configurações' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!(editForm as Record<string, unknown>)[key]}
                            onChange={e => setEditForm(f => ({ ...f, [key]: e.target.checked }))}
                            className="rounded accent-[#1B4332]" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Menu permissions */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutGrid size={13} className="text-[#1B4332]" />
                      <p className="text-[10px] font-medium text-gray-500 uppercase">Menus visíveis</p>
                      {editForm.role === 'admin' && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Admin vê tudo</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ALL_MENUS.map(({ to, label }) => {
                        const allowed = editForm.allowedMenus ?? ALL_MENUS.map(m => m.to)
                        const checked = allowed.includes(to)
                        return (
                          <label key={to} className={`flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-lg border transition-colors ${checked ? 'bg-[#1B4332]/5 border-[#1B4332]/20' : 'border-gray-100 bg-gray-50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleMenu(to)}
                              className="rounded accent-[#1B4332]" />
                            <span className="text-xs text-gray-700">{label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setEditForm(f => ({ ...f, allowedMenus: ALL_MENUS.map(m => m.to) }))}
                      className="mt-1.5 text-[10px] text-gray-400 hover:text-[#1B4332] transition-colors">
                      Selecionar todos
                    </button>
                  </div>

                  {/* Area permissions (Tarefas) */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-2">Áreas visíveis em Tarefas</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ALL_AREAS.map(({ key, label }) => {
                        const allowed = editForm.allowedAreas ?? ALL_AREAS.map(a => a.key)
                        const checked = allowed.includes(key)
                        return (
                          <label key={key} className={`flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-lg border transition-colors ${checked ? 'bg-[#1B4332]/5 border-[#1B4332]/20' : 'border-gray-100 bg-gray-50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleArea(key)}
                              className="rounded accent-[#1B4332]" />
                            <span className="text-xs text-gray-700">{label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setEditForm(f => ({ ...f, allowedAreas: ALL_AREAS.map(a => a.key) }))}
                      className="mt-1.5 text-[10px] text-gray-400 hover:text-[#1B4332] transition-colors">
                      Selecionar todas
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#1B4332] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                      <Check size={13} /> Salvar
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${OWNER_COLORS[cfg.initials] ?? 'bg-gray-100 text-gray-600'}`}>
                    {cfg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{cfg.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[cfg.role]}`}>{ROLE_LABELS[cfg.role]}</span>
                      {!cfg.active && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Inativo</span>}
                      {cfg.email === user?.email && <span className="text-[10px] text-[#1B4332] bg-[#1B4332]/10 px-1.5 py-0.5 rounded-full">Você</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{cfg.email}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {cfg.canManageUsers && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Shield size={9} /> Usuários</span>}
                      {cfg.canDeleteData && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Trash2 size={9} /> Excluir</span>}
                      {cfg.canAccessSettings && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Settings size={9} /> Config</span>}
                      {cfg.allowedMenus && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <LayoutGrid size={9} /> {cfg.allowedMenus.length}/{ALL_MENUS.length} menus
                        </span>
                      )}
                      {cfg.allowedAreas && (
                        <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                          <LayoutGrid size={9} /> {cfg.allowedAreas.length}/{ALL_AREAS.length} áreas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cfg.email !== user?.email && (
                      <button onClick={() => toggleActive(cfg.email)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
                        title={cfg.active ? 'Desativar' : 'Ativar'}>
                        {cfg.active ? (
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </button>
                    )}
                    <button onClick={() => startEdit(cfg)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#1B4332]/30 hover:text-[#1B4332] transition-colors flex items-center gap-1">
                      <Edit2 size={12} /> Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SECURITY TAB ──────────────────────────── */}
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
                  <p className="text-xs text-blue-600 mt-0.5">Itens marcados como privados são visíveis somente para o usuário que os criou.</p>
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
                  <p className="text-xs text-green-600 mt-0.5">Informações armazenadas localmente no navegador. Histórico de exclusões mantido para recuperação.</p>
                </div>
              </div>
            </div>
          </div>

          <PasswordSection userEmail={user?.email ?? ''} />
        </div>
      )}

      {/* ── LOG TAB ──────────────────────────── */}
      {activeTab === 'log' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Log de alterações ({sortedLog.length})</p>
            {sortedLog.length > 0 && (
              <span className="text-[10px] text-gray-400">Últimas {Math.min(sortedLog.length, 200)} entradas</span>
            )}
          </div>

          {sortedLog.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <FileText size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLog.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LOG_ACTION_COLOR[entry.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {entry.action === 'create' ? 'Criou' : entry.action === 'update' ? 'Editou' : entry.action === 'delete' ? 'Removeu' : entry.action}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{entry.detail}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">{entry.user}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400 font-medium">{entry.entity}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">
                        {format(parseISO(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
