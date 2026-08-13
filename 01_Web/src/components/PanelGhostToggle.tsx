import { Eye, EyeOff } from 'lucide-react'

type PanelGhostToggleProps = {
  active: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}

export function PanelGhostToggle({
  active,
  onToggle,
  size = 'md',
}: PanelGhostToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={active ? 'Show panel' : 'Hide panel'}
      onClick={onToggle}
      className={`atlas-panel-ghost-toggle grid shrink-0 place-items-center rounded-full border shadow-lg transition duration-300 ${
        size === 'sm' ? 'size-10' : 'size-11'
      } ${
        active
          ? 'border-sky-200 bg-sky-500 text-white shadow-[0_14px_34px_rgba(14,165,233,0.3)]'
          : 'border-white/70 bg-white/72 text-slate-700 hover:bg-white'
      }`}
    >
      {active ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
    </button>
  )
}
