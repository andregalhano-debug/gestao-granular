import { useState } from 'react'
import { MiniCalendar } from './MiniCalendar'
import { Filter, ChevronRight, ChevronLeft } from 'lucide-react'

interface Props {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  highlightDates?: Date[]
  defaultCollapsed?: boolean
}

export function RightPanel({ startDate, endDate, onDateChange, highlightDates, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <aside className={`hidden lg:flex flex-col gap-3 flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-8' : 'w-[240px]'}`}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="self-start p-1.5 rounded-lg text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors border border-gray-100 bg-white"
        title={collapsed ? 'Expandir calendário' : 'Recolher calendário'}
      >
        {collapsed ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {!collapsed && (
        <>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter size={10} /> Filtrar por data
            </p>
            <MiniCalendar
              startDate={startDate}
              endDate={endDate}
              onChange={onDateChange}
              highlightDates={highlightDates}
            />
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex flex-col items-center gap-2 pt-1">
          {startDate && (
            <div
              className="w-6 h-6 rounded-full bg-[#1B4332] flex items-center justify-center"
              title="Filtro de data ativo — expanda para ver"
            >
              <Filter size={10} className="text-white" />
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
