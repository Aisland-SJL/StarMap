import type { CityId, CountryId } from '../types/travel'

export type ImportedMediaKind = 'photo' | 'panorama360' | 'aerialPhoto' | 'video'

export type ImportedMediaVariant = {
  src: string
  width?: number
  height?: number
}

export type ImportedMediaCatalogItem = {
  id: string
  kind: ImportedMediaKind
  scope: 'city'
  countryId: CountryId
  countryName: string
  cityId: CityId
  cityName: string
  src: string
  width?: number
  height?: number
  variants?: {
    thumb?: ImportedMediaVariant
    preview?: ImportedMediaVariant
    original: ImportedMediaVariant
  }
  originalFileName: string
  titleZh?: string
  titleEn?: string
  date?: string
  resolution?: string
  captureType?: string
  description?: string
  position?: {
    lat: number
    lng: number
    altitudeMeters?: number
  }
  isCover: boolean
  status: 'ready' | 'needsMetadata'
}

type LocalMediaCatalog = {
  schemaVersion: number
  items: ImportedMediaCatalogItem[]
}

const localCatalogModules = import.meta.glob('./generated/user-media.local.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const isCatalog = (value: unknown): value is LocalMediaCatalog => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LocalMediaCatalog>
  return (candidate.schemaVersion === 1 || candidate.schemaVersion === 2) && Array.isArray(candidate.items)
}

export const getMediaSource = (
  item: ImportedMediaCatalogItem,
  variant: 'thumb' | 'preview' | 'original',
) => item.variants?.[variant]?.src ?? item.variants?.original.src ?? item.src

export const importedMediaItems = Object.values(localCatalogModules)
  .filter(isCatalog)
  .flatMap((catalog) => catalog.items)

export const getCityPhotos = (cityId?: CityId) =>
  cityId
    ? importedMediaItems.filter((item) => item.kind === 'photo' && item.cityId === cityId && item.status === 'ready')
    : []

export const getCityCoverPhoto = (cityId?: CityId) => {
  const cityPhotos = getCityPhotos(cityId)
  return cityPhotos.find((item) => item.isCover) ?? cityPhotos[0]
}

export const importedDroneMediaCatalogItems = importedMediaItems.filter(
  (item) => (
    (item.kind === 'panorama360' || item.kind === 'aerialPhoto')
    && item.status === 'ready'
    && Boolean(item.cityId)
    && Boolean(item.date)
    && Boolean(item.resolution)
    && Boolean(item.position)
  ),
)
