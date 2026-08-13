import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Drone, MapPin, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { hasDroneMedia } from '../data/droneMedia'
import { countries, getCitiesForCountry, shouldHideCityFromNavigation } from '../data/travelAtlas'
import type { CityId, CountryId } from '../types/travel'

type CountrySelectorProps = {
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  activeDroneMediaCityId?: CityId
  globeDistance: number
  imageryBrightness: number
  imageryContrast: number
  imagerySaturation: number
  onBrightnessChange: (value: number) => void
  onContrastChange: (value: number) => void
  onHoverCountry: (countryId?: CountryId) => void
  onResetImageryTuning: () => void
  onSaturationChange: (value: number) => void
  onSelectCountry: (countryId: CountryId) => void
  onSelectCity: (cityId: CityId) => void
  onSelectDroneMedia: (cityId: CityId) => void
  onDistanceChange: (distance: number) => void
  onResetView: () => void
}

const scaleLabelForDistance = (distance: number) => {
  if (distance < 1.68) return 'City'
  if (distance < 2.55) return 'Country'
  return 'World'
}

const debugGlobeScaleChange = (value: number) => {
  if (!import.meta.env.DEV) return

  console.debug('[globe-scale-change]', JSON.stringify({
    value,
    label: scaleLabelForDistance(value),
    time: Date.now(),
  }))
}

export function CountrySelector({
  selectedCountryId,
  selectedCityId,
  activeDroneMediaCityId,
  globeDistance,
  imageryBrightness,
  imageryContrast,
  imagerySaturation,
  onBrightnessChange,
  onContrastChange,
  onHoverCountry,
  onResetImageryTuning,
  onSaturationChange,
  onSelectCountry,
  onSelectCity,
  onSelectDroneMedia,
  onDistanceChange,
  onResetView,
}: CountrySelectorProps) {
  const selectedCountry = selectedCountryId ? countries.find((country) => country.id === selectedCountryId) : undefined
  const displayCountries = [...countries].reverse()
  const committedDistanceRef = useRef(globeDistance)
  const hasDraftDistanceChangeRef = useRef(false)
  const [isImageTuningOpen, setIsImageTuningOpen] = useState(false)
  const [isGlobeScaleOpen, setIsGlobeScaleOpen] = useState(true)

  useEffect(() => {
    committedDistanceRef.current = globeDistance
    hasDraftDistanceChangeRef.current = false
  }, [globeDistance])

  const commitGlobeDistance = (distance: number) => {
    const hasChanged = Math.abs(distance - committedDistanceRef.current) > 0.001

    if (!hasDraftDistanceChangeRef.current && !hasChanged) return

    hasDraftDistanceChangeRef.current = false
    committedDistanceRef.current = distance
    onDistanceChange(distance)
  }

  return (
    <aside className="atlas-left-panel glass-panel pointer-events-auto z-30 flex w-full max-w-[340px] flex-col p-4 text-left">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="atlas-panel-body">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white">
            Country Maps
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
            国家足迹
          </h2>
        </div>
      </div>

      <div className="atlas-panel-body selector-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
        {displayCountries.map((country) => {
          const isSelected = country.id === selectedCountry?.id
          const countryCities = getCitiesForCountry(country.id).filter((city) => !shouldHideCityFromNavigation(city))

          return (
            <div key={country.id} className="country-disclosure">
              <button
                type="button"
                aria-expanded={isSelected}
                data-selected={isSelected}
                onClick={() => onSelectCountry(country.id)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') onHoverCountry(country.id)
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') onHoverCountry(undefined)
                }}
                style={{ '--country-color': country.accent } as React.CSSProperties}
                className={`atlas-country-button group flex w-full items-center justify-between gap-3 rounded-full border px-3.5 py-2.5 text-left transition duration-300 ${
                  isSelected
                    ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)]'
                    : 'border-white/70 bg-white/55 text-slate-700 hover:-translate-y-0.5 hover:bg-white/85'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border shadow-sm ${
                      isSelected ? 'border-white/15 bg-white/12' : 'border-white/80 bg-white/75'
                    }`}
                    aria-hidden="true"
                  >
                    {country.flagCode ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={`https://flagcdn.com/w80/${country.flagCode}.png`}
                      />
                    ) : (
                      <span className="text-base">{country.flag ?? ''}</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold tracking-normal">{country.nameZh}</span>
                    <span className={isSelected ? 'block truncate text-xs text-slate-300' : 'block truncate text-xs text-slate-400'}>
                      {country.nameEn}
                    </span>
                  </span>
                </span>
                <span
                  className="size-2.5 rounded-full shadow-[0_0_18px_var(--country-color)]"
                  style={{ backgroundColor: country.accent }}
                  aria-hidden="true"
                />
              </button>

              <div
                className="country-city-disclosure"
                data-open={isSelected}
                aria-hidden={!isSelected}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="relative ml-4 mt-2 space-y-1.5 border-l border-dashed border-slate-300/80 pb-1 pl-4 pr-1">
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <MapPin className="size-3 text-sky-600" />
                      Visited cities
                    </div>

                    {countryCities.map((city, index) => {
                      const isCitySelected = city.id === selectedCityId
                      const cityHasDroneMedia = hasDroneMedia(city.id)
                      const isDroneMediaActive = city.id === activeDroneMediaCityId

                      return (
                        <div
                          key={city.id}
                          className="country-city-item relative"
                          style={{ '--city-index': index } as React.CSSProperties}
                        >
                          <div className="relative">
                            <span
                              className={`absolute -left-[20px] top-1/2 size-2 -translate-y-1/2 rounded-full border shadow-sm ${
                                isCitySelected
                                  ? 'border-sky-500 bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.48)]'
                                  : 'border-white bg-slate-300'
                              }`}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              disabled={!isSelected}
                              onClick={() => onSelectCity(city.id)}
                              data-selected={isCitySelected}
                              className={`atlas-city-button flex w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-xs font-semibold transition duration-200 ${
                                isCitySelected
                                  ? 'border-sky-400 bg-sky-500 text-white shadow-[0_10px_26px_rgba(14,165,233,0.3)]'
                                  : 'border-white/75 bg-white/64 text-slate-600 hover:border-sky-200 hover:bg-white/90 hover:text-slate-950'
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                {city.nameZh}{' '}
                                <span className={`atlas-city-name-en ${isCitySelected ? 'text-sky-100' : 'font-medium text-slate-400'}`}>
                                  {city.nameEn}
                                </span>
                              </span>
                              {cityHasDroneMedia ? (
                                <span
                                  className="drone-city-indicator grid size-6 shrink-0 place-items-center rounded-full"
                                  title="Drone media available"
                                  aria-label="Drone media available"
                                >
                                  <Drone className="size-3.5" />
                                </span>
                              ) : null}
                            </button>
                          </div>

                          {isCitySelected && cityHasDroneMedia ? (
                            <button
                              type="button"
                              onClick={() => onSelectDroneMedia(city.id)}
                              data-active={isDroneMediaActive}
                              className="drone-media-entry ml-3 mt-1.5 flex w-[calc(100%-12px)] items-center gap-2 rounded-full border px-3 py-2 text-left text-[11px] font-semibold transition duration-200"
                            >
                              <Drone className="size-3.5 shrink-0" />
                              <span className="truncate">{`\u65e0\u4eba\u673a / Drone Media`}</span>
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="atlas-image-tuning atlas-panel-body mt-3 shrink-0 border-t">
        <div className={`atlas-scale-heading flex items-center justify-between gap-3 ${isImageTuningOpen ? 'mb-3' : ''}`}>
          <button
            aria-controls="atlas-image-tuning-controls"
            aria-expanded={isImageTuningOpen}
            className="atlas-accordion-trigger flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
            onClick={() => setIsImageTuningOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <SlidersHorizontal className="size-4 text-slate-500" />
              Map Tuning
            </span>
            <ChevronDown className={`atlas-accordion-chevron size-4 shrink-0 ${isImageTuningOpen ? '' : 'rotate-180'}`} />
          </button>
          {isImageTuningOpen ? (
            <button
              aria-label="Reset Earth image tuning"
              className="atlas-scale-reset grid size-9 shrink-0 place-items-center rounded-lg border"
              onClick={onResetImageryTuning}
              title="Reset Earth image tuning"
              type="button"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-9 shrink-0" />
          )}
        </div>

        {isImageTuningOpen ? (
          <div className="atlas-accordion-content" id="atlas-image-tuning-controls">
            <label className="atlas-image-control grid grid-cols-[68px_1fr_34px] items-center gap-2">
              <span>Saturation</span>
              <input
                aria-label="Earth imagery saturation"
                className="atlas-image-slider atlas-slider w-full"
                max="1.5"
                min="0.5"
                step="0.01"
                type="range"
                value={imagerySaturation}
                onChange={(event) => onSaturationChange(Number(event.currentTarget.value))}
              />
              <output>{imagerySaturation.toFixed(2)}</output>
            </label>

            <label className="atlas-image-control grid grid-cols-[68px_1fr_34px] items-center gap-2">
              <span>Contrast</span>
              <input
                aria-label="Earth imagery contrast"
                className="atlas-image-slider atlas-slider w-full"
                max="1.4"
                min="0.7"
                step="0.01"
                type="range"
                value={imageryContrast}
                onChange={(event) => onContrastChange(Number(event.currentTarget.value))}
              />
              <output>{imageryContrast.toFixed(2)}</output>
            </label>

            <label className="atlas-image-control grid grid-cols-[68px_1fr_34px] items-center gap-2">
              <span>Brightness</span>
              <input
                aria-label="Earth imagery brightness"
                className="atlas-image-slider atlas-slider w-full"
                max="1.4"
                min="0.4"
                step="0.01"
                type="range"
                value={imageryBrightness}
                onChange={(event) => onBrightnessChange(Number(event.currentTarget.value))}
              />
              <output>{imageryBrightness.toFixed(2)}</output>
            </label>
          </div>
        ) : null}
      </div>

      <div className="atlas-scale-panel atlas-panel-body mt-3 shrink-0 rounded-[22px] border border-white/70 bg-white/54 p-3.5">
        <div className={`atlas-scale-heading flex items-center justify-between gap-3 ${isGlobeScaleOpen ? 'mb-3' : ''}`}>
          <button
            aria-controls="atlas-globe-scale-controls"
            aria-expanded={isGlobeScaleOpen}
            className="atlas-accordion-trigger flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
            onClick={() => setIsGlobeScaleOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <SlidersHorizontal className="size-4 text-slate-500" />
              Globe Scale
            </span>
            <ChevronDown className={`atlas-accordion-chevron size-4 shrink-0 ${isGlobeScaleOpen ? '' : 'rotate-180'}`} />
          </button>
          {isGlobeScaleOpen ? (
            <button
              type="button"
              aria-label="Reset globe to overview"
              title="Reset globe to overview"
              onClick={onResetView}
              className="atlas-scale-reset grid size-9 shrink-0 place-items-center rounded-lg border"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-9 shrink-0" />
          )}
        </div>
        {isGlobeScaleOpen ? (
          <div className="atlas-accordion-content" id="atlas-globe-scale-controls">
            <input
              aria-label="Globe scale"
              className="atlas-slider w-full"
              defaultValue={globeDistance}
              key={globeDistance}
              max="3.25"
              min="1"
              step="0.05"
              type="range"
              onInput={(event) => {
                const nextDistance = Number(event.currentTarget.value)
                hasDraftDistanceChangeRef.current =
                  Math.abs(nextDistance - committedDistanceRef.current) > 0.001
                debugGlobeScaleChange(nextDistance)
              }}
              onKeyUp={(event) => commitGlobeDistance(Number(event.currentTarget.value))}
              onBlur={(event) => commitGlobeDistance(Number(event.currentTarget.value))}
              onPointerCancel={(event) => commitGlobeDistance(Number(event.currentTarget.value))}
              onPointerUp={(event) => commitGlobeDistance(Number(event.currentTarget.value))}
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
              <span>City</span>
              <span>Country</span>
              <span>World</span>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
