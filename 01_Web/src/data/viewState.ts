import type { AtlasPage } from '../components/AtlasHeader'
import type { JourneyViewMode } from '../components/JourneyViewToggle'
import type { CityId, CountryId, SelectionMode } from '../types/travel'

export type AtlasViewState = {
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  selectedDayId?: string
  selectionMode: SelectionMode
  globeDistance: number
  activePage: AtlasPage
  pageBeforeUpdate: Exclude<AtlasPage, 'about'>
  journeyViewMode: JourneyViewMode
  activeDroneMediaCityId?: CityId
  activeDroneMediaItemId?: string
  sidebarsOpen: boolean
}

const viewStateKey = 'starmap:view-state:v1'

export const readAtlasViewState = (): Partial<AtlasViewState> => {
  if (typeof window === 'undefined') return {}

  try {
    const value = JSON.parse(window.sessionStorage.getItem(viewStateKey) ?? '{}')
    return value && typeof value === 'object' ? value as Partial<AtlasViewState> : {}
  } catch {
    return {}
  }
}

export const rememberAtlasViewState = (state: AtlasViewState) => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(viewStateKey, JSON.stringify(state))
  } catch {
    // A failed browser storage write must never block local editing or navigation.
  }
}
