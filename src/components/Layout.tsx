import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Users, Calendar, FolderOpen, LogOut, Menu, X, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

const nav = [
  { to: '/', icon: Home, label: 'Home', desc: 'Prioridades e agenda' },
  { to: '/tarefas', icon: CheckSquare, label: 'Tarefas', desc: 'Checklist da equipe' },
  { to: '/clientes', icon: Users, label: 'Clientes', desc: 'Pipeline comercial' },
  { to: '/agenda', icon: Calendar, label: 'Agenda', desc: 'Reuniões e eventos' },
  { to: '/docs', icon: FolderOpen, label: 'Docs', desc: 'Links e documentos' },
  { to: '/settings', icon: Settings, label: 'Configurações', desc: 'Usuários e permissões' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/tarefas': 'Tarefas',
  '/clientes': 'Clientes',
  '/agenda': 'Agenda',
  '/docs': 'Docs & Links',
  '/settings': 'Configurações',
}

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Gestão Granular'
  const sidebarW = collapsed ? 'w-16' : 'w-60'
  const mlMain = collapsed ? 'lg:ml-16' : 'lg:ml-60'

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className={`hidden lg:flex flex-col ${sidebarW} bg-[#1B4332] min-h-screen fixed left-0 top-0 bottom-0 z-20 transition-all duration-200`}>
        {/* Logo + collapse button */}
        <div className={`${collapsed ? 'px-3 py-5 justify-center' : 'px-6 py-6'} border-b border-white/10 flex items-center`}>
          {!collapsed && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">G</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Gestão Granular</p>
                <p className="text-white/40 text-[10px]">Grupo Granular</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="text-white font-black text-lg">G</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-1`}>
          {nav.map(({ to, icon: Icon, label, desc }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all group ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-white flex-shrink-0' : 'text-white/50 group-hover:text-white/80 flex-shrink-0'} />
                  {!collapsed && (
                    <div>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className={`text-[10px] leading-tight ${isActive ? 'text-white/60' : 'text-white/30 group-hover:text-white/40'}`}>{desc}</p>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + collapse toggle */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 border-t border-white/10 space-y-2`}>
          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center py-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm" title={user?.name}>
                {user?.initials}
              </div>
              <button onClick={signOut} title="Sair" className="text-white/40 hover:text-white transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                {user?.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
              </div>
              <button onClick={signOut} title="Sair" className="text-white/40 hover:text-white transition-colors flex-shrink-0">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#1B4332] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="text-white/80 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm">{pageTitle}</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
          {user?.initials}
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#1B4332] z-40 flex flex-col">
            <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <span className="text-white font-black">G</span>
                </div>
                <p className="text-white font-bold text-sm">Gestão Granular</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {nav.map(({ to, icon: Icon, label, desc }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-[10px] text-white/40">{desc}</p>
                  </div>
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                  {user?.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                </div>
                <button onClick={signOut} className="text-white/40 hover:text-white">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN AREA ── */}
      <div className={`flex-1 ${mlMain} flex flex-col min-h-screen transition-all duration-200`}>
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 flex items-center justify-center font-bold text-[#1B4332] text-sm">
              {user?.initials}
            </div>
            <button onClick={signOut} className="text-gray-400 hover:text-gray-700 transition-colors ml-1" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 py-5 mt-12 lg:mt-0 lg:px-8 lg:py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20">
        {nav.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#1B4332]' : 'text-gray-400'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="lg:hidden h-16" />
    </div>
  )
}
