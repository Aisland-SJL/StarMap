import { useEffect, useState } from 'react'
import { requestMeteorShower } from '../data/meteorShower'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

/**
 * 底部栏「流星雨」按钮：点击触发 3 秒高密度流星（速度不变，仅数量增加）。
 */
export function MeteorShowerButton() {
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(reducedMotionQuery).matches
  ))
  const [justTriggered, setJustTriggered] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(reducedMotionQuery)
    const sync = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const trigger = () => {
    if (reducedMotion) return
    requestMeteorShower()
    setJustTriggered(true)
    window.setTimeout(() => setJustTriggered(false), 600)
  }

  return (
    <button
      type="button"
      className="atlas-dock-button atlas-meteor-shower-toggle pointer-events-auto"
      aria-label={reducedMotion ? '流星雨（已随系统减少动态效果而禁用）' : '召唤 3 秒流星雨'}
      title={reducedMotion ? '流星雨已禁用（prefers-reduced-motion）' : '召唤 3 秒流星雨'}
      disabled={reducedMotion}
      data-triggered={justTriggered ? 'true' : 'false'}
      onClick={trigger}
    >
      <span className="atlas-dock-button-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
          <path d="M8 2.6 C 9.6 6.3, 11.1 8.1, 13.5 8.1 C 11.1 8.1, 9.6 9.9, 8 13.6 C 6.4 9.9, 4.9 8.1, 2.5 8.1 C 4.9 8.1, 6.4 6.3, 8 2.6 Z" />
          <path d="M3.0 0.3 C 3.8 2.1, 4.5 2.9, 5.6 2.9 C 4.5 2.9, 3.8 3.7, 3.0 5.5 C 2.2 3.7, 1.6 2.9, 0.4 2.9 C 1.6 2.9, 2.2 2.1, 3.0 0.3 Z" />
          <path d="M2.6 11.1 C 3.2 12.4, 3.7 13.0, 4.5 13.0 C 3.7 13.0, 3.2 13.6, 2.6 14.9 C 2.0 13.6, 1.5 13.0, 0.7 13.0 C 1.5 13.0, 2.0 12.4, 2.6 11.1 Z" />
        </svg>
      </span>
    </button>
  )
}
