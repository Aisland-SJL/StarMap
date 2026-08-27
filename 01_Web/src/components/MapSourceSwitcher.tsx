import { useEffect, useRef, useState } from 'react'
import { Check, Layers3 } from 'lucide-react'
import { mapSourceOptions } from '../data/mapSources'
import type { MapSourceId } from '../data/mapSources'

type MapSourceSwitcherProps = {
  value: MapSourceId
  onChange: (source: MapSourceId) => void
}

export function MapSourceSwitcher({ value, onChange }: MapSourceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const activeOption = mapSourceOptions.find((option) => option.id === value)

  return (
    <div ref={shellRef} className="atlas-map-source-switcher">
      {open ? (
        <div className="atlas-map-source-menu" role="menu" aria-label="选择地图图源">
          <p>地图图源</p>
          {mapSourceOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === value}
              aria-disabled={!option.configured}
              data-active={option.id === value ? 'true' : 'false'}
              data-configured={option.configured ? 'true' : 'false'}
              disabled={!option.configured}
              onClick={() => {
                onChange(option.id)
                setOpen(false)
              }}
            >
              <span className="atlas-map-source-status" aria-hidden="true" />
              <span className="atlas-map-source-copy">
                <strong>{option.label}</strong>
                <small>
                  {option.configured ? option.description : '未配置 API Key'}
                </small>
              </span>
              {option.id === value ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="atlas-dock-button atlas-map-source-button pointer-events-auto"
        aria-label={`切换地图图源，当前为${activeOption?.label ?? '本地低清'}`}
        aria-expanded={open}
        title={`图源：${activeOption?.label ?? '本地低清'}`}
        onClick={() => setOpen((visible) => !visible)}
      >
        <Layers3 aria-hidden="true" />
      </button>
    </div>
  )
}
