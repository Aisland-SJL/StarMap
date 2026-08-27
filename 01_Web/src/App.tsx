import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { AtlasHeader } from './components/AtlasHeader'
import type { AtlasPage } from './components/AtlasHeader'
import { CesiumAtlasGlobe } from './components/CesiumAtlasGlobe'
import { CountrySelector } from './components/CountrySelector'
import type { ThemeMode } from './components/DayNightToggle'
import { MeteorShowerButton } from './components/MeteorShowerButton'
import { MapSourceSwitcher } from './components/MapSourceSwitcher'
import { MouseControlGuide } from './components/MouseControlGuide'
import { DroneMediaCard } from './components/DroneMediaCard'
import { InfoCard } from './components/InfoCard'
import { CityPhotoGalleryModal } from './components/CityPhotoGalleryModal'
import type { CityPhotoGalleryRequest } from './components/CityPhotoGalleryModal'
import { Timeline } from './components/Timeline'
import { ReleaseUpdateButton, ReleaseUpdatePage } from './components/UpdateChecker'
import { JourneyViewToggle } from './components/JourneyViewToggle'
import type { JourneyViewMode } from './components/JourneyViewToggle'
import { JourneyYearCards } from './components/JourneyYearCards'
import type { DroneMediaItem } from './data/droneMedia'
import { hasDroneMedia } from './data/droneMedia'
import { localEditorAvailable } from './data/editorState'
import { getInitialMapSource, rememberMapSource } from './data/mapSources'
import type { MapSourceId } from './data/mapSources'
import { useReleaseUpdates } from './data/releaseUpdates'
import { cities, cityById, countries, getCitiesForCountry, journeyDays, travelAtlasMeta } from './data/travelAtlas'
import type { CityId, CountryId, JourneyDay, SelectionMode } from './types/travel'

const DronePanoramaModal = lazy(() =>
  import('./components/DronePanoramaModal').then((module) => ({
    default: module.DronePanoramaModal,
  })),
)

const overviewDistance = 3.25
const countryDistance = 1.95
const cityDistance = 1.38
const sidebarMediaQuery = '(min-width: 1100px)'

type CameraScale = 'city' | 'country' | 'world'
type ImageryTuning = {
  brightness: number
  contrast: number
  saturation: number
}

const imageryTuningDefaults: Record<ThemeMode, ImageryTuning> = {
  day: { brightness: 1, contrast: 1, saturation: 1 },
  night: { brightness: 0.68, contrast: 1.08, saturation: 0.86 },
}

const cameraScaleForDistance = (distance: number): CameraScale => {
  if (distance < 1.68) return 'city'
  if (distance < 2.55) return 'country'
  return 'world'
}

function App() {
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId | undefined>()
  const [selectedCityId, setSelectedCityId] = useState<CityId | undefined>()
  const [hoveredCountryId, setHoveredCountryId] = useState<CountryId | undefined>()
  const [selectedDayId, setSelectedDayId] = useState<string>(() =>
    [...journeyDays].sort((left, right) =>
      `${right.date}-${right.id}`.localeCompare(`${left.date}-${left.id}`),
    )[0]?.id ?? '',
  )
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('overview')
  const [, setHoverCityId] = useState<CityId>()
  const [globeDistance, setGlobeDistance] = useState(overviewDistance)
  const [globeResetVersion, setGlobeResetVersion] = useState(0)
  const [activePage, setActivePage] = useState<AtlasPage>('map')
  const [pageBeforeUpdate, setPageBeforeUpdate] = useState<Exclude<AtlasPage, 'about'>>('map')
  const [imageryTuningByTheme, setImageryTuningByTheme] = useState(imageryTuningDefaults)
  const [mapSource, setMapSource] = useState<MapSourceId>(getInitialMapSource)
  const [journeyViewMode, setJourneyViewMode] = useState<JourneyViewMode>('timeline')
  const [activeDroneMediaCityId, setActiveDroneMediaCityId] = useState<CityId>()
  const [activeDroneMediaItemId, setActiveDroneMediaItemId] = useState<string>()
  const [panoramaModalItem, setPanoramaModalItem] = useState<DroneMediaItem>()
  const [cityPhotoGallery, setCityPhotoGallery] = useState<CityPhotoGalleryRequest>()
  const [sidebarsOpen, setSidebarsOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(sidebarMediaQuery).matches,
  )
  const releaseUpdates = useReleaseUpdates()
  const selectedCityHasDroneMedia = selectionMode === 'city' && selectedCityId
    ? hasDroneMedia(selectedCityId)
    : false
  const shouldShowDronePanel = Boolean(
    selectionMode === 'city' && selectedCityId && (selectedCityHasDroneMedia || localEditorAvailable),
  )
  const activeTheme: ThemeMode = 'night'
  const imageryTuning = {
    ...imageryTuningDefaults[activeTheme],
    ...imageryTuningByTheme[activeTheme],
  }

  const updateImageryTuning = (property: keyof ImageryTuning, value: number) => {
    setImageryTuningByTheme((current) => ({
      ...current,
      [activeTheme]: {
        ...current[activeTheme],
        [property]: value,
      },
    }))
  }

  const resetImageryTuning = () => {
    setImageryTuningByTheme((current) => ({
      ...current,
      [activeTheme]: { ...imageryTuningDefaults[activeTheme] },
    }))
  }

  const changePrimaryPage = (page: AtlasPage) => {
    if (page !== 'about') {
      setPageBeforeUpdate(page)
    }
    setActivePage(page)
  }

  const toggleUpdatePage = () => {
    if (activePage === 'about') {
      setActivePage(pageBeforeUpdate)
      return
    }

    releaseUpdates.markSeen()
    setPageBeforeUpdate(activePage)
    setActivePage('about')
  }

  useEffect(() => {
    document.documentElement.lang = 'zh-CN'
    const mediaQuery = window.matchMedia(sidebarMediaQuery)
    const syncSidebarVisibility = (event: MediaQueryListEvent) => setSidebarsOpen(event.matches)

    mediaQuery.addEventListener('change', syncSidebarVisibility)
    return () => mediaQuery.removeEventListener('change', syncSidebarVisibility)
  }, [])

  const atlasStats = useMemo(
    () => [
      { value: `${countries.length}`, label: 'Countries / 国家' },
      { value: `${cities.length}`, label: 'Cities / 城市' },
      { value: `${travelAtlasMeta.totalRecords}`, label: 'Records / 行程' },
      { value: `${travelAtlasMeta.recordsWithCoordinates}`, label: 'Mapped / 坐标' },
    ],
    [],
  )

  const resetOverview = () => {
    setSelectedCountryId(undefined)
    setSelectedCityId(undefined)
    setActiveDroneMediaCityId(undefined)
    setActiveDroneMediaItemId(undefined)
    setSelectionMode('overview')
    setGlobeDistance(overviewDistance)
    setGlobeResetVersion((version) => version + 1)
  }

  const selectCountry = (countryId: CountryId) => {
    if (selectedCountryId === countryId && selectionMode !== 'overview') {
      resetOverview()
      return
    }

    setSelectedCountryId(countryId)
    setSelectedCityId(undefined)
    setActiveDroneMediaCityId(undefined)
    setActiveDroneMediaItemId(undefined)
    setSelectionMode('country')
    setGlobeDistance(countryDistance)
  }

  const selectCity = (cityId: CityId) => {
    if (selectedCityId === cityId) {
      setSelectedCityId(undefined)
      setActiveDroneMediaCityId(undefined)
      setActiveDroneMediaItemId(undefined)
      setSelectionMode('country')
      setGlobeDistance(countryDistance)
      return
    }

    const city = cityById[cityId]
    if (city.countryId) setSelectedCountryId(city.countryId)
    setSelectedCityId(cityId)
    setActiveDroneMediaCityId(undefined)
    setActiveDroneMediaItemId(undefined)
    setSelectionMode('city')
    setGlobeDistance(cityDistance)
  }

  const selectDroneMedia = (cityId: CityId) => {
    const city = cityById[cityId]
    if (!city || !hasDroneMedia(cityId)) return

    if (activeDroneMediaCityId === cityId) {
      setActiveDroneMediaCityId(undefined)
      setActiveDroneMediaItemId(undefined)
      return
    }

    if (city.countryId) setSelectedCountryId(city.countryId)
    setSelectedCityId(cityId)
    setActiveDroneMediaCityId(cityId)
    setActiveDroneMediaItemId(undefined)
    setSelectionMode('city')
    setGlobeDistance(cityDistance)
  }

  const selectDroneMediaItem = (item: DroneMediaItem) => {
    if (!item.position) return
    if (activeDroneMediaItemId === item.id) {
      setActiveDroneMediaItemId(undefined)
      setActiveDroneMediaCityId(undefined)
      return
    }

    const city = cityById[item.cityId]
    if (city?.countryId && selectedCountryId !== city.countryId) {
      setSelectedCountryId(city.countryId)
    }
    if (selectedCityId !== item.cityId) {
      setSelectedCityId(item.cityId)
    }
    if (activeDroneMediaCityId !== item.cityId) {
      setActiveDroneMediaCityId(item.cityId)
    }
    setActiveDroneMediaItemId(item.id)
    if (selectionMode !== 'city') setSelectionMode('city')
    if (globeDistance !== cityDistance) setGlobeDistance(cityDistance)
  }

  const openPanorama = (item: DroneMediaItem) => {
    if (item.position && activeDroneMediaItemId !== item.id) selectDroneMediaItem(item)
    setPanoramaModalItem(item)
  }

  const changeGlobeDistance = (distance: number) => {
    if (Math.abs(distance - globeDistance) <= 0.001) return

    const cameraScale = cameraScaleForDistance(distance)

    setActiveDroneMediaItemId(undefined)
    setActiveDroneMediaCityId(undefined)

    if (cameraScale === 'city') {
      if (selectedCityId) {
        setSelectionMode('city')
      } else if (selectedCountryId) {
        const firstCountryCity = getCitiesForCountry(selectedCountryId)[0]

        if (firstCountryCity) {
          setSelectedCityId(firstCountryCity.id)
          setSelectionMode('city')
        } else {
          setSelectionMode('country')
        }
      } else {
        setSelectionMode('overview')
      }
    } else if (cameraScale === 'country') {
      setSelectionMode(selectedCountryId ? 'country' : 'overview')
    } else {
      setSelectionMode('overview')
    }

    setGlobeDistance(distance)
  }

  const selectDay = (day: JourneyDay) => {
    setSelectedDayId(day.id)
    if (day.countryId) setSelectedCountryId(day.countryId)
    setSelectedCityId(day.cityId)
    setActiveDroneMediaCityId(undefined)
    setActiveDroneMediaItemId(undefined)
    setSelectionMode('city')
    setGlobeDistance(cityDistance)
  }

  return (
    <main className="theme-night relative h-[100dvh] overflow-hidden bg-[#010409] text-slate-950">
      <div className="app-background fixed inset-0 -z-10" />
      <div className="app-grid fixed inset-0 -z-10" />
      <div className="star-field fixed inset-0 -z-10" />
      <AtlasHeader activePage={activePage} onPageChange={changePrimaryPage} />
      <section
        className="atlas-experience cesium-lab-page relative h-[100dvh] w-screen overflow-hidden"
        data-page={activePage}
        data-sidebars-open={sidebarsOpen}
      >
          <div className="absolute inset-0 z-0">
            <CesiumAtlasGlobe
              hoveredCountryId={hoveredCountryId}
              imageryBrightness={imageryTuning.brightness}
              imageryContrast={imageryTuning.contrast}
              imagerySaturation={imageryTuning.saturation}
              mapSource={mapSource}
              selectedCountryId={selectedCountryId}
              selectedCityId={selectedCityId}
              selectionMode={selectionMode}
              globeScale={globeDistance}
              resetVersion={globeResetVersion}
              isNight={activeTheme === 'night'}
              showMapContent={activePage === 'map'}
              activeDroneMediaCityId={activeDroneMediaCityId}
              activeDroneMediaItemId={activeDroneMediaItemId}
              onSelectCity={selectCity}
              onSelectDroneMediaItem={selectDroneMediaItem}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-20">
            <div
              className="atlas-overlay-frame absolute bottom-0"
              data-page={activePage}
              data-sidebars-open={sidebarsOpen}
            >
              <CountrySelector
                selectedCountryId={selectedCountryId}
                selectedCityId={selectedCityId}
                activeDroneMediaCityId={activeDroneMediaCityId}
                globeDistance={globeDistance}
                imageryBrightness={imageryTuning.brightness}
                imageryContrast={imageryTuning.contrast}
                imagerySaturation={imageryTuning.saturation}
                onBrightnessChange={(value) => updateImageryTuning('brightness', value)}
                onContrastChange={(value) => updateImageryTuning('contrast', value)}
                onHoverCountry={setHoveredCountryId}
                onResetImageryTuning={resetImageryTuning}
                onSaturationChange={(value) => updateImageryTuning('saturation', value)}
                onSelectCountry={selectCountry}
                onSelectCity={selectCity}
                onSelectDroneMedia={selectDroneMedia}
                onDistanceChange={changeGlobeDistance}
                onResetView={resetOverview}
              />

              <div
                className={`atlas-right-stack ${
                  shouldShowDronePanel ? 'atlas-right-stack-with-drone' : ''
                }`}
              >
                <InfoCard
                  key={`info-${selectionMode}-${selectedCountryId ?? 'none'}-${selectedCityId ?? 'none'}`}
                  mode={selectionMode}
                  selectedCountryId={selectedCountryId}
                  selectedCityId={selectedCityId}
                  onSelectCity={selectCity}
                  onOpenCityPhotos={setCityPhotoGallery}
                />

                {shouldShowDronePanel ? (
                  <DroneMediaCard
                    key={`drone-${selectedCityId ?? 'none'}`}
                    cityId={selectedCityId}
                    activeItemId={activeDroneMediaItemId}
                    onSelectItem={selectDroneMediaItem}
                    onOpenPanorama={openPanorama}
                  />
                ) : null}

                <MouseControlGuide language="zh" />
              </div>

            </div>
          </div>

          <div className="atlas-map-controls">
            <button
              type="button"
              className="atlas-dock-button atlas-sidebars-toggle pointer-events-auto"
              aria-pressed={sidebarsOpen}
              aria-label={sidebarsOpen ? 'Hide both sidebars' : 'Show both sidebars'}
              title={sidebarsOpen ? '隐藏侧边栏' : '显示侧边栏'}
              onClick={() => setSidebarsOpen((open) => !open)}
            >
              <span className="atlas-sidebars-toggle-icons" aria-hidden="true">
                {sidebarsOpen ? (
                  <>
                    <PanelLeftClose />
                    <PanelRightClose />
                  </>
                ) : (
                  <>
                    <PanelLeftOpen />
                    <PanelRightOpen />
                  </>
                )}
              </span>
            </button>
            <MapSourceSwitcher
              value={mapSource}
              onChange={(source) => {
                setMapSource(source)
                rememberMapSource(source)
              }}
            />
            <MeteorShowerButton />
            <ReleaseUpdateButton
              active={activePage === 'about'}
              state={releaseUpdates}
              onToggle={toggleUpdatePage}
            />
          </div>

          <div
            className="atlas-journey-stage absolute inset-0 z-30"
            aria-hidden={activePage !== 'journey'}
          >
            <div className="atlas-journey-scroll selector-scrollbar h-full overflow-y-auto overscroll-contain">
              <div className="atlas-journey-shell mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
                <section className="journey-command-panel">
                  <div className="journey-command-copy">
                    <p className="journey-kicker">Travel chronology</p>
                    <h2>Places, in the order they became memories.</h2>
                    <p>
                      A living index of visited cities, arranged from the newest journey backwards.
                    </p>
                  </div>

                  <div className="journey-command-actions">
                    <JourneyViewToggle value={journeyViewMode} onChange={setJourneyViewMode} />
                  </div>

                  <div className="journey-stats-grid">
                    {atlasStats.map((stat) => (
                      <div key={stat.label} className="journey-stat-card">
                        <p className="journey-stat-value">{stat.value}</p>
                        <p className="journey-stat-label">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {journeyViewMode === 'timeline' ? (
                  <Timeline
                    selectedDayId={selectedDayId}
                    onSelectDay={selectDay}
                    onHoverCity={setHoverCityId}
                  />
                ) : (
                  <JourneyYearCards />
                )}
              </div>
            </div>
          </div>

          <div
            className="atlas-update-stage absolute inset-0 z-30"
            aria-hidden={activePage !== 'about'}
          >
            <ReleaseUpdatePage state={releaseUpdates} />
          </div>
      </section>

      {panoramaModalItem ? (
        <Suspense fallback={null}>
          <DronePanoramaModal
            item={panoramaModalItem}
            onClose={() => setPanoramaModalItem(undefined)}
          />
        </Suspense>
      ) : null}

      {cityPhotoGallery ? (
        <CityPhotoGalleryModal
          {...cityPhotoGallery}
          onClose={() => setCityPhotoGallery(undefined)}
        />
      ) : null}
    </main>
  )
}

export default App
