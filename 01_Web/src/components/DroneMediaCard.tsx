import { Drone, Maximize2 } from 'lucide-react'
import { cityById } from '../data/travelAtlas'
import type { DroneMediaItem } from '../data/droneMedia'
import { getDroneMediaForCity } from '../data/droneMedia'
import type { CityId } from '../types/travel'

type DroneMediaCardProps = {
  cityId?: CityId
  activeItemId?: string
  onSelectItem: (item: DroneMediaItem) => void
  onOpenPanorama: (item: DroneMediaItem) => void
}

export function DroneMediaCard({
  cityId,
  activeItemId,
  onSelectItem,
  onOpenPanorama,
}: DroneMediaCardProps) {
  const city = cityId ? cityById[cityId] : undefined
  const items = getDroneMediaForCity(cityId)

  if (!city || items.length === 0) return null

  const mediaTitle = `${city.nameZh}\u65e0\u4eba\u673a\u5f71\u50cf`
  const usesThumbnailPreview = city.id === 'spain__toledo'

  return (
    <aside className="drone-media-card glass-panel relative z-10 w-full p-[18px] text-left">
      <div className="atlas-panel-body drone-media-card-layout">
        <div className="drone-media-card-heading">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/55 bg-white/45 text-sky-600">
            <Drone className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.22em] text-white">
              Drone Media
            </p>
            <h2 className="mt-1 truncate text-[22px] font-semibold leading-[1.15] tracking-normal text-slate-950">
              {mediaTitle}
            </h2>
          </div>
        </div>

        <div className="drone-media-track selector-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
          {items.map((item, index) => {
            const itemNumber = String(index + 1).padStart(2, '0')

            return (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                data-active={item.id === activeItemId}
                aria-pressed={item.id === activeItemId}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectItem(item)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    onSelectItem(item)
                  }
                }}
                className={`drone-media-item-card min-w-[146px] flex-1 shrink-0 rounded-xl border border-white/65 bg-white/52 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.07)] ${
                  usesThumbnailPreview ? 'drone-media-item-card-thumbnail' : ''
                }`}
              >
                {usesThumbnailPreview ? (
                  <div className="drone-media-thumbnail-frame">
                    <img
                      src={item.thumbSrc}
                      alt={`${city.nameEn} drone panorama ${itemNumber}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="drone-media-thumbnail-shade" aria-hidden="true" />
                    <span className="drone-media-item-number drone-media-thumbnail-number">
                      {itemNumber}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <span className="drone-media-item-number grid size-7 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-semibold text-sky-200">
                      {itemNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13px] font-semibold leading-5 text-slate-950">
                        Panorama {itemNumber}
                      </h3>
                      <p className="drone-media-item-date truncate text-[11px] font-medium leading-[15px]">
                        {item.date}
                      </p>
                    </div>
                  </div>
                )}

                {item.type === 'panorama360' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenPanorama(item)
                    }}
                    className="drone-media-view-button mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-950 px-1.5 py-1.5 font-semibold text-white transition hover:bg-sky-500 hover:text-slate-950"
                  >
                    <Maximize2 aria-hidden="true" />
                    View
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
