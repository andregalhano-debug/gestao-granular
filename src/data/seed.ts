import type { Task, Client, Meeting, Priority } from '../types'

export const seedTasks: Task[] = [
  // Jurídico
  { id: '1', title: 'Finalizar abertura do CNPJ (Ponto Gestão)', owner: 'A', done: false, priority: 'alta', area: 'juridico', created_at: new Date().toISOString() },
  { id: '2', title: 'Definir novo endereço após saída da Savassi', owner: 'E', done: false, priority: 'media', area: 'juridico', created_at: new Date().toISOString() },
  { id: '3', title: 'Validar CNAEs com contador (10 CNAEs definidos)', owner: 'A', done: false, priority: 'alta', area: 'juridico', created_at: new Date().toISOString() },
  // Produto
  { id: '4', title: 'Finalizar módulo Gestão de Pessoas (RH)', owner: 'E', done: false, priority: 'alta', area: 'produto', created_at: new Date().toISOString() },
  { id: '5', title: 'Ajustar Diagnóstico 360° no mobile', owner: 'E', done: false, priority: 'alta', area: 'produto', created_at: new Date().toISOString() },
  { id: '6', title: 'Resolver erro ON CONFLICT no diagnóstico', owner: 'E', done: false, priority: 'alta', area: 'produto', created_at: new Date().toISOString() },
  { id: '7', title: 'Avançar módulos Granular Market (embrionário)', owner: 'E', done: false, priority: 'media', area: 'produto', created_at: new Date().toISOString() },
  // Comercial
  { id: '8', title: 'Fechar contrato SAJ & Manish (5+2 lojas)', owner: 'A', done: false, priority: 'alta', area: 'comercial', created_at: new Date().toISOString() },
  { id: '9', title: 'Agendar visita Dorival ao sistema', owner: 'G', done: false, priority: 'alta', area: 'comercial', deadline: '2026-07-04', created_at: new Date().toISOString() },
  { id: '10', title: 'Avançar parceria Pepe / Foozi', owner: 'G', done: false, priority: 'media', area: 'comercial', created_at: new Date().toISOString() },
  { id: '11', title: 'Reagendar reunião com Rodrigo (pós Fispal)', owner: 'A', done: false, priority: 'media', area: 'comercial', created_at: new Date().toISOString() },
  { id: '12', title: 'Avaliar parceria com Kickops (tech)', owner: 'A', done: false, priority: 'media', area: 'geral', created_at: new Date().toISOString() },
  { id: '13', title: 'Retorno sobre Nando (sócio tech)', owner: 'G', done: false, priority: 'media', area: 'geral', created_at: new Date().toISOString() },
  // Financeiro
  { id: '14', title: 'Validar precificação SAJ (R$650/h × desmame Q1-Q4)', owner: 'todos', done: false, priority: 'alta', area: 'financeiro', created_at: new Date().toISOString() },
  { id: '15', title: 'Definir modelo por unidade vs valor fixo (sistema)', owner: 'todos', done: false, priority: 'media', area: 'financeiro', created_at: new Date().toISOString() },
]

export const seedClients: Client[] = [
  { id: '1', name: 'MartMinas', stage: 'ativo', owner: 'E', segment: 'market', notes: 'Principal cliente. Sistema rodando. 10º no iFood.', next_action: 'Acompanhar evolução KPIs', contact_name: 'Bia (iFood)', last_update: new Date().toISOString() },
  { id: '2', name: 'SAJ & Manish', stage: 'negociacao', owner: 'A', segment: 'food', notes: '5 lojas SAJ + 2 Manish (culinária árabe, SP). Indicação diretor iFood. Consultoria 360° em negociação.', next_action: 'Fechar contrato — não comemorar antes de assinar', revenue_potential: 'R$18.200/mês (Q1)', contact_name: 'Rodrigo (sócio)', last_update: new Date().toISOString() },
  { id: '3', name: 'Pepe / Foozi', stage: 'contato', owner: 'G', segment: 'food', notes: 'Parceria delivery. Participou do evento LCD. Quer avançar semana que vem.', next_action: 'Reunião semana que vem', contact_name: 'Pepe', last_update: new Date().toISOString() },
  { id: '4', name: 'Dorival (Steak)', stage: 'proposta', owner: 'G', segment: 'food', notes: 'Viu sistema ao vivo. Fatura ~50k/mês. Pirou no dashboard. Interessado.', next_action: 'Visita agendada final semana que vem', revenue_potential: 'R$489/mês (sistema)', contact_name: 'Dorival', last_update: new Date().toISOString() },
  { id: '5', name: 'Rodrigo (restaurante)', stage: 'contato', owner: 'A', segment: 'food', notes: 'Prospect pós Fispal. Reagendar reunião.', next_action: 'Reagendar após Fispal', contact_name: 'Rodrigo', last_update: new Date().toISOString() },
  { id: '6', name: 'Grupo Muffato', stage: 'prospecto', owner: 'A', segment: 'market', notes: '6º maior supermercado do Brasil. 20bi faturamento. Primo do André conhece os donos.', next_action: 'Acionar após consolidar MartMinas', revenue_potential: 'Alto potencial', last_update: new Date().toISOString() },
]

export const seedMeetings: Meeting[] = [
  { id: '1', title: 'Alinhamento sócios', date: '2026-06-30T09:00', participants: ['A', 'E', 'G'], recurring: true },
  { id: '2', title: 'Reunião SAJ & Manish', date: '2026-07-01T10:00', participants: ['A', 'G'], notes: 'Apresentar proposta final. Não sair sem assinatura.' },
  { id: '3', title: 'Demo Dorival', date: '2026-07-04T14:00', participants: ['G'], notes: 'Mostrar sistema ao vivo. Foco no dashboard de vendas.' },
]

export const seedPriorities: Priority[] = [
  { id: '1', title: 'Fechar contrato SAJ & Manish', owner: 'A', urgent: true, important: true, done: false, private: false, tema: 'Comercial', description: 'Proposta final — 5+2 lojas', created_at: new Date().toISOString() },
  { id: '2', title: 'CNPJ Ponto Gestão — finalizar abertura', owner: 'A', urgent: true, important: true, done: false, private: false, tema: 'Jurídico', description: 'Validar CNAEs com contador', created_at: new Date().toISOString() },
  { id: '3', title: 'Entregar módulo Pessoas (RH) para produção', owner: 'E', urgent: true, important: true, done: false, private: false, tema: 'Produto', description: 'Módulo RH em fase final', created_at: new Date().toISOString() },
  { id: '4', title: 'Demo Dorival — preparar sistema', owner: 'G', urgent: false, important: true, done: false, private: false, tema: 'Comercial', description: 'Foco no dashboard de vendas', created_at: new Date().toISOString() },
  { id: '5', title: 'Avançar reunião com Nando (sócio tech)', owner: 'G', urgent: false, important: false, done: false, private: false, tema: 'Geral', created_at: new Date().toISOString() },
]
