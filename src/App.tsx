import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { TarefasPage } from './pages/TarefasPage'
import { ClientesPage } from './pages/ClientesPage'
import { AgendaPage } from './pages/AgendaPage'
import { DocsPage } from './pages/DocsPage'
import { ImplantacaoPage } from './pages/ImplantacaoPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="tarefas" element={<TarefasPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="implantacao" element={<ImplantacaoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
