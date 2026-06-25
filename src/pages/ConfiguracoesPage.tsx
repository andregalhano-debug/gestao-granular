import { useState } from 'react'
import { Users, Shield, Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from 'lucide-react'

interface UsuarioConfig {
  id: string
  nome: string
  email: string
  senha: string
  perfil: 'admin' | 'editor' | 'visualizador'
  ativo: boolean
}

interface Permissao {
  modulo: string
  visualizar: boolean
  editar: boolean
  admin: boolean
}

const PERFIS: Record<UsuarioConfig['perfil'], { label: string; cor: string; permissoes: Permissao[] }> = {
  admin: {
    label: 'Administrador',
    cor: 'bg-red-100 text-red-700',
    permissoes: [
      { modulo: 'Home', visualizar: true, editar: true, admin: true },
      { modulo: 'Tarefas', visualizar: true, editar: true, admin: true },
      { modulo: 'Clientes', visualizar: true, editar: true, admin: true },
      { modulo: 'Agenda', visualizar: true, editar: true, admin: true },
      { modulo: 'Docs', visualizar: true, editar: true, admin: true },
      { modulo: 'Gestão de Implantação', visualizar: true, editar: true, admin: true },
      { modulo: 'Configurações', visualizar: true, editar: true, admin: true },
    ],
  },
  editor: {
    label: 'Editor',
    cor: 'bg-blue-100 text-blue-700',
    permissoes: [
      { modulo: 'Home', visualizar: true, editar: true, admin: false },
      { modulo: 'Tarefas', visualizar: true, editar: true, admin: false },
      { modulo: 'Clientes', visualizar: true, editar: true, admin: false },
      { modulo: 'Agenda', visualizar: true, editar: true, admin: false },
      { modulo: 'Docs', visualizar: true, editar: true, admin: false },
      { modulo: 'Gestão de Implantação', visualizar: true, editar: true, admin: false },
      { modulo: 'Configurações', visualizar: false, editar: false, admin: false },
    ],
  },
  visualizador: {
    label: 'Visualizador',
    cor: 'bg-gray-100 text-gray-600',
    permissoes: [
      { modulo: 'Home', visualizar: true, editar: false, admin: false },
      { modulo: 'Tarefas', visualizar: true, editar: false, admin: false },
      { modulo: 'Clientes', visualizar: true, editar: false, admin: false },
      { modulo: 'Agenda', visualizar: true, editar: false, admin: false },
      { modulo: 'Docs', visualizar: true, editar: false, admin: false },
      { modulo: 'Gestão de Implantação', visualizar: true, editar: false, admin: false },
      { modulo: 'Configurações', visualizar: false, editar: false, admin: false },
    ],
  },
}

const USUARIOS_INICIAIS: UsuarioConfig[] = [
  { id: '1', nome: 'André', email: 'andre.galhano@grupogranular.com.br', senha: 'granular2026', perfil: 'admin', ativo: true },
  { id: '2', nome: 'Eduardo', email: 'eduardo.lage@grupogranular.com.br', senha: 'granular2026', perfil: 'admin', ativo: true },
  { id: '3', nome: 'Gabriel', email: 'gabriel.rocha@grupogranular.com.br', senha: 'granular2026', perfil: 'editor', ativo: true },
  { id: '4', nome: 'Daniela', email: 'daniela.neves@grupogranular.com.br', senha: 'granular2026', perfil: 'editor', ativo: true },
]

const VAZIO: Omit<UsuarioConfig, 'id'> = {
  nome: '', email: '', senha: 'granular2026', perfil: 'editor', ativo: true,
}

export function ConfiguracoesPage() {
  const [tab, setTab] = useState<'usuarios' | 'permissoes'>('usuarios')
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>(USUARIOS_INICIAIS)
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null)
  const [editando, setEditando] = useState<UsuarioConfig | null>(null)
  const [form, setForm] = useState<Omit<UsuarioConfig, 'id'>>(VAZIO)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [perfilSelecionado, setPerfilSelecionado] = useState<UsuarioConfig['perfil']>('admin')

  function abrirNovo() {
    setForm(VAZIO)
    setModal('novo')
    setMostrarSenha(false)
  }

  function abrirEditar(u: UsuarioConfig) {
    setEditando(u)
    setForm({ nome: u.nome, email: u.email, senha: u.senha, perfil: u.perfil, ativo: u.ativo })
    setModal('editar')
    setMostrarSenha(false)
  }

  function fecharModal() {
    setModal(null)
    setEditando(null)
    setForm(VAZIO)
  }

  function salvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) return
    if (modal === 'novo') {
      setUsuarios(prev => [...prev, { ...form, id: Date.now().toString() }])
    } else if (modal === 'editar' && editando) {
      setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...form, id: u.id } : u))
    }
    fecharModal()
  }

  function excluir(id: string) {
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setConfirmarExclusao(null)
  }

  function toggleAtivo(id: string) {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u))
  }

  const tabs = [
    { id: 'usuarios' as const, label: 'Usuários', icon: Users },
    { id: 'permissoes' as const, label: 'Permissões de Acesso', icon: Shield },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── USUÁRIOS ── */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{usuarios.length} usuário(s) cadastrado(s)</p>
            <button
              onClick={abrirNovo}
              className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-medium"
            >
              <Plus size={15} /> Novo usuário
            </button>
          </div>

          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-4 ${u.ativo ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 flex items-center justify-center font-bold text-[#1B4332] text-sm flex-shrink-0">
                  {u.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${PERFIS[u.perfil].cor}`}>
                  {PERFIS[u.perfil].label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleAtivo(u.id)}
                    title={u.ativo ? 'Desativar' : 'Ativar'}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {u.ativo ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => abrirEditar(u)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Edit2 size={14} />
                  </button>
                  {confirmarExclusao === u.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => excluir(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setConfirmarExclusao(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmarExclusao(u.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PERMISSÕES ── */}
      {tab === 'permissoes' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(Object.keys(PERFIS) as UsuarioConfig['perfil'][]).map(p => (
              <button
                key={p}
                onClick={() => setPerfilSelecionado(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  perfilSelecionado === p
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'border-gray-200 text-gray-600 bg-white hover:border-[#1B4332]/30'
                }`}
              >
                {PERFIS[p].label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Módulo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visualizar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Editar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrar</th>
                </tr>
              </thead>
              <tbody>
                {PERFIS[perfilSelecionado].permissoes.map((p, i) => (
                  <tr key={p.modulo} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.modulo}</td>
                    <td className="px-4 py-3 text-center">
                      {p.visualizar
                        ? <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full"><Check size={12} className="text-green-600" /></span>
                        : <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full"><X size={12} className="text-gray-400" /></span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.editar
                        ? <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full"><Check size={12} className="text-green-600" /></span>
                        : <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full"><X size={12} className="text-gray-400" /></span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.admin
                        ? <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full"><Check size={12} className="text-green-600" /></span>
                        : <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full"><X size={12} className="text-gray-400" /></span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400">As permissões são definidas por perfil e aplicadas a todos os usuários com aquele perfil.</p>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={fecharModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">{modal === 'novo' ? 'Novo usuário' : 'Editar usuário'}</h3>
                <button onClick={fecharModal} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
                  <input
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4332]"
                    placeholder="email@grupogranular.com.br"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={form.senha}
                      onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#1B4332]"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Perfil</label>
                  <div className="flex gap-2">
                    {(Object.keys(PERFIS) as UsuarioConfig['perfil'][]).map(p => (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, perfil: p }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.perfil === p ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {PERFIS[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                <button onClick={salvar} className="flex-1 bg-[#1B4332] text-white rounded-xl py-2 text-sm font-medium">
                  Salvar
                </button>
                <button onClick={fecharModal} className="px-4 border border-gray-200 rounded-xl text-sm text-gray-500">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
