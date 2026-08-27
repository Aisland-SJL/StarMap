import type { CityId } from '../types/travel'
import { getMediaSource, importedDroneMediaCatalogItems } from './mediaCatalog'

export type DroneMediaType = 'panorama360' | 'aerialPhoto'

export type DroneMediaItem = {
  id: string
  cityId: CityId
  type: DroneMediaType
  titleZh: string
  titleEn: string
  src: string
  previewSrc: string
  thumbSrc: string
  date: string
  resolution: string
  captureType: string
  fileName: string
  city: string
  country: string
  description?: string
  altitudeMeters?: number
  relativeAltitudeMeters?: number
  position?: {
    lat: number
    lng: number
    altitudeMeters?: number
  }
}

const importedDroneMediaItems: DroneMediaItem[] = importedDroneMediaCatalogItems.flatMap((item) => {
  if (
    (item.kind !== 'panorama360' && item.kind !== 'aerialPhoto')
    || !item.cityId
    || !item.date
    || !item.resolution
  ) return []

  return [{
    id: item.id,
    cityId: item.cityId,
    type: item.kind,
    titleZh: item.titleZh ?? item.titleEn ?? item.cityName ?? '无人机影像',
    titleEn: item.titleEn ?? item.titleZh ?? item.cityName ?? 'Drone Media',
    src: getMediaSource(item, 'original'),
    previewSrc: getMediaSource(item, 'preview'),
    thumbSrc: getMediaSource(item, 'thumb'),
    date: item.date,
    resolution: item.resolution,
    captureType: item.captureType ?? (item.kind === 'panorama360' ? 'Drone 360 Panorama' : 'Aerial Photo'),
    fileName: item.originalFileName,
    city: item.cityName ?? item.cityId,
    country: item.countryName,
    description: item.description,
    altitudeMeters: item.altitudeMeters ?? item.position?.altitudeMeters,
    relativeAltitudeMeters: item.relativeAltitudeMeters,
    position: item.position,
  }]
})

export const droneMediaItems: DroneMediaItem[] = importedDroneMediaItems

export const droneMediaByCity = droneMediaItems.reduce(
  (acc, item) => {
    acc[item.cityId] = [...(acc[item.cityId] ?? []), item]
    return acc
  },
  {} as Partial<Record<CityId, DroneMediaItem[]>>,
)

export const getDroneMediaForCity = (cityId?: CityId) =>
  cityId ? droneMediaByCity[cityId] ?? [] : []

export const hasDroneMedia = (cityId?: CityId) =>
  getDroneMediaForCity(cityId).length > 0

export const droneMediaById = droneMediaItems.reduce(
  (acc, item) => {
    acc[item.id] = item
    return acc
  },
  {} as Record<string, DroneMediaItem>,
)
