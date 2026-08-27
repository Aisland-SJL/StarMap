import {
  Credit,
  Ion,
  TileMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  buildModuleUrl,
  createWorldImageryAsync,
} from 'cesium'
import type { ImageryProvider } from 'cesium'

export type MapSourceId = 'cesium' | 'tianditu' | 'local'

export type MapSourceOption = {
  id: MapSourceId
  label: string
  description: string
  configured: boolean
}

type MapSourceLayers = {
  base: ImageryProvider | Promise<ImageryProvider>
  labels?: ImageryProvider
}

const cesiumIonToken = (import.meta.env.VITE_CESIUM_ION_TOKEN ?? '').trim()
const tiandituToken = (import.meta.env.VITE_TIANDITU_TOKEN ?? '').trim()
const configuredDefault = (import.meta.env.VITE_MAP_SOURCE ?? 'auto').trim().toLowerCase()
const mapSourceStorageKey = 'starmap:map-source'
const tiandituSubdomains = ['0', '1', '2', '3', '4', '5', '6', '7']
const tiandituTileMatrixLabels = Array.from({ length: 18 }, (_, index) => String(index + 1))

if (cesiumIonToken) {
  Ion.defaultAccessToken = cesiumIonToken
}

export const mapSourceOptions: MapSourceOption[] = [
  {
    id: 'cesium',
    label: 'Cesium',
    description: 'Cesium ion 全球影像',
    configured: Boolean(cesiumIonToken),
  },
  {
    id: 'tianditu',
    label: '天地图',
    description: '国内影像与中文注记',
    configured: Boolean(tiandituToken),
  },
  {
    id: 'local',
    label: '本地低清',
    description: '无需网络与凭据',
    configured: true,
  },
]

const configuredMapSourceIds = new Set<MapSourceId>(
  mapSourceOptions.filter((option) => option.configured).map((option) => option.id),
)

const isConfiguredMapSource = (value: string | null): value is MapSourceId => (
  value !== null && configuredMapSourceIds.has(value as MapSourceId)
)

const automaticMapSource = (): MapSourceId => {
  if (cesiumIonToken) return 'cesium'
  if (tiandituToken) return 'tianditu'
  return 'local'
}

export const getInitialMapSource = (): MapSourceId => {
  if (typeof window !== 'undefined') {
    try {
      const storedSource = window.localStorage.getItem(mapSourceStorageKey)
      if (isConfiguredMapSource(storedSource)) return storedSource
    } catch {
      // Storage can be unavailable in privacy-focused browser modes.
    }
  }

  if (configuredDefault !== 'auto' && isConfiguredMapSource(configuredDefault)) {
    return configuredDefault
  }

  return automaticMapSource()
}

export const rememberMapSource = (source: MapSourceId) => {
  if (!isConfiguredMapSource(source) || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(mapSourceStorageKey, source)
  } catch {
    // The selected source still works for this session when storage is blocked.
  }
}

const createLocalImagery = () => TileMapServiceImageryProvider.fromUrl(
  buildModuleUrl('Assets/Textures/NaturalEarthII'),
)

const createTiandituImagery = (layer: 'img' | 'cia', includeCredit = false) => (
  new WebMapTileServiceImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/${layer}_w/wmts?tk=${encodeURIComponent(tiandituToken)}`,
    layer,
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    tileMatrixLabels: tiandituTileMatrixLabels,
    subdomains: tiandituSubdomains,
    maximumLevel: 17,
    enablePickFeatures: false,
    credit: includeCredit ? new Credit('天地图') : undefined,
  })
)

export const createMapSourceLayers = (source: MapSourceId): MapSourceLayers => {
  if (source === 'cesium' && cesiumIonToken) {
    return { base: createWorldImageryAsync().catch(createLocalImagery) }
  }

  if (source === 'tianditu' && tiandituToken) {
    return {
      base: createTiandituImagery('img', true),
      labels: createTiandituImagery('cia'),
    }
  }

  return { base: createLocalImagery() }
}
