import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isWithinInterval, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
  highlightDates?: Date[]
}

export function MiniCalendar({ startDate, endDate, onChange, highlightDates = [] }: Props) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart) // 0=Sun

  const handleDayClick = (day: Date) => {
    if (selecting === 'start' || !startDate) {
      onChange(day, null)
      setSelecting('end')
    } else {
      if (day < startDate) {
        onChange(day, startDate)
      } else {
        onChange(startDate, day)
      }
      setSelecting('start')
    }
  }

  const clear = () => {
    onChange(null, null)
    setSelecting('start')
  }

  const isInRange = (day: Date) =>
    startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate })

  const hasHighlight = (day: Date) =>
    highlightDates.some(d => isSameDay(d, day))

  const WEEK_DAYS = ['D','S','T','Q','Q','S','S']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold text-gray-800 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Padding */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const isStart = startDate && isSameDay(day, startDate)
          const isEnd = endDate && isSameDay(day, endDate)
          const inRange = isInRange(day)
          const highlight = hasHighlight(day)
          const today = isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`relative h-7 w-full flex items-center justify-center text-[11px] font-medium transition-colors rounded-lg
                ${isStart || isEnd ? 'bg-[#1B4332] text-white' : ''}
                ${inRange && !isStart && !isEnd ? 'bg-[#1B4332]/10 text-[#1B4332] rounded-none' : ''}
                ${!isStart && !isEnd && !inRange ? 'hover:bg-gray-100 text-gray-700' : ''}
                ${today && !isStart && !isEnd ? 'font-bold text-[#1B4332]' : ''}
              `}
            >
              {format(day, 'd')}
              {highlight && !isStart && !isEnd && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1B4332]/60" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected range + clear */}
      {startDate && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500">
              {startDate && format(startDate, 'dd/MM/yyyy')}
              {endDate && ` → ${format(endDate, 'dd/MM/yyyy')}`}
            </p>
            <button onClick={clear} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={12} />
            </button>
          </div>
          {!endDate && (
            <p className="text-[9px] text-[#1B4332] mt-0.5">Clique em outra data para o intervalo</p>
          )}
        </div>
      )}
    </div>
  )
}
