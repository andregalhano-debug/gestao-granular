export type Owner = 'A' | 'E' | 'G' | 'todos'

export interface Task {
  id: string
  title: string
  owner: Owner
  done: boolean
  priority: 'alta' | 'media' | 'baixa'
  deadline?: string
  area: 'produto' | 'comercial' | 'juridico' | 'financeiro' | 'geral'
  notes?: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  stage: 'prospecto' | 'contato' | 'proposta' | 'negociacao' | 'ativo' | 'pausado'
  owner: Owner
  segment: 'food' | 'market' | 'farma' | 'outro'
  notes: string
  briefing?: string
  next_action?: string
  contact_name?: string
  phone?: string
  instagram?: string
  website?: string
  revenue_potential?: string
  tags?: string[]
  last_update: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  participants: Owner[]
  notes?: string
  recurring?: boolean
}

export interface Priority {
  id: string
  title: string
  owner: Owner
  urgent: boolean
  done: boolean
  created_at: string
}
