export type CountryId = string

export type CityId = string

export type TravelRecordCategory =
  | 'destination'
  | 'transit'
  | 'origin'
  | 'return'
  | 'dayTrip'
  | 'region'
  | 'attraction'

export type TravelMapRecord = {
  id: string
  country: string
  country_en: string
  country_code?: string
  city: string
  city_en: string
  region?: string
  start_date: string
  end_date?: string
  year?: number
  trip_title?: string
  type?: string
  status?: string
  lat: number | null
  lng: number | null
  notes?: string
  source?: string
  travelCategory?: TravelRecordCategory
  hiddenFromHome?: boolean
  journeyId?: string
}

export type Country = {
  id: CountryId
  nameZh: string
  nameEn: string
  centerLat: number | null
  centerLng: number | null
  visitedDateRange: string
  summary: string
  memory: string
  keywords?: string[]
  cityIds: CityId[]
  accent: string
  flag?: string
  flagCode?: string
  missingCoordinates?: boolean
  records?: TravelMapRecord[]
}

export type City = {
  id: CityId
  nameZh?: string
  nameEn?: string
  countryId?: CountryId
  lat: number | null
  lng: number | null
  visitedDateRange?: string
  summary?: string
  memory?: string
  keywords?: string[]
  name?: string
  localName?: string
  country?: string
  visited?: boolean
  accent?: string
  themes?: string[]
  missingCoordinates?: boolean
  records?: TravelMapRecord[]
}

export type JourneyDay = {
  id: string
  date: string
  countryId?: CountryId
  cityId: CityId
  secondaryCityId?: CityId
  title: string
  summary?: string
  journeyId?: string
  dayLabel?: string
  description?: string
  contentAngle?: string
  isHighlight?: boolean
}

export type Route = {
  id: string
  fromCityId: CityId
  toCityId: CityId
  journeyId?: string
  type: 'main' | 'dayTrip' | 'flight' | 'ferry' | 'drive'
}

export type GlobeViewMode = 'overview' | 'focusCountry' | 'focusCity'

export type SelectionMode = 'overview' | 'country' | 'city'

export type RouteLink = {
  id: string
  from: CityId
  to: CityId
  kind: 'main' | 'day-trip'
}
