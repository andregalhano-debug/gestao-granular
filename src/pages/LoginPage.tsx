import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn } from 'lucide-react'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = signIn(email, password)
    setLoading(false)
    if (ok) {
      navigate('/')
    } else {
      setError('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4332] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
            <span className="text-3xl font-black text-white">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão Granular</h1>
          <p className="text-white/60 text-sm mt-1">Painel de gestão do grupo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="seu@grupogranular.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/60"
            autoComplete="current-password"
          />
          {error && <p className="text-red-300 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white text-[#1B4332] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <LogIn size={16} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-white/30 text-xs text-center mt-8">
          Grupo Granular · Acesso restrito aos sócios
        </p>
      </div>
    </div>
  )
}
