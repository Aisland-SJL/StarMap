import { CalendarRange, Rows3 } from 'lucide-react'

export type JourneyViewMode = 'timeline' | 'yearCards'

type JourneyViewToggleProps = {
  value: JourneyViewMode
  onChange: (mode: JourneyViewMode) => void
  className?: string
}

const options: { id: JourneyViewMode; label: string; icon: typeof Rows3 }[] = [
  { id: 'yearCards', label: 'Year Cards', icon: CalendarRange },
  { id: 'timeline', label: 'Timeline', icon: Rows3 },
]

export function JourneyViewToggle({ value, onChange, className = '' }: JourneyViewToggleProps) {
  return (
    <div
      className={`journey-view-toggle inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/50 p-1 text-sm font-medium text-slate-500 shadow-sm backdrop-blur-xl ${className}`}
      role="group"
      aria-label="Journey view"
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${
              isActive
                ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]'
                : 'hover:bg-white/70 hover:text-slate-950'
            }`}
          >
            <Icon className="size-3.5" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
