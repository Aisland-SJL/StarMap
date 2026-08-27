import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import type { DroneMediaItem } from '../data/droneMedia'

type DronePanoramaModalProps = {
  item?: DroneMediaItem
  onClose: () => void
}

type PanoramaLoadState = 'loading' | 'ready' | 'missing'

type PanoramaLoadResult = {
  itemId?: string
  state: PanoramaLoadState
  src?: string
}

export function DronePanoramaModal({ item, onClose }: DronePanoramaModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [loadResult, setLoadResult] = useState<PanoramaLoadResult>({ state: 'loading' })

  useEffect(() => {
    if (!item) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (viewerRef.current?.isFullscreenEnabled()) return
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  useEffect(() => {
    if (!item) return

    let cancelled = false
    viewerRef.current?.destroy()
    viewerRef.current = null

    const image = new Image()
    let retryTimer: number | undefined
    let attempt = 0

    const loadPanorama = () => {
      const source = item.type === 'aerialPhoto' ? item.previewSrc : item.src
      const separator = source.includes('?') ? '&' : '?'
      image.src = `${source}${separator}starmapLoad=${Date.now()}-${attempt}`
    }

    image.onload = () => {
      if (cancelled || !containerRef.current) return

      if (item.type === 'aerialPhoto') {
        setLoadResult({ itemId: item.id, state: 'ready', src: image.src })
        return
      }

      viewerRef.current = new Viewer({
        container: containerRef.current,
        panorama: image.src,
        caption: item.titleEn,
        defaultZoomLvl: 35,
        keyboard: 'always',
        mousewheel: true,
        navbar: ['zoom', 'move', 'fullscreen'],
      })
      setLoadResult({ itemId: item.id, state: 'ready' })
    }

    image.onerror = () => {
      if (cancelled) return
      attempt += 1
      if (attempt < 5) {
        retryTimer = window.setTimeout(loadPanorama, 450)
        return
      }
      setLoadResult({ itemId: item.id, state: 'missing' })
    }

    loadPanorama()

    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
      if (retryTimer !== undefined) window.clearTimeout(retryTimer)
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [item])

  if (!item) return null

  const loadState = loadResult.itemId === item.id ? loadResult.state : 'loading'

  return (
    <div
      aria-modal="true"
      className="drone-panorama-modal fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 text-white backdrop-blur-sm sm:p-6"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="drone-panorama-dialog relative z-10 flex flex-col overflow-hidden rounded-[14px] border border-white/12 bg-[#080d14] shadow-[0_30px_100px_rgba(0,0,0,0.58)]">
        <div className="drone-panorama-header flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              {item.type === 'panorama360' ? 'Drone 360 Panorama' : 'Drone Aerial Photo'}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-normal">
              {item.titleZh}
            </h2>
            <p className="drone-panorama-meta mt-1 text-sm">
              {item.fileName} · {item.resolution}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close drone media"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/18"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={containerRef} className="drone-panorama-viewer absolute inset-0">
            {item.type === 'aerialPhoto' && loadResult.itemId === item.id && loadResult.src ? (
              <img className="drone-aerial-preview" src={loadResult.src} alt={item.titleZh} />
            ) : null}
            {item.type === 'panorama360' ? (
              <button
                type="button"
                className="panorama-fullscreen-back"
                aria-label="Exit fullscreen and return to window"
                onClick={() => viewerRef.current?.exitFullscreen()}
              >
                <ArrowLeft aria-hidden="true" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>

          {loadState !== 'ready' ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950">
              <div className="max-w-md px-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                  {loadState === 'loading'
                    ? item.type === 'panorama360' ? '正在加载全景图' : '正在加载航拍照片'
                    : item.type === 'panorama360' ? '全景资源暂时无法读取' : '航拍照片暂时无法读取'}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {loadState === 'loading'
                    ? item.type === 'panorama360' ? '正在生成并加载沉浸式 360 视图。' : '正在加载高分辨率航拍预览。'
                    : '请稍后重新打开。如果问题持续存在，请重新导入原图。'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
