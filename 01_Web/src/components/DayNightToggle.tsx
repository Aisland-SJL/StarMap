import { Moon, Sun } from 'lucide-react'

export type ThemeMode = 'day' | 'night'

type DayNightToggleProps = {
  theme: ThemeMode
  onToggle: () => void
  className?: string
}

export function DayNightToggle({ theme, onToggle, className = '' }: DayNightToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={theme === 'night'}
      aria-label={`Switch to ${theme === 'night' ? 'day' : 'night'} mode`}
      onClick={onToggle}
      className={`theme-toggle pointer-events-auto relative inline-flex h-11 w-[158px] items-center rounded-full border border-white/70 bg-white/58 p-1 text-xs font-semibold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition hover:bg-white/80 ${className}`}
    >
      <span
        className={`theme-toggle-thumb absolute inset-y-1 left-1 w-[74px] rounded-full transition duration-300 ${
          theme === 'night'
            ? 'translate-x-[76px] bg-sky-300 shadow-[0_12px_30px_rgba(56,189,248,0.28)]'
            : 'translate-x-0 bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.18)]'
        }`}
        aria-hidden="true"
      />
      <span className={`relative z-10 flex w-1/2 items-center justify-center gap-1.5 transition ${theme === 'day' ? 'text-white' : 'text-slate-500'}`}>
        <Sun className="size-3.5" />
        Day
      </span>
      <span className={`relative z-10 flex w-1/2 items-center justify-center gap-1.5 transition ${theme === 'night' ? 'text-slate-950' : 'text-slate-500'}`}>
        <Moon className="size-3.5" />
        Night
      </span>
    </button>
  )
}
