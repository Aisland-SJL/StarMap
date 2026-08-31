import type { CityId, CountryId } from '../types/travel'
import { orderBySavedIds, travelAtlasEditorState } from './editorState'
import { privateMediaCatalog } from 'virtual:starmap-private-data'

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
  altitudeMeters?: number
  relativeAltitudeMeters?: number
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

const isCatalog = (value: unknown): value is LocalMediaCatalog => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LocalMediaCatalog>
  return (candidate.schemaVersion === 1 || candidate.schemaVersion === 2) && Array.isArray(candidate.items)
}

export const getMediaSource = (
  item: ImportedMediaCatalogItem,
  variant: 'thumb' | 'preview' | 'original',
) => item.variants?.[variant]?.src ?? item.variants?.original.src ?? item.src

export const allImportedMediaItems = isCatalog(privateMediaCatalog)
  ? privateMediaCatalog.items
  : []

const hiddenMediaIds = new Set([
  ...travelAtlasEditorState.hiddenMediaIds,
  ...travelAtlasEditorState.hiddenDroneMediaIds,
])

export const importedMediaItems = allImportedMediaItems.filter((item) => !hiddenMediaIds.has(item.id))

export const getCityPhotos = (cityId?: CityId) =>
  cityId
    ? orderBySavedIds(
        importedMediaItems.filter((item) => item.kind === 'photo' && item.cityId === cityId && item.status === 'ready'),
        travelAtlasEditorState.mediaOrderByCity[cityId],
      )
    : []

export const getCityCoverPhoto = (cityId?: CityId) => {
  const cityPhotos = getCityPhotos(cityId)
  const savedCoverId = cityId ? travelAtlasEditorState.coverMediaByCity[cityId] : undefined
  return cityPhotos.find((item) => item.id === savedCoverId)
    ?? cityPhotos.find((item) => item.isCover)
    ?? cityPhotos[0]
}

export const importedDroneMediaCatalogItems = Object.entries(
  importedMediaItems.filter(
    (item) => (
    (item.kind === 'panorama360' || item.kind === 'aerialPhoto')
    && item.status === 'ready'
    && Boolean(item.cityId)
    && Boolean(item.date)
    && Boolean(item.resolution)
    ),
  ).reduce((byCity, item) => {
    byCity[item.cityId] = [...(byCity[item.cityId] ?? []), item]
    return byCity
  }, {} as Record<CityId, ImportedMediaCatalogItem[]>),
).flatMap(([cityId, items]) => orderBySavedIds(items, travelAtlasEditorState.droneOrderByCity[cityId]))
