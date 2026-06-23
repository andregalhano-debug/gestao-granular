import { MiniCalendar } from './MiniCalendar'
import { Filter } from 'lucide-react'

interface Props {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  highlightDates?: Date[]
}

export function RightPanel({ startDate, endDate, onDateChange, highlightDates }: Props) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[260px] flex-shrink-0">
      {/* Calendar */}
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

      {/* Placeholder for future widgets */}
      <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center">
        <p className="text-[10px] text-gray-300 font-medium">Espaço para novos widgets</p>
      </div>
    </aside>
  )
}
