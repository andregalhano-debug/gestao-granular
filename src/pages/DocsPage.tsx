import { ExternalLink, FolderOpen, FileText } from 'lucide-react'

const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1uWxDdAQCwP8o9iUmmzVWp_LWLTC5qb-7'

const docs = [
  {
    category: '📁 Google Drive',
    items: [
      { label: 'Pasta Principal — Grupo Granular', url: DRIVE_ROOT, icon: FolderOpen },
    ]
  },
  {
    category: '📊 Apresentações',
    items: [
      { label: 'Granular — Pitch Investidores', url: DRIVE_ROOT, icon: FileText },
      { label: 'Granular — Proposta Nova', url: DRIVE_ROOT, icon: FileText },
      { label: 'Granular — Apresentação Sócio', url: DRIVE_ROOT, icon: FileText },
    ]
  },
  {
    category: '⚖️ Jurídico',
    items: [
      { label: 'CNAEs Ponto Gestão (10 definidos)', url: DRIVE_ROOT, icon: FileText },
      { label: 'Contrato Consultoria — modelo', url: DRIVE_ROOT, icon: FileText },
    ]
  },
  {
    category: '📈 Comercial',
    items: [
      { label: 'Diagnóstico 360° — Roteiro', url: 'https://docs.google.com/document/d/1IEUuSO4nPYgzrOVgTntCE2_fm1N-UE_Z/edit', icon: FileText },
      { label: 'Checklist Operacional', url: 'https://docs.google.com/document/d/1E5BXVxtuGSrqs7yI1CLcGhCm0CfHX5a4/edit', icon: FileText },
    ]
  },
  {
    category: '📋 Benchmarks iFood',
    items: [
      { label: 'ROI CI: 4–6% | Clube: >10% | Frete: <6%', url: '#', icon: FileText },
    ]
  },
]

export function DocsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Docs & Links</h1>

      {docs.map(section => (
        <section key={section.category}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{section.category}</h2>
          <div className="space-y-2">
            {section.items.map(item => (
              <a
                key={item.label}
                href={item.url}
                target={item.url !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-[#1B4332]/30 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon size={15} className="text-[#1B4332] flex-shrink-0" />
                  <p className="text-sm text-gray-800 truncate">{item.label}</p>
                </div>
                {item.url !== '#' && <ExternalLink size={13} className="text-gray-300 group-hover:text-[#1B4332] flex-shrink-0" />}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
