import { createHash } from 'node:crypto'
import { constants, createReadStream } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDirectory, '..')
const projectRoot = path.resolve(webRoot, '..')
const inboxRoot = path.join(projectRoot, '02_Assets', 'MediaInbox')
const outputRoot = path.join(webRoot, 'public', 'media', 'user')
const catalogPath = path.join(webRoot, 'src', 'data', 'generated', 'user-media.local.json')
const localTravelDataPath = path.join(webRoot, 'src', 'data', 'generated', 'travel-map.local.json')
const sampleTravelDataPath = path.join(webRoot, 'src', 'data', 'travel-map.sample.json')
const shouldApply = process.argv.includes('--apply')

const stillExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const videoExtensions = new Set(['.mp4', '.webm'])
const needsConversionExtensions = new Set([
  '.heic', '.heif', '.tif', '.tiff', '.dng', '.cr2', '.cr3', '.nef', '.arw', '.raf', '.orf', '.rw2', '.mov',
])
const photoFolderAliases = new Set(['photos', 'photo', '普通照片', '照片'].map(normalizeName))
const droneFolderAliases = new Set(['drone', '无人机', '无人机影像'].map(normalizeName))
const droneTypeAliases = new Map([
  ...['panorama360', 'panorama', '360', '全景', '全景照片'].map((name) => [normalizeName(name), 'panorama360']),
  ...['aerial-photo', 'aerial_photo', 'aerial', '航拍', '航拍照片'].map((name) => [normalizeName(name), 'aerialPhoto']),
  ...['video', 'videos', '航拍视频', '视频'].map((name) => [normalizeName(name), 'video']),
])

const ignoredControlExtensions = new Set(['.json', '.bak', '.tmp'])

const errors = []
const warnings = []
const plannedItems = []

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[\s_-]+/g, '')
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function publicSrc(outputPath) {
  return `/${toPosix(path.relative(path.join(webRoot, 'public'), outputPath))}`
}

function orientedDimensions(imageMetadata) {
  const orientation = imageMetadata.orientation ?? 1
  const swapsAxes = orientation >= 5 && orientation <= 8
  const width = swapsAxes ? imageMetadata.height : imageMetadata.width
  const height = swapsAxes ? imageMetadata.width : imageMetadata.height
  return width && height ? { width, height } : undefined
}

function dimensionsInside(width, height, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function pathExists(target) {
  try {
    await stat(target)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function readJson(target, label) {
  try {
    return JSON.parse(await readFile(target, 'utf8'))
  } catch (error) {
    errors.push(`${label} 无法读取：${error.message}`)
    return undefined
  }
}

async function listDirectories(target) {
  if (!(await pathExists(target))) return []
  return (await readdir(target, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

async function listMediaFiles(target) {
  if (!(await pathExists(target))) return []
  const entries = await readdir(target, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue
    const absolutePath = path.join(target, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listMediaFiles(absolutePath))
      continue
    }
    if (!entry.isFile() || ignoredControlExtensions.has(path.extname(entry.name).toLowerCase())) continue
    files.push(absolutePath)
  }

  return files
}

async function sha256(target) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(target)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function addAlias(aliasMap, value, entity) {
  const key = normalizeName(value)
  if (!key) return
  const previous = aliasMap.get(key)
  if (!previous) {
    aliasMap.set(key, entity)
  } else if (previous.id !== entity.id) {
    aliasMap.set(key, null)
  }
}

async function createLocationIndex() {
  const travelDataPath = await pathExists(localTravelDataPath) ? localTravelDataPath : sampleTravelDataPath
  const travelData = await readJson(travelDataPath, '旅行地图数据')
  if (!travelData?.records || !Array.isArray(travelData.records)) return undefined
  const configuredCountryAliases = travelData.display?.countryAliases ?? {}

  const countriesById = new Map()

  for (const record of travelData.records.filter((item) => item.status !== 'planned')) {
    const countryAlias = configuredCountryAliases[record.country_en]
    const normalizedCountryEn = countryAlias?.country_en ?? record.country_en ?? record.country
    const normalizedCountryZh = countryAlias?.country ?? record.country
    const countryId = slugify(normalizedCountryEn)
    if (!countryId) continue

    let country = countriesById.get(countryId)
    if (!country) {
      country = {
        id: countryId,
        nameEn: normalizedCountryEn,
        nameZh: normalizedCountryZh,
        aliases: new Set(),
        citiesById: new Map(),
        cityAliases: new Map(),
      }
      countriesById.set(countryId, country)
    }

    country.aliases.add(record.country)
    country.aliases.add(normalizedCountryZh)
    country.aliases.add(record.country_en)
    country.aliases.add(normalizedCountryEn)

    const cityNameEn = record.city_en || record.city || record.id
    const cityId = `${countryId}__${slugify(cityNameEn)}`
    let city = country.citiesById.get(cityId)
    if (!city) {
      city = {
        id: cityId,
        countryId,
        nameEn: cityNameEn,
        nameZh: record.city,
        aliases: new Set(),
      }
      country.citiesById.set(cityId, city)
    }
    city.aliases.add(record.city)
    city.aliases.add(record.city_en)
    city.aliases.add(cityNameEn)
  }

  const countryAliases = new Map()
  for (const country of countriesById.values()) {
    addAlias(countryAliases, country.id, country)
    for (const alias of country.aliases) addAlias(countryAliases, alias, country)
    for (const city of country.citiesById.values()) {
      addAlias(country.cityAliases, city.id, city)
      for (const alias of city.aliases) addAlias(country.cityAliases, alias, city)
    }
  }

  return { countriesById, countryAliases }
}

async function findNamedRoot(countryDirectory, aliases, label) {
  const matches = (await listDirectories(countryDirectory))
    .filter((entry) => aliases.has(normalizeName(entry.name)))

  if (matches.length > 1) {
    errors.push(`${path.basename(countryDirectory)} 同时存在多个${label}目录：${matches.map((entry) => entry.name).join('、')}`)
  }

  return matches[0] ? path.join(countryDirectory, matches[0].name) : undefined
}

function resolveCountry(folderName, countryConfig, locationIndex) {
  const configuredId = typeof countryConfig?.countryId === 'string' ? countryConfig.countryId : undefined
  if (configuredId) {
    const configured = locationIndex.countriesById.get(configuredId)
    if (configured) return configured
    errors.push(`${folderName}/country.json 指定了不存在的 countryId：${configuredId}`)
    return undefined
  }

  const match = locationIndex.countryAliases.get(normalizeName(folderName))
  if (match === null) {
    errors.push(`国家目录名称存在歧义：${folderName}。请在 country.json 中填写 countryId。`)
    return undefined
  }
  if (!match) {
    errors.push(`找不到国家：${folderName}。目录名需与 StarMap 中英文国家名一致。`)
    return undefined
  }
  return match
}

function resolveCity(folderName, country) {
  const match = country.cityAliases.get(normalizeName(folderName))
  if (match === null) {
    errors.push(`${country.nameEn} 内的城市目录名称存在歧义：${folderName}`)
    return undefined
  }
  if (!match) {
    errors.push(`在 ${country.nameEn} 中找不到城市：${folderName}。请先把该城市加入 StarMap 数据。`)
    return undefined
  }
  return match
}

function validateExtension(filePath, kind) {
  const extension = path.extname(filePath).toLowerCase()
  const isSupported = kind === 'video' ? videoExtensions.has(extension) : stillExtensions.has(extension)
  if (isSupported) return extension

  const relativePath = path.relative(inboxRoot, filePath)
  if (needsConversionExtensions.has(extension)) {
    errors.push(`${relativePath} 需要先转换成网页格式。照片使用 JPG/WebP/AVIF，视频使用 MP4/WebM。`)
  } else {
    warnings.push(`${relativePath} 不是支持的媒体格式，已忽略。`)
  }
  return undefined
}

function metadataForFile(metadata, cityRoot, filePath) {
  if (!metadata || typeof metadata !== 'object') return {}
  const relativeKey = toPosix(path.relative(cityRoot, filePath))
  return metadata[relativeKey] ?? metadata[path.basename(filePath)] ?? {}
}

function resolveMetadataLocation(metadata, fallbackCountry, fallbackCity, locationIndex, filePath) {
  const countryId = typeof metadata.countryId === 'string' ? metadata.countryId.trim() : ''
  const cityId = typeof metadata.cityId === 'string' ? metadata.cityId.trim() : ''
  if (!countryId && !cityId) return { country: fallbackCountry, city: fallbackCity }

  const relativePath = path.relative(inboxRoot, filePath)
  if (!countryId || !cityId) {
    errors.push(`${relativePath} 的归属覆盖必须同时填写 countryId 和 cityId。`)
    return undefined
  }

  const country = locationIndex.countriesById.get(countryId)
  if (!country) {
    errors.push(`${relativePath} 指定了不存在的 countryId：${countryId}`)
    return undefined
  }
  const city = country.citiesById.get(cityId)
  if (!city) {
    errors.push(`${relativePath} 指定了不属于 ${country.nameEn} 的 cityId：${cityId}`)
    return undefined
  }
  return { country, city }
}

function droneKindForFile(filePath, metadata) {
  const extension = path.extname(filePath).toLowerCase()
  if (videoExtensions.has(extension) || extension === '.mov') return 'video'

  const declaredKind = droneTypeAliases.get(normalizeName(metadata.kind ?? metadata.type))
  if (declaredKind) return declaredKind

  if (/(?:^|[-_. ])(?:360|pano|panorama)(?:[-_. ]|$)/i.test(path.basename(filePath))) {
    return 'panorama360'
  }

  warnings.push(`${path.relative(inboxRoot, filePath)} 未标注无人机类型，按普通航拍照片处理；360 全景请让 Agent 在 media.json 中标记 kind。`)
  return 'aerialPhoto'
}

function hasValidPosition(position) {
  return position
    && typeof position.lat === 'number'
    && typeof position.lng === 'number'
    && position.lat >= -90
    && position.lat <= 90
    && position.lng >= -180
    && position.lng <= 180
}

async function planFile({ filePath, kind, country, city, metadata = {} }) {
  const extension = validateExtension(filePath, kind)
  if (!extension) return

  const fileStats = await stat(filePath)
  const sizeInMiB = fileStats.size / 1024 / 1024
  const warningThreshold = kind === 'panorama360' ? 40 : kind === 'video' ? 120 : 16
  if (sizeInMiB > warningThreshold) {
    warnings.push(`${path.relative(inboxRoot, filePath)} 为 ${sizeInMiB.toFixed(1)} MiB，建议 Agent 生成更轻的网页版本。`)
  }

  const digest = await sha256(filePath)
  const shortHash = digest.slice(0, 16)
  const cityPart = slugify(city.nameEn)
  const outputDirectory = path.join(outputRoot, country.id, cityPart, kind, shortHash)
  const outputPath = path.join(outputDirectory, `original${extension}`)
  const src = publicSrc(outputPath)
  const isStill = kind !== 'video' && stillExtensions.has(extension)
  let dimensions
  let variants = {
    original: { src },
  }

  if (isStill) {
    try {
      dimensions = orientedDimensions(await sharp(filePath).metadata())
    } catch (error) {
      errors.push(`${path.relative(inboxRoot, filePath)} 无法读取图片尺寸：${error.message}`)
      return
    }

    if (!dimensions) {
      errors.push(`${path.relative(inboxRoot, filePath)} 缺少有效的图片宽高。`)
      return
    }

    const thumbDimensions = dimensionsInside(dimensions.width, dimensions.height, 640)
    const previewDimensions = dimensionsInside(dimensions.width, dimensions.height, 2400)
    variants = {
      thumb: {
        src: publicSrc(path.join(outputDirectory, 'thumb.webp')),
        ...thumbDimensions,
      },
      preview: {
        src: publicSrc(path.join(outputDirectory, 'preview.webp')),
        ...previewDimensions,
      },
      original: {
        src,
        ...dimensions,
      },
    }
  }
  const isDrone = kind === 'panorama360' || kind === 'aerialPhoto' || kind === 'video'
  const metadataReady = !isDrone || (
    typeof metadata.date === 'string'
    && typeof metadata.resolution === 'string'
  )

  if (isDrone && !metadataReady) {
    warnings.push(`${path.relative(inboxRoot, filePath)} 缺少日期或分辨率；会进入目录，但暂不显示为 Drone Media。`)
  }

  plannedItems.push({
    id: typeof metadata.id === 'string' && metadata.id.trim()
      ? metadata.id.trim()
      : `${country.id}-${cityPart}-${kind}-${shortHash}`,
    kind,
    scope: 'city',
    countryId: country.id,
    countryName: country.nameEn,
    cityId: city.id,
    cityName: city.nameEn,
    src,
    variants,
    ...(dimensions ?? {}),
    originalFileName: path.basename(filePath),
    ...(typeof metadata.titleZh === 'string' ? { titleZh: metadata.titleZh } : {}),
    ...(typeof metadata.titleEn === 'string' ? { titleEn: metadata.titleEn } : {}),
    ...(typeof metadata.date === 'string' ? { date: metadata.date } : {}),
    ...(typeof metadata.resolution === 'string' ? { resolution: metadata.resolution } : {}),
    ...(typeof metadata.captureType === 'string' ? { captureType: metadata.captureType } : {}),
    ...(typeof metadata.description === 'string' ? { description: metadata.description } : {}),
    ...(hasValidPosition(metadata.position) ? { position: metadata.position } : {}),
    ...(typeof metadata.altitudeMeters === 'number' ? { altitudeMeters: metadata.altitudeMeters } : {}),
    ...(typeof metadata.relativeAltitudeMeters === 'number' ? { relativeAltitudeMeters: metadata.relativeAltitudeMeters } : {}),
    isCover: false,
    status: metadataReady ? 'ready' : 'needsMetadata',
    _sourcePath: filePath,
    _outputPath: outputPath,
    _outputDirectory: outputDirectory,
    _derivatives: isStill ? [
      { outputPath: path.join(outputDirectory, 'thumb.webp'), maxEdge: 640, quality: 76 },
      { outputPath: path.join(outputDirectory, 'preview.webp'), maxEdge: 2400, quality: 84 },
    ] : [],
  })
}

async function scanPhotos(photosRoot, country, city) {
  if (!photosRoot) return
  for (const filePath of await listMediaFiles(photosRoot)) {
    await planFile({ filePath, kind: 'photo', country, city })
  }
}

async function scanDrone(droneRoot, country, city, cityRoot, locationIndex) {
  if (!droneRoot) return
  const cityMetadataPath = path.join(cityRoot, 'media.json')
  const droneMetadataPath = path.join(droneRoot, 'media.json')
  const metadataPath = await pathExists(cityMetadataPath) ? cityMetadataPath : droneMetadataPath
  const metadata = metadataPath
    ? await readJson(metadataPath, `${country.nameEn}/${city.nameEn}/media.json`)
    : {}

  for (const filePath of await listMediaFiles(droneRoot)) {
    const fileMetadata = metadataForFile(metadata, cityRoot, filePath)
    const location = resolveMetadataLocation(fileMetadata, country, city, locationIndex, filePath)
    if (!location) continue
    await planFile({
      filePath,
      kind: droneKindForFile(filePath, fileMetadata),
      country: location.country,
      city: location.city,
      metadata: fileMetadata,
    })
  }
}

async function scanCity(cityRoot, country, city, locationIndex) {
  const directMedia = (await readdir(cityRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && !ignoredControlExtensions.has(path.extname(entry.name).toLowerCase()))
  if (directMedia.length > 0) {
    errors.push(`${country.nameEn}/${city.nameEn} 根目录有 ${directMedia.length} 个媒体文件；请放入 photos 或 drone。`)
  }

  const photosRoot = await findNamedRoot(cityRoot, photoFolderAliases, '普通照片')
  const droneRoot = await findNamedRoot(cityRoot, droneFolderAliases, '无人机')
  await scanPhotos(photosRoot, country, city)
  await scanDrone(droneRoot, country, city, cityRoot, locationIndex)

  const allowedFolderNames = new Set([...photoFolderAliases, ...droneFolderAliases])
  for (const entry of await listDirectories(cityRoot)) {
    if (!entry.name.startsWith('_') && !allowedFolderNames.has(normalizeName(entry.name))) {
      warnings.push(`${country.nameEn}/${city.nameEn}/${entry.name} 不是 photos 或 drone，已忽略。`)
    }
  }
}

function markCovers(items) {
  const groups = new Map()
  for (const item of items.filter((candidate) => candidate.kind === 'photo')) {
    const key = item.cityId
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  for (const group of groups.values()) {
    group.sort((left, right) => {
      const leftCover = /^cover(?:[-_. ]|$)/i.test(left.originalFileName) ? 0 : 1
      const rightCover = /^cover(?:[-_. ]|$)/i.test(right.originalFileName) ? 0 : 1
      return leftCover - rightCover || left.originalFileName.localeCompare(right.originalFileName, 'zh-CN')
    })
    if (group[0]) group[0].isCover = true
  }
}

async function applyPlan(items) {
  for (const item of items) {
    await mkdir(item._outputDirectory, { recursive: true })
    try {
      await copyFile(item._sourcePath, item._outputPath, constants.COPYFILE_EXCL)
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
    }

    for (const derivative of item._derivatives) {
      if (await pathExists(derivative.outputPath)) continue
      await sharp(item._sourcePath)
        .rotate()
        .resize({
          width: derivative.maxEdge,
          height: derivative.maxEdge,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: derivative.quality, effort: 4 })
        .toFile(derivative.outputPath)
    }
  }

  const publicItems = items.map(({ _sourcePath, _outputPath, _outputDirectory, _derivatives, ...item }) => item)
  await mkdir(path.dirname(catalogPath), { recursive: true })
  await writeFile(catalogPath, `${JSON.stringify({
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    privacyLevel: 'local-only',
    items: publicItems,
  }, null, 2)}\n`, 'utf8')
}

function printReport(items) {
  const counts = items.reduce((result, item) => {
    result[item.kind] = (result[item.kind] ?? 0) + 1
    return result
  }, {})

  console.log(`StarMap 媒体${shouldApply ? '导入' : '预检'}：${items.length} 个文件`)
  console.log(`普通照片 ${counts.photo ?? 0} | 360 全景 ${counts.panorama360 ?? 0} | 航拍照片 ${counts.aerialPhoto ?? 0} | 视频 ${counts.video ?? 0}`)
  if (warnings.length > 0) {
    console.log(`\n提醒（${warnings.length}）：`)
    for (const warning of warnings) console.log(`- ${warning}`)
  }
  if (errors.length > 0) {
    console.error(`\n需要处理（${errors.length}）：`)
    for (const error of errors) console.error(`- ${error}`)
  }
  if (!shouldApply && errors.length === 0) {
    console.log('\n预检通过。确认无误后运行 npm run media:import。')
  }
}

async function main() {
  const locationIndex = await createLocationIndex()
  if (!locationIndex) {
    printReport([])
    process.exitCode = 1
    return
  }

  if (!(await pathExists(inboxRoot))) {
    errors.push('找不到 02_Assets/MediaInbox。')
  } else {
    for (const countryEntry of await listDirectories(inboxRoot)) {
      if (countryEntry.name.startsWith('_')) continue
      const countryRoot = path.join(inboxRoot, countryEntry.name)
      const countryConfigPath = path.join(countryRoot, 'country.json')
      const countryConfig = await pathExists(countryConfigPath)
        ? await readJson(countryConfigPath, `${countryEntry.name}/country.json`)
        : undefined
      const country = resolveCountry(countryEntry.name, countryConfig, locationIndex)
      if (!country) continue

      const countryRootMedia = (await readdir(countryRoot, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && !ignoredControlExtensions.has(path.extname(entry.name).toLowerCase()))
      if (countryRootMedia.length > 0) {
        errors.push(`${country.nameEn} 根目录有 ${countryRootMedia.length} 个媒体文件；最小单位是城市，请先建立城市目录。`)
      }

      for (const cityEntry of await listDirectories(countryRoot)) {
        const cityRoot = path.join(countryRoot, cityEntry.name)
        if (cityEntry.name.startsWith('_')) {
          const unresolvedFiles = await listMediaFiles(cityRoot)
          if (unresolvedFiles.length > 0) {
            errors.push(`${country.nameEn}/${cityEntry.name} 中还有 ${unresolvedFiles.length} 个文件；请让 Agent 确认城市后再导入。`)
          }
          continue
        }

        const city = resolveCity(cityEntry.name, country)
        if (!city) continue
        await scanCity(cityRoot, country, city, locationIndex)
      }
    }
  }

  const uniqueItems = [...new Map(plannedItems.map((item) => [item.id, item])).values()]
  if (uniqueItems.length !== plannedItems.length) {
    warnings.push(`发现 ${plannedItems.length - uniqueItems.length} 个内容完全相同的重复文件，目录中只保留一份记录。`)
  }
  markCovers(uniqueItems)
  printReport(uniqueItems)

  if (errors.length > 0) {
    if (shouldApply) console.error('\n未写入任何新目录。请先处理以上问题。')
    process.exitCode = 1
    return
  }

  if (shouldApply) {
    await applyPlan(uniqueItems)
    console.log(`\n已生成本地目录：${path.relative(projectRoot, catalogPath)}`)
    console.log('重新启动本地预览后，普通城市照片与完整元数据的 Drone Media 会自动出现。')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
