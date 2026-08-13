import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, Rows3, X } from 'lucide-react'
import { getMediaSource } from '../data/mediaCatalog'
import type { ImportedMediaCatalogItem } from '../data/mediaCatalog'

export type CityPhotoGalleryRequest = {
  photos: ImportedMediaCatalogItem[]
  cityName: string
  initialPhotoId?: string
  mode: 'grid' | 'viewer'
}

type CityPhotoGalleryModalProps = CityPhotoGalleryRequest & {
  onClose: () => void
}

export function CityPhotoGalleryModal({
  photos,
  cityName,
  initialPhotoId,
  mode: initialMode,
  onClose,
}: CityPhotoGalleryModalProps) {
  const initialIndex = Math.max(0, photos.findIndex((photo) => photo.id === initialPhotoId))
  const [mode, setMode] = useState<'grid' | 'viewer'>(initialMode)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const activePhoto = photos[activeIndex]
  const activeThumbRef = useRef<HTMLButtonElement | null>(null)
  const dialogTitleId = 'city-photo-gallery-title'

  const gridPhotos = useMemo(() => photos.map((photo, index) => ({ photo, index })), [photos])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (mode !== 'viewer') return
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => (current - 1 + photos.length) % photos.length)
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => (current + 1) % photos.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, onClose, photos.length])

  useEffect(() => {
    if (mode === 'viewer') activeThumbRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [activeIndex, mode])

  if (!activePhoto) return null

  const showPhoto = (index: number) => {
    setActiveIndex(index)
    setMode('viewer')
  }

  return (
    <div
      className="city-photo-gallery-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="city-photo-gallery-window" data-mode={mode}>
        <header className="city-photo-gallery-header">
          <div className="min-w-0">
            <p className="city-photo-gallery-kicker">City Photos</p>
            <h2 id={dialogTitleId}>{cityName}</h2>
            <p>{photos.length} photos</p>
          </div>
          <div className="city-photo-gallery-actions">
            <button
              type="button"
              className="city-photo-gallery-view-toggle"
              aria-label={mode === 'grid' ? 'Open single photo view' : 'Open card view'}
              onClick={() => setMode((current) => current === 'grid' ? 'viewer' : 'grid')}
            >
              {mode === 'grid' ? <Rows3 aria-hidden="true" /> : <Images aria-hidden="true" />}
              <span>{mode === 'grid' ? 'Viewer' : 'Cards'}</span>
            </button>
            <button type="button" className="city-photo-gallery-close" aria-label="Close photo gallery" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        {mode === 'grid' ? (
          <div className="city-photo-gallery-grid selector-scrollbar">
            <div className="city-photo-gallery-grid-flow">
              {gridPhotos.map(({ photo, index }) => (
                <button
                  type="button"
                  key={photo.id}
                  className="city-photo-gallery-grid-item"
                  onClick={() => showPhoto(index)}
                  aria-label={`Open ${cityName} photo ${index + 1}`}
                >
                  <img
                    src={getMediaSource(photo, 'thumb')}
                    alt={`${cityName} photo ${index + 1}`}
                    width={photo.variants?.thumb?.width ?? photo.width}
                    height={photo.variants?.thumb?.height ?? photo.height}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="city-photo-gallery-viewer">
            <div className="city-photo-gallery-stage">
              <button
                type="button"
                className="city-photo-gallery-nav city-photo-gallery-nav-prev"
                aria-label="Previous photo"
                onClick={() => setActiveIndex((current) => (current - 1 + photos.length) % photos.length)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <img
                key={activePhoto.id}
                className="city-photo-gallery-main-image"
                src={getMediaSource(activePhoto, 'preview')}
                alt={`${cityName} photo ${activeIndex + 1}`}
                width={activePhoto.variants?.preview?.width ?? activePhoto.width}
                height={activePhoto.variants?.preview?.height ?? activePhoto.height}
                decoding="async"
              />
              <button
                type="button"
                className="city-photo-gallery-nav city-photo-gallery-nav-next"
                aria-label="Next photo"
                onClick={() => setActiveIndex((current) => (current + 1) % photos.length)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <span className="city-photo-gallery-counter">
                {String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
              </span>
            </div>

            <div className="city-photo-gallery-filmstrip selector-scrollbar" aria-label="Photo thumbnails">
              {photos.map((photo, index) => (
                <button
                  type="button"
                  key={photo.id}
                  ref={index === activeIndex ? activeThumbRef : undefined}
                  className="city-photo-gallery-thumb"
                  data-active={index === activeIndex}
                  aria-label={`Show ${cityName} photo ${index + 1}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                >
                  <img src={getMediaSource(photo, 'thumb')} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
