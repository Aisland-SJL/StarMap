import { CalendarDays, Compass, Layers3 } from 'lucide-react'
import { getCityCoverPhoto, getCityPhotos, getMediaSource } from '../data/mediaCatalog'
import { cityById, countryById, getCitiesForCountry } from '../data/travelAtlas'
import type { CityId, Country, CountryId, SelectionMode } from '../types/travel'
import type { CityPhotoGalleryRequest } from './CityPhotoGalleryModal'

type InfoCardProps = {
  mode: SelectionMode
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  onSelectCity?: (cityId: CityId) => void
  onOpenCityPhotos?: (request: CityPhotoGalleryRequest) => void
}

const continentRules: Array<{ continent: string; regions: string[] }> = [
  { continent: 'North America', regions: ['north america', '北美', '中美', '加勒比'] },
  { continent: 'South America', regions: ['south america', '南美'] },
  { continent: 'Europe', regions: ['europe', '欧洲', '北欧', '东欧', '西欧', '南欧', '欧亚'] },
  { continent: 'Asia', regions: ['asia', '亚洲', '东亚', '东南亚', '南亚', '中亚', '西亚', '中东', '印度洋'] },
  { continent: 'Africa', regions: ['africa', '非洲', '北非', '东非', '西非', '南非'] },
  { continent: 'Oceania', regions: ['oceania', '大洋洲', '澳洲'] },
  { continent: 'Antarctica', regions: ['antarctica', '南极'] },
]

const getContinentName = (country?: Country) => {
  const regionText = [
    ...(country?.keywords ?? []),
    ...(country?.records?.map((record) => record.region).filter(Boolean) ?? []),
  ]
    .join(' ')
    .toLowerCase()

  return continentRules.find(({ regions }) => regions.some((region) => regionText.includes(region)))?.continent ?? '—'
}

export function InfoCard({ mode, selectedCountryId, selectedCityId, onSelectCity, onOpenCityPhotos }: InfoCardProps) {
  const country = selectedCountryId ? countryById[selectedCountryId] : undefined
  const city = selectedCityId ? cityById[selectedCityId] : undefined
  const isCityMode = mode === 'city' && city && country
  const isOverview = mode === 'overview' || !country
  const memoryCities = country ? getCitiesForCountry(country.id) : []
  const isSpainCountryGridPreview = mode === 'country' && country?.id === 'spain'
  const isToledoCityGridPreview = mode === 'city' && city?.id === 'spain__toledo'
  const usesMemoryGridPreview = isSpainCountryGridPreview || isToledoCityGridPreview
  const memorySectionLabel = isToledoCityGridPreview ? 'City photos' : isSpainCountryGridPreview ? 'City cards' : 'Memory cards'
  const cityPhotos = isToledoCityGridPreview ? getCityPhotos(city.id) : []
  const cityCoverPhoto = isCityMode ? getCityCoverPhoto(city.id) : undefined
  const visitedCityCount = country?.cityIds.length ?? 0
  const openToledoGallery = (galleryMode: CityPhotoGalleryRequest['mode'], initialPhotoId?: string) => {
    if (!isToledoCityGridPreview || !city) return
    onOpenCityPhotos?.({
      photos: cityPhotos,
      cityName: city.nameZh ?? city.nameEn ?? 'City',
      initialPhotoId,
      mode: galleryMode,
    })
  }
  const eyebrowLabel = isOverview ? 'Overview' : isCityMode ? 'City info' : 'Selected country'
  const title = isOverview ? 'TravelAtlas' : isCityMode ? city.nameZh : country.nameZh
  const continentName = getContinentName(country)
  const titleDetail = isOverview
    ? 'Journey map overview'
    : isCityMode
      ? `${city.nameZh} / ${city.nameEn}`
      : `${country.nameZh} / ${country.nameEn}`
  const dateLabel = isOverview
    ? 'Select a country or city'
    : isCityMode
      ? city.visitedDateRange
      : country.visitedDateRange
  const summary = isOverview
    ? 'A soft overview of visited destinations, mapped routes and future story material.'
    : isCityMode
      ? city.summary
      : country.summary

  return (
    <aside
      className="atlas-info-panel selector-scrollbar glass-panel pointer-events-auto relative z-10 flex w-full max-w-sm flex-col overflow-hidden p-5 text-left"
      data-memory-layout={usesMemoryGridPreview ? 'grid' : 'track'}
    >
      <div className="atlas-info-header mb-5 flex shrink-0 items-center justify-between gap-3">
        <div className="atlas-panel-body">
          <p className="atlas-card-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-white">
            {eyebrowLabel}
          </p>
          <h2 className="atlas-card-title mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            {title}
          </h2>
          {!isOverview ? (
            <>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {isCityMode ? city.nameEn : country.nameEn}
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {isCityMode ? city.visitedDateRange : country.visitedDateRange}
              </p>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="atlas-panel-body grid size-11 place-items-center rounded-full bg-slate-950 text-white shadow-lg">
            <CalendarDays className="size-5" />
          </div>
        </div>
      </div>

      <div className="atlas-info-content atlas-panel-body flex min-h-0 flex-1 flex-col gap-4">
        {isOverview ? (
          <div>
            <p className="text-sm text-slate-500">
              {dateLabel}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              {titleDetail}
            </h3>
          </div>
        ) : null}

        {isCityMode ? (
          <div className="atlas-preview-card shrink-0 overflow-hidden rounded-[22px] border border-white/70 bg-white/50 shadow-[0_16px_50px_rgba(15,23,42,0.1)]">
            {cityCoverPhoto ? (
              <img
                src={getMediaSource(cityCoverPhoto, 'thumb')}
                alt={`${city.nameEn} travel preview`}
                className="h-24 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="h-24 bg-[radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.95),transparent_24%),linear-gradient(135deg,rgba(14,165,233,0.52),rgba(15,23,42,0.78)),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[length:auto,auto,28px_28px]"
                style={{ backgroundColor: country.accent }}
              />
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Preview image
              </span>
              <span className="text-xs font-medium text-slate-500">{city.nameEn}</span>
            </div>
          </div>
        ) : null}

        <div className="grid shrink-0 grid-cols-2 gap-3">
          <div className="atlas-info-metric rounded-[18px] border border-white/60 bg-white/55 p-3">
            <p className="text-xs text-slate-400">
              {isOverview ? 'Mode' : isCityMode ? 'Country' : 'Visited Cities'}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isOverview
                ? 'Overview'
                : isCityMode
                  ? country.nameEn
                  : `${visitedCityCount} ${visitedCityCount === 1 ? 'city' : 'cities'}`}
            </p>
          </div>
          <div className="atlas-info-metric rounded-[18px] border border-white/60 bg-white/55 p-3">
            <p className="text-xs text-slate-400">{isOverview ? 'Keywords' : 'Continent'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isOverview ? 'Travel / Games' : continentName}
            </p>
          </div>
        </div>

        {isOverview ? <p className="text-sm leading-6 text-slate-600">{summary}</p> : null}

        {(isToledoCityGridPreview ? cityPhotos.length > 0 : memoryCities.length > 0) ? (
          <div
            className={`atlas-memory-panel flex min-h-0 flex-col rounded-[22px] bg-slate-950 p-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.2)] ${
              usesMemoryGridPreview ? 'atlas-memory-panel-grid-preview' : ''
            }`}
            data-photo-gallery={isToledoCityGridPreview ? 'true' : undefined}
            onClick={isToledoCityGridPreview ? () => openToledoGallery('grid') : undefined}
          >
            {isToledoCityGridPreview ? (
              <button
                type="button"
                className="atlas-memory-panel-heading mb-3 flex shrink-0 items-center gap-2"
                onClick={(event) => {
                  event.stopPropagation()
                  openToledoGallery('grid')
                }}
              >
                <Layers3 className="size-4 text-sky-300" />
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {memorySectionLabel}
                </span>
              </button>
            ) : (
              <div className="mb-3 flex shrink-0 items-center gap-2">
                <Layers3 className="size-4 text-sky-300" />
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {memorySectionLabel}
                </p>
              </div>
            )}
            <div
              className={`atlas-memory-track selector-scrollbar min-h-0 gap-3 overflow-auto pb-2 ${
                usesMemoryGridPreview ? 'atlas-memory-grid-preview' : 'flex snap-x'
              }`}
            >
              {isToledoCityGridPreview ? cityPhotos.map((photo, index) => (
                <button
                  type="button"
                  key={photo.id}
                  className="city-photo-card"
                  aria-label={`Open ${city.nameEn} photo ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    openToledoGallery('viewer', photo.id)
                  }}
                >
                  <img
                    src={getMediaSource(photo, 'thumb')}
                    alt={`${city.nameEn} city photo ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              )) : memoryCities.map((memoryCity, index) => {
                const isActive = memoryCity.id === selectedCityId
                const memoryCoverPhoto = getCityCoverPhoto(memoryCity.id)

                return (
                  <button
                    type="button"
                    key={memoryCity.id}
                    onClick={() => onSelectCity?.(memoryCity.id)}
                    aria-pressed={isActive}
                    className={`memory-city-card overflow-hidden rounded-[18px] border transition ${
                      usesMemoryGridPreview
                        ? 'memory-city-card-grid-preview min-w-0'
                        : 'min-w-[154px] snap-start'
                    } ${
                      isActive ? 'border-sky-300/90 bg-white/18 shadow-[0_0_34px_rgba(125,211,252,0.2)]' : 'border-white/10 bg-white/10'
                    }`}
                  >
                    {memoryCoverPhoto ? (
                      <img
                        src={getMediaSource(memoryCoverPhoto, 'thumb')}
                        alt={`${memoryCity.nameEn} travel memory`}
                        className={`w-full object-cover ${usesMemoryGridPreview ? 'h-[52px]' : 'h-24'}`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className={`${usesMemoryGridPreview ? 'h-[52px]' : 'h-24'} bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.92),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.24),rgba(15,23,42,0.28)),linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:auto,auto,22px_22px]`}
                        style={{ backgroundColor: country?.accent ?? '#38bdf8' }}
                      />
                    )}
                    <div className="p-3">
                      {isSpainCountryGridPreview ? (
                        <div className="memory-city-card-heading">
                          <h4 className="memory-city-card-title text-sm font-semibold text-white">{memoryCity.nameZh}</h4>
                          <p className="memory-city-card-index text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="memory-city-card-index text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <h4 className="memory-city-card-title mt-1 text-sm font-semibold text-white">{memoryCity.nameZh}</h4>
                        </>
                      )}
                      <p className="memory-city-card-subtitle text-xs text-slate-300">{memoryCity.nameEn}</p>
                      <p className="memory-city-card-date mt-2 text-xs leading-5 text-slate-300">
                        {memoryCity.visitedDateRange ?? 'Travel memory'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
          <Compass className="size-4" />
          Focus: {isOverview ? 'World overview' : isCityMode ? city.nameEn : country.nameEn}
        </div>
      </div>
    </aside>
  )
}
