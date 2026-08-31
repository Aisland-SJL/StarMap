import { createReadStream, createWriteStream } from 'node:fs'
import { access, copyFile, cp, mkdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { EnvHttpProxyAgent, fetch as proxyAwareFetch } from 'undici'
import worldCountries from 'world-countries'
import { getPrivatePaths } from './private-profile.mjs'

const execFileAsync = promisify(execFile)
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sampleTravelMapPath = path.join(webRoot, 'src', 'data', 'travel-map.sample.json')
const virtualPrivateDataId = 'virtual:starmap-private-data'
const resolvedPrivateDataId = `\0${virtualPrivateDataId}`
let privateRoot
let dataRoot
let editorStatePath
let localTravelMapPath
let mediaCatalogPath
let mediaSourceIndexPath
let inboxRoot
let userMediaRoot
let cesiumAccessToken = ''

const configurePrivatePaths = (requestedRoot) => {
  const environment = requestedRoot
    ? { ...process.env, STARMAP_PRIVATE_ROOT: requestedRoot }
    : process.env
  const paths = getPrivatePaths(environment)
  privateRoot = paths.root
  dataRoot = paths.dataRoot
  editorStatePath = paths.editorStatePath
  localTravelMapPath = paths.localTravelMapPath
  mediaCatalogPath = paths.mediaCatalogPath
  mediaSourceIndexPath = paths.mediaSourceIndexPath
  inboxRoot = paths.inboxRoot
  userMediaRoot = paths.userMediaRoot
}

configurePrivatePaths()
const editorHeader = 'x-travelatlas-local-editor'
const maxUploadBytes = 250 * 1024 * 1024
const citySearchDispatcher = new EnvHttpProxyAgent()
const userMediaContentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
])

const emptyState = {
  schemaVersion: 1,
  addedCountries: [],
  countryOrder: [],
  hiddenCountryIds: [],
  cityOrderByCountry: {},
  hiddenCityIds: [],
  mediaOrderByCity: {},
  hiddenMediaIds: [],
  coverMediaByCity: {},
  droneOrderByCity: {},
  hiddenDroneMediaIds: [],
}

const exists = async (target) => access(target).then(() => true, () => false)
const readJson = async (target, fallback) => {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

const sendJson = (response, status, body) => {
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.end(JSON.stringify(body))
}

const readJsonBody = async (request) => {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1024 * 1024) throw new Error('请求内容过大。')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string')
const isStringArrayRecord = (value) => value && typeof value === 'object'
  && Object.values(value).every(isStringArray)
const isStringRecord = (value) => value && typeof value === 'object'
  && Object.values(value).every((item) => typeof item === 'string')

const normalizeAddedCountry = (value) => {
  if (!value || typeof value !== 'object') return undefined
  const centerLat = Number(value.centerLat)
  const centerLng = Number(value.centerLng)
  if (
    typeof value.id !== 'string'
    || typeof value.nameZh !== 'string'
    || typeof value.nameEn !== 'string'
    || typeof value.countryCode !== 'string'
    || !Number.isFinite(centerLat)
    || !Number.isFinite(centerLng)
  ) return undefined
  return {
    id: value.id,
    nameZh: value.nameZh,
    nameEn: value.nameEn,
    countryCode: value.countryCode.toLowerCase(),
    centerLat,
    centerLng,
    ...(typeof value.region === 'string' && value.region ? { region: value.region } : {}),
    ...(typeof value.visitedDate === 'string' && value.visitedDate ? { visitedDate: value.visitedDate } : {}),
  }
}

const normalizeState = (value) => {
  if (!value || typeof value !== 'object') throw new Error('编辑状态格式无效。')
  return {
    schemaVersion: 1,
    addedCountries: Array.isArray(value.addedCountries)
      ? value.addedCountries.map(normalizeAddedCountry).filter(Boolean)
      : [],
    countryOrder: isStringArray(value.countryOrder) ? value.countryOrder : [],
    hiddenCountryIds: isStringArray(value.hiddenCountryIds) ? value.hiddenCountryIds : [],
    cityOrderByCountry: isStringArrayRecord(value.cityOrderByCountry) ? value.cityOrderByCountry : {},
    hiddenCityIds: isStringArray(value.hiddenCityIds) ? value.hiddenCityIds : [],
    mediaOrderByCity: isStringArrayRecord(value.mediaOrderByCity) ? value.mediaOrderByCity : {},
    hiddenMediaIds: isStringArray(value.hiddenMediaIds) ? value.hiddenMediaIds : [],
    coverMediaByCity: isStringRecord(value.coverMediaByCity) ? value.coverMediaByCity : {},
    droneOrderByCity: isStringArrayRecord(value.droneOrderByCity) ? value.droneOrderByCity : {},
    hiddenDroneMediaIds: isStringArray(value.hiddenDroneMediaIds) ? value.hiddenDroneMediaIds : [],
    updatedAt: new Date().toISOString(),
  }
}

const atomicJsonWrite = async (target, value) => {
  await mkdir(path.dirname(target), { recursive: true })
  if (await exists(target)) await copyFile(target, target.replace(/\.json$/i, '.bak'))
  const temporaryPath = `${target}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, target)
}

const slugify = (value) => value
  .toLowerCase()
  .normalize('NFKC')
  .trim()
  .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
  .replace(/^-|-$/g, '')

const countryCatalog = worldCountries
  .filter((country) => country.cca2 && Array.isArray(country.latlng) && country.latlng.length === 2)
  .map((country) => ({
    id: slugify(country.name.common),
    nameZh: country.translations?.zho?.common
      ?? country.name.native?.zho?.common
      ?? country.name.common,
    nameEn: country.name.common,
    countryCode: country.cca2.toUpperCase(),
    countryCode3: country.cca3?.toUpperCase() ?? '',
    centerLat: Number(country.latlng[0]),
    centerLng: Number(country.latlng[1]),
    region: country.region || undefined,
    searchTerms: [
      country.name.common,
      country.name.official,
      country.translations?.zho?.common,
      country.translations?.zho?.official,
      country.cca2,
      country.cca3,
      ...(country.altSpellings ?? []),
    ].filter(Boolean).map((item) => String(item).toLocaleLowerCase()),
  }))

const countryCatalogByCode = new Map(countryCatalog.map((country) => [country.countryCode, country]))

const countryMatchScore = (country, rawQuery) => {
  const query = rawQuery.trim().toLocaleLowerCase()
  if (!query) return 3
  if (
    country.countryCode.toLocaleLowerCase() === query
    || country.countryCode3.toLocaleLowerCase() === query
    || country.nameZh.toLocaleLowerCase() === query
    || country.nameEn.toLocaleLowerCase() === query
  ) return 0
  if (country.searchTerms.some((term) => term.startsWith(query))) return 1
  if (country.searchTerms.some((term) => term.includes(query))) return 2
  return Number.POSITIVE_INFINITY
}

const searchCountryCatalog = (query) => countryCatalog
  .map((country) => ({ country, score: countryMatchScore(country, query) }))
  .filter(({ score }) => Number.isFinite(score))
  .sort((left, right) => left.score - right.score || left.country.nameZh.localeCompare(right.country.nameZh, 'zh-CN'))
  .slice(0, 10)
  .map(({ country }) => ({
    id: country.id,
    nameZh: country.nameZh,
    nameEn: country.nameEn,
    countryCode: country.countryCode,
    centerLat: country.centerLat,
    centerLng: country.centerLng,
    region: country.region,
  }))

const addCountry = async (input) => {
  const countryCode = requireText(input.countryCode, '国家代码').toUpperCase()
  const country = countryCatalogByCode.get(countryCode)
  if (!country) throw new Error('没有找到这个国家，请从候选列表中选择。')
  const visitedDate = requireText(input.visitedDate, '首次到访日期')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedDate)) throw new Error('首次到访日期必须使用 YYYY-MM-DD。')

  const sourcePath = await exists(localTravelMapPath) ? localTravelMapPath : sampleTravelMapPath
  const travelMap = await readJson(sourcePath, { records: [] })
  if (travelMap.records?.some((record) => countryIdForRecord(record) === country.id)) {
    throw new Error('这个国家已经存在于国家足迹中。')
  }

  const state = normalizeState(await readJson(editorStatePath, emptyState))
  if (state.addedCountries.some((candidate) => candidate.id === country.id)) {
    throw new Error('这个国家已经存在于国家足迹中。')
  }
  state.addedCountries = [...state.addedCountries, {
    id: country.id,
    nameZh: country.nameZh,
    nameEn: country.nameEn,
    countryCode: country.countryCode.toLowerCase(),
    centerLat: country.centerLat,
    centerLng: country.centerLng,
    region: country.region,
    visitedDate,
  }]
  state.countryOrder = [country.id, ...state.countryOrder.filter((id) => id !== country.id)]
  await atomicJsonWrite(editorStatePath, normalizeState(state))
  return { countryId: country.id }
}

const citySearchCache = new Map()
let citySearchQueue = Promise.resolve()
let lastCitySearchAt = 0
const citySearchTimeoutMs = 9_000

const fetchCityJson = async (url, label, headers = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), citySearchTimeoutMs)
  try {
    const response = await proxyAwareFetch(url, {
      dispatcher: citySearchDispatcher,
      headers,
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${label} returned ${response.status}`)
    return await response.json()
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`${label} 请求超过 9 秒，已自动停止。`, { cause: error })
    if (error instanceof Error && error.message.startsWith(`${label} returned `)) throw error
    throw new Error(`${label} 暂时不可用。`, { cause: error })
  } finally {
    clearTimeout(timeout)
  }
}

const queueCitySearch = (search) => {
  const queued = citySearchQueue.then(async () => {
    const delay = Math.max(0, 1_050 - (Date.now() - lastCitySearchAt))
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
    lastCitySearchAt = Date.now()
    return search()
  })
  citySearchQueue = queued.catch(() => undefined)
  return queued
}

const normalizeCityReferer = (value) => {
  try {
    const parsed = new URL(value || 'http://127.0.0.1:5173/')
    if (
      parsed.protocol === 'http:'
      && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
    ) return `${parsed.origin}/`
  } catch {
    // Fall through to the fixed Codex preview origin.
  }
  return 'http://127.0.0.1:5173/'
}

const searchCesiumCityCatalog = async (query, country, requestReferer) => {
  if (!cesiumAccessToken) return []
  const url = new URL('https://api.cesium.com/v1/geocode/search')
  url.search = new URLSearchParams({
    text: `${query}, ${country.nameEn}`,
    access_token: cesiumAccessToken,
    size: '8',
    'boundary.country': country.countryCode3 || country.countryCode,
  }).toString()
  const referer = normalizeCityReferer(requestReferer)
  const body = await fetchCityJson(url, 'Cesium ion geocode', {
    origin: new URL(referer).origin,
    referer,
  })
  const seen = new Set()
  return (Array.isArray(body?.features) ? body.features : []).flatMap((feature) => {
    const coordinates = feature?.geometry?.coordinates
    const bbox = feature?.bbox
    const properties = feature?.properties ?? {}
    const lng = Number(coordinates?.[0] ?? (
      Array.isArray(bbox) && bbox.length === 4 ? (Number(bbox[0]) + Number(bbox[2])) / 2 : Number.NaN
    ))
    const lat = Number(coordinates?.[1] ?? (
      Array.isArray(bbox) && bbox.length === 4 ? (Number(bbox[1]) + Number(bbox[3])) / 2 : Number.NaN
    ))
    const resultCountryCode = String(properties.country_a ?? '').toUpperCase()
    if (
      !Number.isFinite(lat)
      || !Number.isFinite(lng)
      || (resultCountryCode && ![country.countryCode, country.countryCode3].includes(resultCountryCode))
    ) return []
    const label = String(properties.label ?? properties.name ?? '').trim()
    const nameEn = String(properties.name ?? label.split(',')[0] ?? '').trim()
    if (!nameEn) return []
    const id = String(properties.gid ?? `cesium-${lat}-${lng}`)
    if (seen.has(id)) return []
    seen.add(id)
    return [{
      id,
      nameZh: /\p{Script=Han}/u.test(query) ? query : nameEn,
      nameEn,
      countryCode: country.countryCode,
      lat,
      lng,
      detail: `${label || country.nameEn} · Cesium ion`,
      provider: 'cesium',
    }]
  })
}

const searchOpenStreetMapCityCatalog = async (query, country) => queueCitySearch(async () => {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.search = new URLSearchParams({
      q: query,
      countrycodes: country.countryCode.toLowerCase(),
      featureType: 'settlement',
      layer: 'address',
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      limit: '8',
      'accept-language': 'zh-CN,en',
    }).toString()
    const body = await fetchCityJson(url, 'OpenStreetMap 城市检索', {
      'user-agent': 'StarMap-LocalEditor/1.0 (local-first travel atlas editor)',
      referer: 'http://127.0.0.1/',
    })
    const seen = new Set()
    const normalizedQueryName = query.normalize('NFKC').toLocaleLowerCase()
    return (Array.isArray(body) ? body : []).flatMap((place) => {
      const lat = Number(place.lat)
      const lng = Number(place.lon)
      const address = place.address ?? {}
      const names = place.namedetails ?? {}
      const nameEn = names['name:en'] || names.name || String(place.display_name ?? '').split(',')[0]
      const nameZh = names['name:zh'] || names['name:zh-Hans'] || names['name:zh_CN'] || nameEn
      const id = `${place.osm_type ?? 'place'}-${place.osm_id ?? place.place_id}`
      if (!nameEn || !Number.isFinite(lat) || !Number.isFinite(lng) || seen.has(id)) return []
      const normalizedZhName = String(nameZh).normalize('NFKC').toLocaleLowerCase()
      const normalizedEnName = String(nameEn).normalize('NFKC').toLocaleLowerCase()
      const queryHan = normalizedQueryName.match(/\p{Script=Han}/gu)?.join('') ?? ''
      const resultHan = normalizedZhName.match(/\p{Script=Han}/gu)?.join('') ?? ''
      const isPlausibleLocalizedMatch = queryHan.length > 0 && queryHan.length === resultHan.length
      // Nominatim can treat a short Chinese query as a substring of an unrelated
      // Chinese label. Reject that misleading candidate, while allowing equal-length
      // simplified/traditional variants such as 波尔图 / 波爾圖.
      if (
        /\p{Script=Han}/u.test(query)
        && normalizedZhName !== normalizedQueryName
        && normalizedEnName !== normalizedQueryName
        && !isPlausibleLocalizedMatch
      ) return []
      seen.add(id)
      return [{
        id,
        nameZh,
        nameEn,
        countryCode: country.countryCode,
        lat,
        lng,
        detail: [...[address.state, address.region, address.country].filter(Boolean), 'OpenStreetMap'].join(' · '),
        provider: 'openstreetmap',
      }]
    })
  })

const searchCityCatalog = async (query, countryCode, requestReferer) => {
  const normalizedQuery = requireText(query, '城市名称')
  const normalizedCountryCode = requireText(countryCode, '国家代码').toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) throw new Error('国家代码无效。')
  const country = countryCatalogByCode.get(normalizedCountryCode)
  if (!country) throw new Error('没有找到这个国家，无法限制城市检索范围。')
  const cacheKey = `${cesiumAccessToken ? 'ion' : 'osm'}:${normalizedCountryCode}:${normalizedQuery.toLocaleLowerCase()}`
  const cached = citySearchCache.get(cacheKey)
  if (cached) return cached

  let cesiumError
  if (cesiumAccessToken) {
    try {
      const cesiumResults = await searchCesiumCityCatalog(normalizedQuery, country, requestReferer)
      if (cesiumResults.length > 0) {
        citySearchCache.set(cacheKey, cesiumResults)
        return cesiumResults
      }
    } catch (error) {
      cesiumError = error
      console.warn(`[StarMap editor] Cesium ion geocode unavailable; using OpenStreetMap (${error.message})`)
    }
  }

  try {
    const openStreetMapResults = await searchOpenStreetMapCityCatalog(normalizedQuery, country)
    citySearchCache.set(cacheKey, openStreetMapResults)
    return openStreetMapResults
  } catch {
    const providerSummary = cesiumError
      ? 'Cesium ion 与 OpenStreetMap 均暂时不可用'
      : 'OpenStreetMap 暂时不可用'
    throw new Error(`${providerSummary}。请稍后重试，或改用手动坐标。`)
  }
}

const countryIdForRecord = (record) => slugify(record.country_en || record.country || 'unknown-country')
const cityIdForRecord = (record) => `${countryIdForRecord(record)}__${slugify(record.city_en || record.city || record.id)}`

const getLocation = async (countryId, cityId) => {
  const sourcePath = await exists(localTravelMapPath) ? localTravelMapPath : sampleTravelMapPath
  const travelMap = await readJson(sourcePath, { records: [] })
  const record = travelMap.records?.find((candidate) => (
    countryIdForRecord(candidate) === countryId && cityIdForRecord(candidate) === cityId
  ))
  if (!record) throw new Error('找不到对应的国家和城市，请先把城市加入旅行数据。')
  return {
    countryId,
    cityId,
    countryName: record.country_en || record.country,
    cityName: record.city_en || record.city,
  }
}

const requireText = (value, label) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new Error(`请填写${label}。`)
  return text
}

const numberInRange = (value, min, max, label) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    throw new Error(`请填写${label}。`)
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${label}无效。`)
  return number
}

const ensureLocalTravelMap = async () => {
  if (!await exists(localTravelMapPath)) {
    const sample = await readJson(sampleTravelMapPath, { schema_version: 1, records: [] })
    await atomicJsonWrite(localTravelMapPath, {
      ...sample,
      generated_at: new Date().toISOString(),
      privacy_level: 'private-local',
    })
  }
  return readJson(localTravelMapPath, { schema_version: 1, records: [] })
}

const addTravelRecord = async (input) => {
  const country = requireText(input.country, '国家中文名')
  const countryEn = requireText(input.country_en, '国家英文名')
  const city = requireText(input.city, '城市中文名')
  const cityEn = requireText(input.city_en, '城市英文名')
  const startDate = requireText(input.start_date, '到访日期')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('到访日期必须使用 YYYY-MM-DD。')
  const endDate = typeof input.end_date === 'string' && input.end_date.trim() ? input.end_date.trim() : undefined
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error('结束日期必须使用 YYYY-MM-DD。')
  if (endDate && endDate < startDate) throw new Error('结束日期不能早于到访日期。')
  const lat = numberInRange(input.lat, -90, 90, '纬度')
  const lng = numberInRange(input.lng, -180, 180, '经度')
  const countryCode = typeof input.country_code === 'string' ? input.country_code.trim().toUpperCase() : ''
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new Error('国家代码必须是两个英文字母。')
  const travelMap = await ensureLocalTravelMap()
  const targetCountryId = slugify(countryEn)
  const targetCityId = `${targetCountryId}__${slugify(cityEn)}`
  const duplicate = travelMap.records?.some((record) => cityIdForRecord(record) === targetCityId)
  if (duplicate) throw new Error('这个城市已经存在；如需增加一次新的行程，请使用行程编辑，而不是重复添加城市。')
  const idBase = `manual-${startDate}-${slugify(countryEn)}-${slugify(cityEn)}`
  const ids = new Set((travelMap.records ?? []).map((record) => record.id))
  let id = idBase
  for (let suffix = 2; ids.has(id); suffix += 1) id = `${idBase}-${suffix}`

  travelMap.records = [...(travelMap.records ?? []), {
    id,
    country,
    country_en: countryEn,
    ...(countryCode
      ? { country_code: countryCode }
      : {}),
    city,
    city_en: cityEn,
    start_date: startDate,
    ...(endDate ? { end_date: endDate } : {}),
    year: Number(startDate.slice(0, 4)),
    trip_title: typeof input.trip_title === 'string' && input.trip_title.trim()
      ? input.trip_title.trim()
      : `${country} · ${city}`,
    type: 'visit',
    status: 'visited',
    lat,
    lng,
    source: 'local-editor',
  }]
  travelMap.generated_at = new Date().toISOString()
  await atomicJsonWrite(localTravelMapPath, travelMap)
  return { id, countryId: targetCountryId, cityId: targetCityId }
}

const safeSegment = (value, label) => {
  // eslint-disable-next-line no-control-regex -- Windows file names must reject ASCII control characters.
  const cleaned = String(value ?? '').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
  if (!cleaned || cleaned === '.' || cleaned === '..') throw new Error(`${label}无效。`)
  return cleaned.slice(0, 120)
}

const reserveDestination = async (directory, originalName) => {
  const parsed = path.parse(safeSegment(originalName, '文件名'))
  for (let index = 0; index < 1000; index += 1) {
    const suffix = index === 0 ? '' : `-${index}`
    const candidate = path.join(directory, `${parsed.name}${suffix}${parsed.ext.toLowerCase()}`)
    if (!await exists(candidate)) return candidate
  }
  throw new Error('同名文件过多，请先整理文件名。')
}

const orientedImageDimensions = (metadata) => {
  const orientation = metadata.orientation ?? 1
  const swapsAxes = orientation >= 5 && orientation <= 8
  const width = swapsAxes ? metadata.height : metadata.width
  const height = swapsAxes ? metadata.width : metadata.height
  return width && height ? { width, height } : undefined
}

const isLikelyEquirectangularPanorama = (dimensions) => {
  if (!dimensions) return false
  const ratio = dimensions.width / dimensions.height
  return ratio >= 1.9 && ratio <= 2.1
}

const writeUpload = async (request, destination, kind) => {
  const contentLength = Number(request.headers['content-length'] ?? 0)
  if (!Number.isFinite(contentLength) || contentLength <= 0) throw new Error('没有收到文件内容。')
  if (contentLength > maxUploadBytes) throw new Error('单个文件不能超过 250 MiB。')

  const temporaryPath = path.join(tmpdir(), `travelatlas-upload-${process.pid}-${Date.now()}`)
  let received = 0
  request.on('data', (chunk) => {
    received += chunk.length
    if (received > maxUploadBytes) request.destroy(new Error('单个文件不能超过 250 MiB。'))
  })

  try {
    await pipeline(request, createWriteStream(temporaryPath, { flags: 'wx' }))
    const imageMetadata = await sharp(temporaryPath).metadata()
    if (!imageMetadata.width || !imageMetadata.height) throw new Error('无法读取图片尺寸或文件内容无效。')
    const dimensions = orientedImageDimensions(imageMetadata)
    if (kind === 'panorama360' && !isLikelyEquirectangularPanorama(dimensions)) {
      throw new Error(`所选图片为 ${dimensions?.width ?? imageMetadata.width} × ${dimensions?.height ?? imageMetadata.height}，不是常见的 2:1 等距柱状全景图。请改选“航拍照片”，或上传正确的 360 全景图。`)
    }
    await mkdir(path.dirname(destination), { recursive: true })
    await pipeline(createReadStream(temporaryPath), createWriteStream(destination, { flags: 'wx' }))
    return imageMetadata
  } finally {
    await unlink(temporaryPath).catch(() => undefined)
  }
}

const updateDroneSidecar = async (cityRoot, destination, metadata, imageMetadata) => {
  const sidecarPath = path.join(cityRoot, 'media.json')
  const sidecar = await readJson(sidecarPath, {})
  const relativeKey = path.posix.join('drone', path.basename(destination))
  sidecar[relativeKey] = {
    kind: metadata.kind,
    titleZh: metadata.titleZh,
    titleEn: metadata.titleEn,
    date: metadata.date,
    resolution: `${imageMetadata.width} × ${imageMetadata.height}`,
    captureType: metadata.kind === 'panorama360' ? 'Drone 360 Panorama' : 'Aerial Photo',
    ...(metadata.lat === undefined || metadata.lng === undefined ? {} : {
      position: {
        lat: metadata.lat,
        lng: metadata.lng,
        ...(metadata.altitudeMeters === undefined ? {} : { altitudeMeters: metadata.altitudeMeters }),
      },
    }),
    ...(metadata.altitudeMeters === undefined ? {} : { altitudeMeters: metadata.altitudeMeters }),
    ...(metadata.relativeAltitudeMeters === undefined ? {} : { relativeAltitudeMeters: metadata.relativeAltitudeMeters }),
  }
  await atomicJsonWrite(sidecarPath, sidecar)
}

const runImporter = async () => {
  const command = process.execPath
  const script = path.join(webRoot, 'scripts', 'import-media.mjs')
  const importerOptions = {
    cwd: webRoot,
    env: { ...process.env, STARMAP_PRIVATE_ROOT: privateRoot },
    maxBuffer: 8 * 1024 * 1024,
  }
  const preflight = await execFileAsync(command, [script], importerOptions)
  const blockingPattern = /需要处理|缺少日期或分辨率|缺少日期、分辨率或有效坐标|无法读取|找不到国家|找不到城市/
  if (blockingPattern.test(`${preflight.stdout}\n${preflight.stderr}`)) {
    const error = new Error('媒体预检发现未解决信息，已停止导入。')
    error.details = `${preflight.stdout}\n${preflight.stderr}`.trim()
    throw error
  }
  const imported = await execFileAsync(command, [script, '--apply'], importerOptions)
  return `${imported.stdout}\n${imported.stderr}`.trim()
}

const isPathInside = (root, target) => {
  const relative = path.relative(root, target)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const normalizeInboxRelativePath = (value) => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const target = path.resolve(inboxRoot, value.trim())
  if (!isPathInside(inboxRoot, target)) throw new Error('媒体源文件路径超出投递箱范围。')
  return path.relative(inboxRoot, target).split(path.sep).join('/')
}

const restoreImportedMedia = async (sourcePaths) => {
  if (sourcePaths.length === 0) return []

  const requestedSources = new Set(sourcePaths.map((sourcePath) => sourcePath.toLocaleLowerCase('en-US')))
  const sourceIndex = await readJson(mediaSourceIndexPath, { sourcesById: {} })
  const importedIds = Object.entries(sourceIndex.sourcesById ?? {})
    .filter(([, sources]) => Array.isArray(sources) && sources.some(
      (source) => requestedSources.has(String(source).replaceAll('\\', '/').toLocaleLowerCase('en-US')),
    ))
    .map(([id]) => id)

  if (importedIds.length === 0) {
    throw new Error('文件已经接收，但导入结果没有对应媒体记录。请保留当前页面并查看导入详情。')
  }

  const catalog = await readJson(mediaCatalogPath, { items: [] })
  const itemsById = new Map((Array.isArray(catalog.items) ? catalog.items : []).map((item) => [item.id, item]))
  const importedItems = importedIds.map((id) => itemsById.get(id)).filter(Boolean)
  if (importedItems.length !== importedIds.length) {
    throw new Error('导入索引与媒体目录不一致，已停止刷新页面。')
  }

  const state = normalizeState(await readJson(editorStatePath, emptyState))
  const nextState = {
    ...state,
    mediaOrderByCity: { ...state.mediaOrderByCity },
    droneOrderByCity: { ...state.droneOrderByCity },
    hiddenMediaIds: state.hiddenMediaIds.filter((id) => !importedIds.includes(id)),
    hiddenDroneMediaIds: state.hiddenDroneMediaIds.filter((id) => !importedIds.includes(id)),
  }

  for (const item of importedItems) {
    const orderKey = item.kind === 'photo' ? 'mediaOrderByCity' : 'droneOrderByCity'
    const currentOrder = nextState[orderKey][item.cityId] ?? []
    nextState[orderKey][item.cityId] = [...currentOrder.filter((id) => id !== item.id), item.id]
  }

  await atomicJsonWrite(editorStatePath, normalizeState(nextState))
  return importedIds
}

const serveUserMedia = async (request, response, pathname) => {
  if (!isLoopbackRequest(request)) {
    response.statusCode = 403
    response.end('Forbidden')
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('allow', 'GET, HEAD')
    response.end('Method Not Allowed')
    return
  }

  let relativePath
  try {
    relativePath = decodeURIComponent(pathname.slice('/media/user/'.length))
  } catch {
    response.statusCode = 400
    response.end('Bad Request')
    return
  }
  const target = path.resolve(userMediaRoot, relativePath)
  if (!isPathInside(userMediaRoot, target)) {
    response.statusCode = 403
    response.end('Forbidden')
    return
  }

  let fileStats
  try {
    fileStats = await stat(target)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    response.statusCode = 404
    response.end('Not Found')
    return
  }
  if (!fileStats.isFile()) {
    response.statusCode = 404
    response.end('Not Found')
    return
  }

  response.statusCode = 200
  response.setHeader('content-type', userMediaContentTypes.get(path.extname(target).toLowerCase()) ?? 'application/octet-stream')
  response.setHeader('content-length', String(fileStats.size))
  response.setHeader('cache-control', 'no-store')
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  await pipeline(createReadStream(target), response)
}

const removeSidecarEntries = async (sourcePaths) => {
  const removalsBySidecar = new Map()
  for (const sourcePath of sourcePaths) {
    const mediaFolder = path.dirname(sourcePath)
    const cityRoot = path.dirname(mediaFolder)
    const sidecarPath = path.join(cityRoot, 'media.json')
    const relativeKey = path.posix.join(path.basename(mediaFolder), path.basename(sourcePath)).toLocaleLowerCase('en-US')
    removalsBySidecar.set(sidecarPath, new Set([...(removalsBySidecar.get(sidecarPath) ?? []), relativeKey]))
  }

  for (const [sidecarPath, relativeKeys] of removalsBySidecar) {
    if (!await exists(sidecarPath)) continue
    const sidecar = await readJson(sidecarPath, {})
    let changed = false
    for (const key of Object.keys(sidecar)) {
      const normalizedKey = key.replaceAll('\\', '/').toLocaleLowerCase('en-US')
      if (!relativeKeys.has(normalizedKey)) continue
      delete sidecar[key]
      changed = true
    }
    if (changed) await atomicJsonWrite(sidecarPath, sidecar)
  }
}

const deleteHiddenDroneMedia = async (input) => {
  const cityId = typeof input?.cityId === 'string' ? input.cityId.trim() : ''
  const ids = isStringArray(input?.ids) ? [...new Set(input.ids)] : []
  if (!cityId || ids.length === 0) throw new Error('没有可删除的隐藏影像。')

  const state = normalizeState(await readJson(editorStatePath, emptyState))
  const hiddenIds = new Set(state.hiddenDroneMediaIds)
  const catalog = await readJson(mediaCatalogPath, { items: [] })
  const catalogItems = Array.isArray(catalog.items) ? catalog.items : []
  const itemsById = new Map(catalogItems.map((item) => [item.id, item]))
  for (const id of ids) {
    const item = itemsById.get(id)
    if (!hiddenIds.has(id) || item?.cityId !== cityId || !['panorama360', 'aerialPhoto'].includes(item?.kind)) {
      throw new Error('只能彻底删除当前城市中已经隐藏的无人机影像。')
    }
  }

  let sourceIndex = await readJson(mediaSourceIndexPath, { sourcesById: {} })
  if (ids.some((id) => !Array.isArray(sourceIndex.sourcesById?.[id]))) {
    await runImporter()
    sourceIndex = await readJson(mediaSourceIndexPath, { sourcesById: {} })
  }

  const sourcePaths = []
  for (const id of ids) {
    const relativeSources = sourceIndex.sourcesById?.[id]
    if (!Array.isArray(relativeSources) || relativeSources.length === 0) {
      throw new Error(`找不到影像 ${id} 对应的投递箱原图，已停止删除。`)
    }
    for (const relativeSource of relativeSources) {
      const sourcePath = path.resolve(inboxRoot, relativeSource)
      if (!isPathInside(inboxRoot, sourcePath)) throw new Error('影像源文件路径超出投递箱范围，已停止删除。')
      sourcePaths.push(sourcePath)
    }
  }

  const generatedDirectories = []
  for (const id of ids) {
    const item = itemsById.get(id)
    const mediaSrc = String(item?.src ?? '').replaceAll('\\', '/')
    const mediaPrefix = '/media/user/'
    if (!mediaSrc.startsWith(mediaPrefix)) {
      throw new Error('影像生成路径格式无效，已停止删除。')
    }
    const generatedFile = path.resolve(userMediaRoot, mediaSrc.slice(mediaPrefix.length))
    const generatedDirectory = path.dirname(generatedFile)
    if (!isPathInside(userMediaRoot, generatedDirectory)) {
      throw new Error('生成文件路径超出用户媒体目录，已停止删除。')
    }
    generatedDirectories.push(generatedDirectory)
  }

  let deletedSourceFiles = 0
  for (const sourcePath of new Set(sourcePaths)) {
    try {
      await unlink(sourcePath)
      deletedSourceFiles += 1
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  await removeSidecarEntries(sourcePaths)

  for (const generatedDirectory of new Set(generatedDirectories)) {
    await rm(generatedDirectory, { recursive: true, force: true })
  }

  const nextState = normalizeState({
    ...state,
    hiddenDroneMediaIds: state.hiddenDroneMediaIds.filter((id) => !ids.includes(id)),
    droneOrderByCity: Object.fromEntries(Object.entries(state.droneOrderByCity)
      .map(([key, value]) => [key, value.filter((id) => !ids.includes(id))])),
  })
  await atomicJsonWrite(editorStatePath, nextState)
  const output = await runImporter()
  return { deletedIds: ids, deletedSourceFiles, output }
}

const allowedOrigins = (request) => {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    const parsed = new URL(origin)
    return (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
      && parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const isLoopbackRequest = (request) => {
  const address = request.socket.remoteAddress ?? ''
  return address === '::1' || address === '127.0.0.1' || address.startsWith('::ffff:127.')
}

const authorizeWrite = (request) => (
  isLoopbackRequest(request)
  && request.headers[editorHeader] === '1'
  && allowedOrigins(request)
)

export function travelAtlasLocalEditor(options = {}) {
  const profile = options.profile === 'personal' ? 'personal' : 'public'
  configurePrivatePaths(options.privateRoot)
  cesiumAccessToken = typeof options.cesiumAccessToken === 'string'
    ? options.cesiumAccessToken.trim()
    : ''

  return {
    name: 'travelatlas-local-editor',
    resolveId(id) {
      if (id === virtualPrivateDataId) return resolvedPrivateDataId
    },
    async load(id) {
      if (id !== resolvedPrivateDataId) return undefined
      const privateData = profile === 'personal'
        ? {
            privateEditorState: await readJson(editorStatePath, undefined),
            privateMediaCatalog: await readJson(mediaCatalogPath, undefined),
            privateTravelMap: await readJson(localTravelMapPath, undefined),
          }
        : {
            privateEditorState: undefined,
            privateMediaCatalog: undefined,
            privateTravelMap: undefined,
          }
      return Object.entries(privateData)
        .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};`)
        .join('\n')
    },
    configureServer(server) {
      if (profile !== 'personal') return
      let editorMutationDepth = 0
      let ignoreWatcherUntil = 0
      server.watcher.add(dataRoot)
      server.watcher.on('change', (changedPath) => {
        if (!path.resolve(changedPath).startsWith(path.resolve(dataRoot))) return
        if (editorMutationDepth > 0 || Date.now() < ignoreWatcherUntil) return
        const privateModule = server.moduleGraph.getModuleById(resolvedPrivateDataId)
        if (privateModule) server.moduleGraph.invalidateModule(privateModule)
        server.ws.send({ type: 'full-reload' })
      })
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1')
        if (url.pathname.startsWith('/media/user/')) {
          try {
            await serveUserMedia(request, response, url.pathname)
          } catch {
            if (!response.headersSent) response.statusCode = 500
            response.end()
          }
          return
        }
        if (!url.pathname.startsWith('/__travelatlas/editor/')) return next()

        try {
          if (request.method === 'GET' && url.pathname === '/__travelatlas/editor/state') {
            if (!isLoopbackRequest(request)) return sendJson(response, 403, { ok: false, error: '仅允许本机编辑会话读取。' })
            const state = normalizeState(await readJson(editorStatePath, emptyState))
            return sendJson(response, 200, { ok: true, state })
          }

          if (request.method === 'GET' && url.pathname === '/__travelatlas/editor/catalog/countries') {
            if (!isLoopbackRequest(request)) return sendJson(response, 403, { ok: false, error: '仅允许本机编辑会话读取。' })
            return sendJson(response, 200, {
              ok: true,
              results: searchCountryCatalog(url.searchParams.get('q') ?? ''),
            })
          }

          if (request.method === 'GET' && url.pathname === '/__travelatlas/editor/catalog/cities') {
            if (!isLoopbackRequest(request)) return sendJson(response, 403, { ok: false, error: '仅允许本机编辑会话读取。' })
            const results = await searchCityCatalog(
              url.searchParams.get('q') ?? '',
              url.searchParams.get('countryCode') ?? '',
              request.headers.referer ?? request.headers.origin,
            )
            return sendJson(response, 200, { ok: true, results })
          }

          if (!authorizeWrite(request)) return sendJson(response, 403, { ok: false, error: '仅允许本机编辑会话写入。' })

          editorMutationDepth += 1
          try {
            if (request.method === 'PUT' && url.pathname === '/__travelatlas/editor/state') {
              const state = normalizeState(await readJsonBody(request))
              await atomicJsonWrite(editorStatePath, state)
              return sendJson(response, 200, { ok: true, state })
            }

            if (request.method === 'POST' && url.pathname === '/__travelatlas/editor/records') {
              const result = await addTravelRecord(await readJsonBody(request))
              return sendJson(response, 201, { ok: true, ...result })
            }

            if (request.method === 'POST' && url.pathname === '/__travelatlas/editor/countries') {
              const result = await addCountry(await readJsonBody(request))
              return sendJson(response, 201, { ok: true, ...result })
            }

            if (request.method === 'POST' && url.pathname === '/__travelatlas/editor/upload') {
              const countryId = url.searchParams.get('countryId') ?? ''
              const cityId = url.searchParams.get('cityId') ?? ''
              const kind = url.searchParams.get('kind') ?? 'photo'
              const fileName = url.searchParams.get('fileName') ?? ''
              if (!['photo', 'panorama360', 'aerialPhoto'].includes(kind)) throw new Error('不支持的媒体类型。')

              const location = await getLocation(countryId, cityId)
              const countryFolder = safeSegment(location.countryName, '国家名')
              const cityFolder = safeSegment(location.cityName, '城市名')
              const cityRoot = path.join(inboxRoot, countryFolder, cityFolder)
              const mediaFolder = kind === 'photo' ? 'photos' : 'drone'
              const destination = await reserveDestination(path.join(cityRoot, mediaFolder), fileName)
              const extension = path.extname(destination).toLowerCase()
              if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extension)) {
                throw new Error('当前网页编辑器只接收 JPG、PNG、WebP 或 AVIF 图片。')
              }
              let droneMetadata
              if (kind !== 'photo') {
                const date = url.searchParams.get('date') ?? ''
                const latText = url.searchParams.get('lat')
                const lngText = url.searchParams.get('lng')
                const lat = latText === null || latText === '' ? undefined : Number(latText)
                const lng = lngText === null || lngText === '' ? undefined : Number(lngText)
                const altitudeText = url.searchParams.get('altitudeMeters')
                const altitudeMeters = altitudeText ? Number(altitudeText) : undefined
                const relativeAltitudeText = url.searchParams.get('relativeAltitudeMeters')
                const relativeAltitudeMeters = relativeAltitudeText ? Number(relativeAltitudeText) : undefined
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('无人机影像必须填写有效日期。')
                if ((lat === undefined) !== (lng === undefined)) {
                  throw new Error('经纬度需要同时填写，或同时留空。')
                }
                if (
                  (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90))
                  || (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180))
                ) {
                  throw new Error('经纬度超出有效范围。')
                }
                droneMetadata = {
                  kind,
                  date,
                  lat,
                  lng,
                  altitudeMeters: Number.isFinite(altitudeMeters) ? altitudeMeters : undefined,
                  relativeAltitudeMeters: Number.isFinite(relativeAltitudeMeters) ? relativeAltitudeMeters : undefined,
                  titleZh: url.searchParams.get('titleZh') || `${location.cityName}无人机影像`,
                  titleEn: url.searchParams.get('titleEn') || `${location.cityName} Drone Media`,
                }
              }

              const imageMetadata = await writeUpload(request, destination, kind)
              if (droneMetadata) await updateDroneSidecar(cityRoot, destination, droneMetadata, imageMetadata)

              const fileStats = await stat(destination)
              return sendJson(response, 201, {
                ok: true,
                fileName: path.basename(destination),
                bytes: fileStats.size,
                sourcePath: path.relative(inboxRoot, destination).split(path.sep).join('/'),
              })
            }

            if (request.method === 'POST' && url.pathname === '/__travelatlas/editor/import') {
              const input = await readJsonBody(request)
              const sourcePaths = isStringArray(input?.sourcePaths)
                ? [...new Set(input.sourcePaths.map(normalizeInboxRelativePath).filter(Boolean))]
                : []
              const output = await runImporter()
              const restoredMediaIds = await restoreImportedMedia(sourcePaths)
              return sendJson(response, 200, { ok: true, output, restoredMediaIds })
            }

            if (request.method === 'POST' && url.pathname === '/__travelatlas/editor/media/delete') {
              const result = await deleteHiddenDroneMedia(await readJsonBody(request))
              return sendJson(response, 200, { ok: true, ...result })
            }

            return sendJson(response, 404, { ok: false, error: '未知的本地编辑接口。' })
          } finally {
            editorMutationDepth -= 1
            if (editorMutationDepth === 0) ignoreWatcherUntil = Date.now() + 1_500
          }
        } catch (error) {
          const details = typeof error?.details === 'string' ? error.details : undefined
          return sendJson(response, 400, {
            ok: false,
            error: error instanceof Error ? error.message : '本地编辑操作失败。',
            ...(details ? { details } : {}),
          })
        }
      })
    },
    async closeBundle() {
      if (profile !== 'personal' || !(await exists(userMediaRoot))) return
      const outputMediaRoot = path.join(webRoot, 'dist', 'media', 'user')
      await mkdir(path.dirname(outputMediaRoot), { recursive: true })
      await cp(userMediaRoot, outputMediaRoot, { recursive: true })
    },
  }
}
