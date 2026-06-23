import { NavLink, Outlet } from 'react-router-dom'
import { Home, CheckSquare, Users, Calendar, FolderOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const nav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/docs', icon: FolderOpen, label: 'Docs' },
]

export function Layout() {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-[#1B4332] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-bold text-base tracking-tight">Gestão Granular</span>
        <button
          onClick={signOut}
          className="text-xs text-white/70 hover:text-white flex items-center gap-1"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {user?.initials}
          </div>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        {nav.map(({ to, icon: Icon, label }) => (
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
    </div>
  )
}
