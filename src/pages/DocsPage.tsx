import { useState } from 'react'
import { ExternalLink, FolderOpen, FileText, Search } from 'lucide-react'

const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1uWxDdAQCwP8o9iUmmzVWp_LWLTC5qb-7'

const docs = [
  {
    category: 'Google Drive',
    emoji: '📁',
    items: [
      { label: 'Pasta Principal — Grupo Granular', url: DRIVE_ROOT, icon: FolderOpen },
    ],
  },
  {
    category: 'Apresentações',
    emoji: '📊',
    items: [
      { label: 'Granular — Pitch Investidores', url: DRIVE_ROOT, icon: FileText },
      { label: 'Granular — Proposta Nova', url: DRIVE_ROOT, icon: FileText },
      { label: 'Granular — Apresentação Sócio', url: DRIVE_ROOT, icon: FileText },
    ],
  },
  {
    category: 'Jurídico',
    emoji: '⚖️',
    items: [
      { label: 'CNAEs Ponto Gestão (10 definidos)', url: DRIVE_ROOT, icon: FileText },
      { label: 'Contrato Consultoria — modelo', url: DRIVE_ROOT, icon: FileText },
    ],
  },
  {
    category: 'Comercial',
    emoji: '📈',
    items: [
      { label: 'Diagnóstico 360° — Roteiro', url: 'https://docs.google.com/document/d/1IEUuSO4nPYgzrOVgTntCE2_fm1N-UE_Z/edit', icon: FileText },
      { label: 'Checklist Operacional', url: 'https://docs.google.com/document/d/1E5BXVxtuGSrqs7yI1CLcGhCm0CfHX5a4/edit', icon: FileText },
    ],
  },
  {
    category: 'Benchmarks iFood',
    emoji: '📋',
    items: [
      { label: 'ROI CI: 4–6% | Clube: >10% | Frete: <6%', url: '#', icon: FileText },
    ],
  },
]

export function DocsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const q = search.toLowerCase().trim()

  const filtered = docs
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesSearch = !q || item.label.toLowerCase().includes(q) || section.category.toLowerCase().includes(q)
        const matchesCategory = !activeCategory || section.category === activeCategory
        return matchesSearch && matchesCategory
      }),
    }))
    .filter(section => section.items.length > 0)

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Docs & Links</h1>
        <span className="text-xs text-gray-400">{docs.reduce((a, s) => a + s.items.length, 0)} documentos</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar documento ou categoria..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4332]/50"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${!activeCategory ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}>
          Todos
        </button>
        {docs.map(s => (
          <button
            key={s.category}
            onClick={() => setActiveCategory(s.category === activeCategory ? null : s.category)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${activeCategory === s.category ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}>
            {s.emoji} {s.category}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum documento encontrado para "{search}"</p>
        </div>
      ) : (
        filtered.map(section => (
          <section key={section.category}>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {section.emoji} {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map(item => {
                const highlight = q && item.label.toLowerCase().includes(q)
                return (
                  <a
                    key={item.label}
                    href={item.url}
                    target={item.url !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between gap-3 bg-white rounded-xl border px-4 py-3 hover:border-[#1B4332]/30 transition-colors group
                      ${highlight ? 'border-[#1B4332]/25 bg-[#1B4332]/2' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon size={15} className="text-[#1B4332] flex-shrink-0" />
                      <p className={`text-sm truncate ${highlight ? 'text-[#1B4332] font-medium' : 'text-gray-800'}`}>
                        {item.label}
                      </p>
                    </div>
                    {item.url !== '#' && (
                      <ExternalLink size={13} className="text-gray-300 group-hover:text-[#1B4332] flex-shrink-0 transition-colors" />
                    )}
                  </a>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
