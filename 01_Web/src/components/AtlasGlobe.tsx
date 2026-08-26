// Legacy react-globe implementation. Frozen for historical fallback only.
// Do not modify unless the user explicitly requests changes to the legacy map.
import { useEffect, useMemo, useRef } from 'react'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import { cities, cityById, countryById, routes } from '../data/travelAtlas'
import type { City, CityId, CountryId, GlobeViewMode } from '../types/travel'

type AtlasGlobeProps = {
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  hoverCityId?: CityId
  viewMode: GlobeViewMode
  globeDistance: number
  isNight?: boolean
  onSelectCity: (cityId: CityId) => void
}

type CityPin = City & {
  size: number
  lat: number
  lng: number
}

const earthTexture = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
const bumpTexture = 'https://unpkg.com/three-globe/example/img/earth-topology.png'
const overviewAltitude = 3.15
const focusFallbackAltitude = 2.15
const overviewLat = 18
const overviewLng = 12

export function AtlasGlobe({
  selectedCountryId,
  selectedCityId,
  hoverCityId,
  viewMode,
  globeDistance,
  isNight = false,
  onSelectCity,
}: AtlasGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const activeCityId = hoverCityId ?? selectedCityId
  const selectedCountry = selectedCountryId ? countryById[selectedCountryId] : undefined
  const selectedAccent = selectedCountry?.accent ?? '#7dd3fc'

  const pins = useMemo<CityPin[]>(
    () =>
      cities
        .filter((city): city is CityPin => typeof city.lat === 'number' && typeof city.lng === 'number')
        .map((city) => {
          const isCountryCity = selectedCountryId ? city.countryId === selectedCountryId : false

          return {
            ...city,
            size: city.id === activeCityId ? 1.34 : isCountryCity ? 1 : 0.58,
          }
        }),
    [activeCityId, selectedCountryId],
  )

  const arcs = useMemo(
    () =>
      routes.flatMap((route) => {
        const from = cityById[route.fromCityId]
        const to = cityById[route.toCityId]
        if (!from || !to || typeof from.lat !== 'number' || typeof from.lng !== 'number' || typeof to.lat !== 'number' || typeof to.lng !== 'number') {
          return []
        }
        const isDirectCityRoute = route.fromCityId === activeCityId || route.toCityId === activeCityId
        const isCountryRoute = selectedCountryId ? from.countryId === selectedCountryId || to.countryId === selectedCountryId : false
        const active = activeCityId ? isDirectCityRoute : isCountryRoute
        const muted = viewMode !== 'overview' && !active
        const routeAccent = countryById[to.countryId ?? selectedCountryId ?? from.countryId ?? '']?.accent ?? selectedAccent

        return [{
          ...route,
          startLat: from.lat,
          startLng: from.lng,
          endLat: to.lat,
          endLng: to.lng,
          color: active
            ? ['rgba(255,255,255,0.84)', routeAccent]
            : muted
              ? ['rgba(255,255,255,0.03)', 'rgba(176,205,255,0.07)']
              : route.type === 'main'
                ? ['rgba(255,255,255,0.16)', 'rgba(176,205,255,0.28)']
                : ['rgba(255,255,255,0.11)', 'rgba(255,214,153,0.22)'],
          stroke: active ? 0.48 : muted ? 0.1 : route.type === 'main' ? 0.24 : 0.18,
          altitude: route.type === 'flight' ? 0.12 : route.type === 'main' ? 0.08 : 0.05,
          dash: active ? 0.62 : 0.38,
        }]
      }),
    [activeCityId, selectedAccent, selectedCountryId, viewMode],
  )

  const rings = useMemo(() => {
    const city = selectedCityId ? cityById[selectedCityId] : undefined

    if (city && typeof city.lat === 'number' && typeof city.lng === 'number') {
      return [{
        lat: city.lat,
        lng: city.lng,
        color: selectedAccent,
        radius: 3.4,
      }]
    }

    return []
  }, [selectedAccent, selectedCityId])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    const controls = globe.controls()
    controls.autoRotateSpeed = 0.16
    controls.enableDamping = true
    controls.enableZoom = false
  }, [])

  useEffect(() => {
    const controls = globeRef.current?.controls()
    if (!controls) return
    controls.autoRotate = viewMode === 'overview'
  }, [viewMode])

  useEffect(() => {
    const focus = viewMode === 'overview' ? undefined : activeCityId ? cityById[activeCityId] : selectedCountry
    const lat = focus && 'lat' in focus ? focus.lat : focus?.centerLat
    const lng = focus && 'lng' in focus ? focus.lng : focus?.centerLng

    globeRef.current?.pointOfView({
      lat: viewMode === 'overview' ? overviewLat : typeof lat === 'number' ? lat : overviewLat,
      lng: viewMode === 'overview' ? overviewLng : typeof lng === 'number' ? lng : overviewLng,
      altitude: viewMode === 'overview'
        ? overviewAltitude
        : typeof lat === 'number' && typeof lng === 'number'
          ? globeDistance
          : focusFallbackAltitude,
    }, viewMode === 'overview' ? 1100 : 1250)
  }, [activeCityId, globeDistance, selectedCountry, viewMode])

  return (
    <div className="pointer-events-auto relative z-0 mx-auto h-[780px] w-full max-w-[1160px] overflow-visible">
      <div className="pointer-events-none absolute inset-x-[8%] top-[8%] h-[72%] rounded-full bg-sky-200/20 blur-3xl" />
      <Globe
        ref={globeRef}
        width={1160}
        height={780}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={earthTexture}
        bumpImageUrl={bumpTexture}
        showAtmosphere
        atmosphereColor={isNight ? '#6ca8ff' : '#dcecff'}
        atmosphereAltitude={isNight ? 0.16 : 0.2}
        arcsData={arcs}
        arcColor="color"
        arcStroke="stroke"
        arcAltitude="altitude"
        arcDashLength="dash"
        arcDashGap={0.82}
        arcDashAnimateTime={3600}
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringColor={(ring: object) => {
          const current = ring as { color: string }
          return () => current.color
        }}
        ringMaxRadius={(ring: object) => (ring as { radius: number }).radius}
        ringPropagationSpeed={0.9}
        ringRepeatPeriod={1500}
        htmlElementsData={pins}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={(pin: object) => ((pin as CityPin).id === activeCityId ? 0.035 : 0.02)}
        htmlElement={(pin: object) => {
          const city = pin as CityPin
          const isActive = city.id === activeCityId
          const isCountryCity = selectedCountryId ? city.countryId === selectedCountryId : false
          const cityCountry = countryById[city.countryId ?? selectedCountryId ?? '']
          const pinAccent = cityCountry?.accent ?? selectedAccent
          const el = document.createElement('button')
          el.type = 'button'
          el.className = isActive ? 'globe-pin globe-pin-active' : isCountryCity ? 'globe-pin globe-pin-country' : 'globe-pin'
          el.style.setProperty('--pin-color', pinAccent)
          el.style.setProperty('--pin-size', `${city.size}`)
          el.title = `${city.nameEn}, ${cityCountry?.nameEn ?? 'StarMap'}`
          el.onclick = () => onSelectCity(city.id)
          el.innerHTML = `<span class="globe-pin-pulse"></span><span class="globe-pin-dot"></span>${
            isActive ? `<span class="globe-pin-label">${city.nameEn ?? ''}</span>` : ''
          }`
          return el
        }}
      />
    </div>
  )
}
