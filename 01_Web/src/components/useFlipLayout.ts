import { useLayoutEffect, useRef } from 'react'

export function useFlipLayout<T extends HTMLElement>(dependencyKey: string) {
  const containerRef = useRef<T>(null)
  const previousRectsRef = useRef(new Map<string, DOMRect>())

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-flip-id]'))
    const nextRects = new Map(elements.map((element) => [
      element.dataset.flipId ?? '',
      element.getBoundingClientRect(),
    ]))

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => {
        const id = element.dataset.flipId ?? ''
        const previous = previousRectsRef.current.get(id)
        const next = nextRects.get(id)
        if (!previous || !next) return
        const deltaX = previous.left - next.left
        const deltaY = previous.top - next.top
        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return

        element.getAnimations().forEach((animation) => animation.cancel())
        element.animate(
          [
            { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
            { transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: 220,
            easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
          },
        )
      })
    }

    previousRectsRef.current = nextRects
  }, [dependencyKey])

  return containerRef
}
