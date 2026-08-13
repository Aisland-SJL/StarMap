export type Coordinate = {
  lat: number
  lng: number
  approximate?: boolean
}

export const normalizeGeoName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

// Public templates keep coordinates in their travel records. Private imports are
// enriched before they enter generated/travel-map.local.json, so this fallback
// remains intentionally empty and does not reveal a user's destination list.
export const countryCoordinates: Record<string, Coordinate> = {}

export const cityCoordinates: Record<string, Coordinate> = {}

export const getCountryCoordinate = (name: string) => countryCoordinates[normalizeGeoName(name)]

export const getCityCoordinate = (name: string) => cityCoordinates[normalizeGeoName(name)]
