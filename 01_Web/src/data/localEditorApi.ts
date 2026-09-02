import type { TravelAtlasEditorState } from './editorState'

type EditorResponse<T> = {
  ok: boolean
  error?: string
  details?: string
} & T

const editorHeaders = {
  'content-type': 'application/json',
  'x-travelatlas-local-editor': '1',
}

const parseResponse = async <T,>(response: Response) => {
  const body = await response.json() as EditorResponse<T>
  if (!response.ok || !body.ok) {
    throw new Error([body.error, body.details].filter(Boolean).join('\n') || '本地编辑操作失败。')
  }
  return body
}

export type CountrySearchOption = {
  id: string
  nameZh: string
  nameEn: string
  countryCode: string
  centerLat: number
  centerLng: number
  region?: string
}

export type CitySearchOption = {
  id: string
  nameZh: string
  nameEn: string
  countryCode: string
  lat: number
  lng: number
  detail: string
  provider: 'cesium' | 'openstreetmap' | 'manual'
}

export const searchLocalCountries = async (query: string, signal?: AbortSignal) => {
  const search = new URLSearchParams({ q: query })
  const response = await fetch(`/__travelatlas/editor/catalog/countries?${search}`, {
    cache: 'no-store',
    signal,
  })
  return (await parseResponse<{ results: CountrySearchOption[] }>(response)).results
}

export const searchLocalCities = async (
  query: string,
  countryCode: string,
  signal?: AbortSignal,
) => {
  const search = new URLSearchParams({ q: query, countryCode })
  const response = await fetch(`/__travelatlas/editor/catalog/cities?${search}`, {
    cache: 'no-store',
    signal,
  })
  return (await parseResponse<{ results: CitySearchOption[] }>(response)).results
}

export const addLocalCountry = async (countryCode: string, visitedDate?: string) => {
  const response = await fetch('/__travelatlas/editor/countries', {
    method: 'POST',
    headers: editorHeaders,
    body: JSON.stringify({ countryCode, visitedDate }),
  })
  return parseResponse<{ countryId: string }>(response)
}

export const readLocalEditorState = async () => {
  const response = await fetch('/__travelatlas/editor/state', { cache: 'no-store' })
  return (await parseResponse<{ state: TravelAtlasEditorState }>(response)).state
}

export const updateLocalEditorState = async (
  update: (current: TravelAtlasEditorState) => TravelAtlasEditorState,
) => {
  const current = await readLocalEditorState()
  const response = await fetch('/__travelatlas/editor/state', {
    method: 'PUT',
    headers: editorHeaders,
    body: JSON.stringify(update(current)),
  })
  return (await parseResponse<{ state: TravelAtlasEditorState }>(response)).state
}

export type LocalMediaUpload = {
  countryId: string
  cityId: string
  kind: 'photo' | 'panorama360' | 'aerialPhoto'
  file: File
  date?: string
  lat?: number
  lng?: number
  altitudeMeters?: number
  relativeAltitudeMeters?: number
  titleZh?: string
  titleEn?: string
}

export const uploadLocalMedia = async (upload: LocalMediaUpload) => {
  const search = new URLSearchParams({
    countryId: upload.countryId,
    cityId: upload.cityId,
    kind: upload.kind,
    fileName: upload.file.name,
  })
  if (upload.date) search.set('date', upload.date)
  if (upload.lat !== undefined) search.set('lat', String(upload.lat))
  if (upload.lng !== undefined) search.set('lng', String(upload.lng))
  if (upload.altitudeMeters !== undefined) search.set('altitudeMeters', String(upload.altitudeMeters))
  if (upload.relativeAltitudeMeters !== undefined) search.set('relativeAltitudeMeters', String(upload.relativeAltitudeMeters))
  if (upload.titleZh) search.set('titleZh', upload.titleZh)
  if (upload.titleEn) search.set('titleEn', upload.titleEn)

  const response = await fetch(`/__travelatlas/editor/upload?${search}`, {
    method: 'POST',
    headers: {
      'content-type': upload.file.type || 'application/octet-stream',
      'x-travelatlas-local-editor': '1',
    },
    body: upload.file,
  })
  return parseResponse<{ fileName: string; bytes: number; sourcePath: string }>(response)
}

export const importLocalMedia = async (sourcePaths: string[] = []) => {
  const response = await fetch('/__travelatlas/editor/import', {
    method: 'POST',
    headers: editorHeaders,
    body: JSON.stringify({ sourcePaths }),
  })
  return parseResponse<{ output: string; restoredMediaIds: string[] }>(response)
}

export const deleteHiddenLocalMedia = async (cityId: string, ids: string[]) => {
  const response = await fetch('/__travelatlas/editor/media/delete', {
    method: 'POST',
    headers: editorHeaders,
    body: JSON.stringify({ cityId, ids }),
  })
  return parseResponse<{ deletedIds: string[]; deletedSourceFiles: number; output: string }>(response)
}

export const deleteHiddenLocalCountries = async (ids: string[]) => {
  const response = await fetch('/__travelatlas/editor/countries/delete', {
    method: 'POST',
    headers: editorHeaders,
    body: JSON.stringify({ ids }),
  })
  return parseResponse<{
    deletedCountryIds: string[]
    deletedRecordCount: number
  }>(response)
}

export type LocalTravelRecordInput = {
  country: string
  country_en: string
  country_code?: string
  city: string
  city_en: string
  start_date: string
  end_date?: string
  lat: number
  lng: number
  trip_title?: string
}

export const addLocalTravelRecord = async (input: LocalTravelRecordInput) => {
  const response = await fetch('/__travelatlas/editor/records', {
    method: 'POST',
    headers: editorHeaders,
    body: JSON.stringify(input),
  })
  return parseResponse<{ id: string; countryId: string; cityId: string }>(response)
}

export const reloadAfterLocalSave = () => window.location.reload()
