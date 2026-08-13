import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArcType,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  EllipsoidGeodesic,
  HeadingPitchRange,
  Ion,
  LabelStyle,
  Math as CesiumMath,
  PolylineOutlineMaterialProperty,
  SceneTransforms,
  TileMapServiceImageryProvider,
  Viewer as CesiumViewer,
  buildModuleUrl,
  createWorldImageryAsync,
} from 'cesium'
import {
  Entity,
  Globe as CesiumGlobe,
  ImageryLayer,
  Scene,
  ScreenSpaceCameraController,
  SkyBox as CesiumSkyBox,
  SkyAtmosphere,
  Sun as CesiumSun,
  Viewer,
} from 'resium'
import type { CesiumComponentRef } from 'resium'
import { droneMediaById, droneMediaItems } from '../data/droneMedia'
import type { DroneMediaItem } from '../data/droneMedia'
import { cities, cityById, countries, countryById, journeyDays, routes, travelAtlasDisplay } from '../data/travelAtlas'
import type { City, CityId, CountryId, SelectionMode } from '../types/travel'
import { CesiumConstellationSky } from './CesiumConstellationSky'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN

if (ionToken) {
  Ion.defaultAccessToken = ionToken
}

const createLocalImagery = () => TileMapServiceImageryProvider.fromUrl(
  buildModuleUrl('Assets/Textures/NaturalEarthII'),
)

const maxCesiumDevicePixelRatio = 2

const atlasImageryProvider = ionToken
  ? createWorldImageryAsync().catch(createLocalImagery)
  : createLocalImagery()

type CesiumAtlasGlobeProps = {
  hoveredCountryId?: CountryId
  imageryBrightness: number
  imageryContrast: number
  imagerySaturation: number
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  selectionMode: SelectionMode
  globeScale: number
  resetVersion: number
  isNight: boolean
  showMapContent?: boolean
  activeDroneMediaCityId?: CityId
  activeDroneMediaItemId?: string
  onSelectCity: (cityId: CityId) => void
  onSelectDroneMediaItem: (item: DroneMediaItem) => void
}

type MappedCity = City & {
  lat: number
  lng: number
}

type CursorTrailPoint = {
  x: number
  y: number
  time: number
  speed: number
}

const cursorTrailMaxAgeMs = 680
const cursorTrailMaxLength = 620
const cursorTrailMaxPoints = 96
const cursorTrailFadeDelayMs = 52
const cursorTrailFadeDurationMs = 320

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const trimCursorTrailPoints = (points: CursorTrailPoint[], now: number) => {
  if (points.length < 2) return points

  let startIndex = points.length - 1
  let accumulatedLength = 0

  for (let index = points.length - 1; index > 0; index -= 1) {
    const current = points[index]
    const previous = points[index - 1]
    const segmentLength = Math.hypot(current.x - previous.x, current.y - previous.y)

    if (
      now - previous.time > cursorTrailMaxAgeMs
      || accumulatedLength + segmentLength > cursorTrailMaxLength
    ) {
      break
    }

    accumulatedLength += segmentLength
    startIndex = index - 1
  }

  return points.slice(startIndex)
}

const smoothCursorTrailPoints = (points: CursorTrailPoint[]) => {
  if (points.length < 3) return points

  const smoothed: CursorTrailPoint[] = []
  const samplesPerSegment = 4

  for (let index = 0; index < points.length - 1; index += 1) {
    const point0 = points[Math.max(0, index - 1)]
    const point1 = points[index]
    const point2 = points[index + 1]
    const point3 = points[Math.min(points.length - 1, index + 2)]

    for (let sample = 0; sample < samplesPerSegment; sample += 1) {
      const progress = sample / samplesPerSegment
      const progressSquared = progress * progress
      const progressCubed = progressSquared * progress
      const interpolate = (a: number, b: number, c: number, d: number) => 0.5 * (
        (2 * b)
        + (-a + c) * progress
        + (2 * a - 5 * b + 4 * c - d) * progressSquared
        + (-a + 3 * b - 3 * c + d) * progressCubed
      )

      smoothed.push({
        x: interpolate(point0.x, point1.x, point2.x, point3.x),
        y: interpolate(point0.y, point1.y, point2.y, point3.y),
        time: point1.time + (point2.time - point1.time) * progress,
        speed: point1.speed + (point2.speed - point1.speed) * progress,
      })
    }
  }

  smoothed.push(points[points.length - 1])
  return smoothed
}

const overviewTarget = travelAtlasDisplay.overviewTarget

const cityMarkerHeight = 600

const cityPosition = (lng: number, lat: number) =>
  Cartesian3.fromDegrees(lng, lat, cityMarkerHeight)

const droneMediaPosition = (item: DroneMediaItem) =>
  Cartesian3.fromDegrees(
    item.position.lng,
    item.position.lat,
    (item.position.altitudeMeters ?? 0) + 45,
  )

const dronePinImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="22" fill="#0ea5e9" fill-opacity="0.9" filter="url(#glow)"/>
  <circle cx="32" cy="32" r="17" fill="#020617" fill-opacity="0.78"/>
  <path d="M17 27h10l3-8h4l3 8h10v5H36l-3 9h-2l-3-9H17z" fill="#e0f2fe"/>
  <circle cx="18" cy="29.5" r="3" fill="#7dd3fc"/>
  <circle cx="46" cy="29.5" r="3" fill="#7dd3fc"/>
  <circle cx="32" cy="20" r="3" fill="#7dd3fc"/>
  <circle cx="32" cy="42" r="3" fill="#7dd3fc"/>
</svg>
`)}`

const cityHoverMarkerImageCache = new Map<string, string>()

const cityHoverMarkerImage = (accent: string, corePixelSize: number) => {
  const cacheKey = `${accent}:${corePixelSize}`
  const cachedImage = cityHoverMarkerImageCache.get(cacheKey)
  if (cachedImage) return cachedImage

  const markerPixelSize = 38
  const coreRadius = corePixelSize * 32 / markerPixelSize
  const outlineWidth = 2 * 64 / markerPixelSize
  const image = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="city-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.62"/>
          <stop offset="24%" stop-color="${accent}" stop-opacity="0.44"/>
          <stop offset="58%" stop-color="${accent}" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#city-glow)"/>
      <circle
        cx="32"
        cy="32"
        r="${coreRadius}"
        fill="${accent}"
        stroke="#ffffff"
        stroke-opacity="0.94"
        stroke-width="${outlineWidth}"
      />
    </svg>
  `)}`

  cityHoverMarkerImageCache.set(cacheKey, image)
  return image
}

type CameraScale = 'world' | 'country' | 'city' | 'droneGroup' | 'drone'

const cameraScaleStates: Record<
  CameraScale,
  { rangeOrHeight: number; pitch: number; duration: number }
> = {
  world: { rangeOrHeight: 16_500_000, pitch: -90, duration: 1.2 },
  country: { rangeOrHeight: 3_100_000, pitch: -62, duration: 1.3 },
  city: { rangeOrHeight: 680_000, pitch: -48, duration: 1.35 },
  droneGroup: { rangeOrHeight: 20_000, pitch: -42, duration: 1.15 },
  drone: { rangeOrHeight: 9_000, pitch: -42, duration: 1 },
}

const cameraScaleForGlobeScale = (scale: number): CameraScale => {
  if (scale < 1.68) return 'city'
  if (scale < 2.55) return 'country'
  return 'world'
}

const createRoutePositions = (
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  routeType: string,
) => {
  const start = Cartographic.fromDegrees(startLng, startLat)
  const end = Cartographic.fromDegrees(endLng, endLat)
  const geodesic = new EllipsoidGeodesic(start, end)
  const routeHeight =
    routeType === 'flight' ? 24_000 : routeType === 'ferry' ? 8_000 : 6_000
  const segmentCount = Math.min(
    96,
    Math.max(32, Math.ceil(geodesic.surfaceDistance / 150_000)),
  )

  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    if (index === 0) return cityPosition(startLng, startLat)
    if (index === segmentCount) return cityPosition(endLng, endLat)

    const fraction = index / segmentCount
    const point = geodesic.interpolateUsingFraction(fraction)
    const height = cityMarkerHeight + Math.sin(Math.PI * fraction) * (routeHeight - cityMarkerHeight)
    return Cartesian3.fromRadians(point.longitude, point.latitude, height)
  })
}

const isPositionFacingCamera = (
  position: Cartesian3,
  cameraPosition: Cartesian3,
) => {
  const surfaceNormal = Cartesian3.normalize(position, new Cartesian3())
  const cameraVector = Cartesian3.subtract(cameraPosition, position, new Cartesian3())

  return Cartesian3.dot(surfaceNormal, cameraVector) > -80_000
}

const setsMatch = <T,>(left: Set<T> | null, right: Set<T>) =>
  left !== null &&
  left.size === right.size &&
  [...right].every((item) => left.has(item))

const configureViewer = (viewer: CesiumViewer) => {
  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1)
  viewer.resolutionScale = Math.min(
    1,
    maxCesiumDevicePixelRatio / devicePixelRatio,
  )
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 120
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 22_000_000
  viewer.scene.globe.depthTestAgainstTerrain = true
  viewer.scene.minimumDisableDepthTestDistance = 0
  viewer.camera.percentageChanged = 0.01
  viewer.forceResize()
}

const debugCameraFocus = (
  source: string,
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return

  console.debug('[camera-focus]', JSON.stringify({
    source,
    time: Date.now(),
    ...details,
  }))
}

const debugCesiumGlobeScaleProp = (details: Record<string, unknown>) => {
  if (!import.meta.env.DEV) return

  console.debug('[cesium-globe-scale-prop]', JSON.stringify({
    time: Date.now(),
    ...details,
  }))
}

const debugCameraState = (details: Record<string, unknown>) => {
  if (!import.meta.env.DEV) return

  console.debug('[camera-state]', JSON.stringify({
    time: Date.now(),
    ...details,
  }))
}

const debugCameraCommand = (
  commandNumber: number,
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return

  console.debug('[camera-command]', JSON.stringify({
    commandNumber,
    time: Date.now(),
    ...details,
  }))
}

const debugCameraBlockedByDroneLock = (details: Record<string, unknown>) => {
  if (!import.meta.env.DEV) return

  console.debug('[camera-blocked-by-drone-lock]', JSON.stringify({
    time: Date.now(),
    ...details,
  }))
}

type CameraFocus =
  | { type: 'droneItem'; id: string; item: DroneMediaItem }
  | { type: 'droneGroup'; id?: CityId; items: DroneMediaItem[] }
  | { type: 'city'; id?: CityId; lat: number; lng: number }
  | { type: 'country'; id?: CountryId; lat: number; lng: number }
  | { type: 'overview'; id: 'overview'; lat: number; lng: number }

type CameraCommandSource =
  | 'debug-direct-drone'
  | 'drone-item'
  | 'drone-group'
  | 'city'
  | 'country'
  | 'overview'

type CameraCommandRequest = {
  details: Record<string, unknown>
  reason: string
  run: (viewer: CesiumViewer) => void
  source: CameraCommandSource
}

type ExecuteCameraCommand = (request: CameraCommandRequest) => boolean

const droneLockAllowedCameraSources = new Set<CameraCommandSource>([
  'debug-direct-drone',
  'drone-item',
  'drone-group',
])

type TravelAtlasDebugCamera = {
  getCameraPose: () => {
    height: number
    heading: number
    lat: number
    lng: number
    pitch: number
    roll: number
  }
  flyToDroneItem: (itemId: string, testHeight?: number) => void
}

declare global {
  interface Window {
    __travelAtlasDebugCamera?: TravelAtlasDebugCamera
  }
}

const installDebugCameraApi = (
  viewer: CesiumViewer,
  executeCameraCommand: ExecuteCameraCommand,
  activateDebugDroneCameraLock: () => void,
) => {
  if (import.meta.env.PROD) return undefined

  const logCameraAfter = (item: DroneMediaItem) => {
    const { positionCartographic } = viewer.camera
    const surfaceNormal = Cartesian3.normalize(viewer.camera.positionWC, new Cartesian3())
    const directionDotSurfaceNormal = Cartesian3.dot(
      viewer.camera.directionWC,
      surfaceNormal,
    )

    console.debug('[debug-direct-drone-camera-after]', JSON.stringify({
      itemId: item.id,
      actualCameraHeight: positionCartographic.height,
      actualCameraLng: CesiumMath.toDegrees(positionCartographic.longitude),
      actualCameraLat: CesiumMath.toDegrees(positionCartographic.latitude),
      actualHeading: CesiumMath.toDegrees(viewer.camera.heading),
      actualPitch: CesiumMath.toDegrees(viewer.camera.pitch),
      actualRoll: CesiumMath.toDegrees(viewer.camera.roll),
      directionDotSurfaceNormal,
      time: Date.now(),
    }))
  }

  const flyToDroneItem = (itemId: string, testHeight: number) => {
    const item = droneMediaById[itemId]

    if (!item) {
      console.warn('[debug-direct-drone-camera-command]', JSON.stringify({
        itemId,
        error: 'Drone media item not found',
        time: Date.now(),
      }))
      return
    }

    activateDebugDroneCameraLock()
    executeCameraCommand({
      source: 'debug-direct-drone',
      reason: 'dev direct drone camera test',
      details: {
        itemId: item.id,
        fileName: item.fileName,
        lat: item.position.lat,
        lng: item.position.lng,
        altitudeMeters: item.position.altitudeMeters,
        testHeight,
        destination: 'cartesian-height',
        rangeOrHeight: testHeight,
      },
      run: (currentViewer) => {
        currentViewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            item.position.lng,
            item.position.lat,
            testHeight,
          ),
          duration: 0.8,
          orientation: {
            heading: 0,
            pitch: CesiumMath.toRadians(-55),
            roll: 0,
          },
          complete: () => logCameraAfter(item),
        })
      },
    })
  }

  const debugCamera: TravelAtlasDebugCamera = {
    getCameraPose: () => {
      const { positionCartographic } = viewer.camera

      return {
        height: positionCartographic.height,
        heading: CesiumMath.toDegrees(viewer.camera.heading),
        lat: CesiumMath.toDegrees(positionCartographic.latitude),
        lng: CesiumMath.toDegrees(positionCartographic.longitude),
        pitch: CesiumMath.toDegrees(viewer.camera.pitch),
        roll: CesiumMath.toDegrees(viewer.camera.roll),
      }
    },
    flyToDroneItem: (itemId, testHeight = 1_200) => flyToDroneItem(itemId, testHeight),
  }

  window.__travelAtlasDebugCamera = debugCamera
  console.debug('[debug-direct-drone-camera-ready]', JSON.stringify({
    methods: Object.keys(debugCamera),
    time: Date.now(),
  }))
  return debugCamera
}

export function CesiumAtlasGlobe({
  hoveredCountryId,
  imageryBrightness,
  imageryContrast,
  imagerySaturation,
  selectedCountryId,
  selectedCityId,
  selectionMode,
  globeScale,
  resetVersion,
  isNight,
  showMapContent = true,
  activeDroneMediaCityId,
  activeDroneMediaItemId,
  onSelectCity,
  onSelectDroneMediaItem,
}: CesiumAtlasGlobeProps) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null)
  const globeShellRef = useRef<HTMLDivElement>(null)
  const cursorGlowRef = useRef<HTMLDivElement>(null)
  const cursorTrailRef = useRef<HTMLCanvasElement>(null)
  const cursorTrailPointsRef = useRef<CursorTrailPoint[]>([])
  const cursorTrailFrameRef = useRef<number | null>(null)
  const cursorTrailDrawRef = useRef<(now: number) => void>(() => undefined)
  const cursorTrailReducedMotionRef = useRef(false)
  const cursorTrailNeedsResetRef = useRef(true)
  const lastCursorPointRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastCameraFocusKeyRef = useRef<string | undefined>(undefined)
  const cameraCommandCountRef = useRef(0)
  const debugDroneCameraLockUntilRef = useRef(0)
  const [viewerReadyVersion, setViewerReadyVersion] = useState(0)
  const updateVisibleHemisphereRef = useRef<() => void>(() => undefined)
  const [focusOffset, setFocusOffset] = useState({ x: 0, y: 0 })
  const [visibleCityIds, setVisibleCityIds] = useState<Set<CityId> | null>(null)
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string> | null>(null)
  const selectedCountry = selectedCountryId ? countryById[selectedCountryId] : undefined
  const selectedCity = selectedCityId ? cityById[selectedCityId] : undefined
  const selectedAccent = selectedCountry?.accent ?? '#38bdf8'

  const drawCursorTrail = useCallback((now: number) => {
    const canvas = cursorTrailRef.current
    if (!canvas || cursorTrailReducedMotionRef.current) {
      cursorTrailFrameRef.current = null
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      cursorTrailFrameRef.current = null
      return
    }

    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    const targetWidth = Math.round(cssWidth * pixelRatio)
    const targetHeight = Math.round(cssHeight * pixelRatio)

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    const trimmedPoints = trimCursorTrailPoints(cursorTrailPointsRef.current, now)
    cursorTrailPointsRef.current = trimmedPoints
    const latestPoint = trimmedPoints[trimmedPoints.length - 1]

    if (!latestPoint || trimmedPoints.length < 2) {
      cursorTrailFrameRef.current = null
      return
    }

    const idleTime = now - latestPoint.time
    const idleFade = clamp01(
      1 - Math.max(0, idleTime - cursorTrailFadeDelayMs) / cursorTrailFadeDurationMs,
    )

    if (idleFade <= 0) {
      cursorTrailPointsRef.current = []
      cursorTrailFrameRef.current = null
      return
    }

    const points = smoothCursorTrailPoints(trimmedPoints)
    const night = isNight
    const themeStrength = night ? 1 : 0.62
    const speedLift = Math.min(1.7, latestPoint.speed * 0.72)

    context.globalCompositeOperation = 'lighter'

    const drawRibbonPass = (widthScale: number, alphaScale: number, blur: number) => {
      const leftEdge: Array<{ x: number; y: number }> = []
      const rightEdge: Array<{ x: number; y: number }> = []

      points.forEach((point, index) => {
        const previous = points[Math.max(0, index - 1)]
        const next = points[Math.min(points.length - 1, index + 1)]
        const tangentX = next.x - previous.x
        const tangentY = next.y - previous.y
        const tangentLength = Math.max(0.001, Math.hypot(tangentX, tangentY))
        const normalX = -tangentY / tangentLength
        const normalY = tangentX / tangentLength
        const progress = index / (points.length - 1)
        const taper = Math.pow(progress, 1.52)
        const velocity = Math.min(1.48, 0.76 + point.speed * 0.28)
        const halfWidth = (0.08 + taper * (3.35 + speedLift)) * widthScale * velocity

        leftEdge.push({
          x: point.x + normalX * halfWidth,
          y: point.y + normalY * halfWidth,
        })
        rightEdge.push({
          x: point.x - normalX * halfWidth,
          y: point.y - normalY * halfWidth,
        })
      })

      const firstPoint = points[0]
      const lastPoint = points[points.length - 1]
      const gradient = context.createLinearGradient(
        firstPoint.x,
        firstPoint.y,
        lastPoint.x,
        lastPoint.y,
      )
      const alpha = alphaScale * idleFade * themeStrength
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(0.16, `rgba(255, 255, 255, ${alpha * 0.08})`)
      gradient.addColorStop(0.52, `rgba(255, 255, 255, ${alpha * 0.42})`)
      gradient.addColorStop(0.84, `rgba(255, 255, 255, ${alpha * 0.82})`)
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`)

      context.save()
      context.filter = blur > 0 ? `blur(${blur}px)` : 'none'
      context.shadowBlur = blur * 0.7
      context.shadowColor = `rgba(255, 255, 255, ${alpha * 0.72})`
      context.fillStyle = gradient
      context.beginPath()
      context.moveTo(leftEdge[0].x, leftEdge[0].y)
      leftEdge.slice(1).forEach((point) => context.lineTo(point.x, point.y))
      rightEdge.slice().reverse().forEach((point) => context.lineTo(point.x, point.y))
      context.closePath()
      context.fill()
      context.restore()
    }

    drawRibbonPass(3.35, 0.11, night ? 7 : 5)
    drawRibbonPass(1.75, 0.28, night ? 3.5 : 2.5)
    drawRibbonPass(0.72, 0.94, 0)

    const headRadius = (night ? 8.5 : 7) + speedLift * 1.3
    const headGlow = context.createRadialGradient(
      latestPoint.x,
      latestPoint.y,
      0,
      latestPoint.x,
      latestPoint.y,
      headRadius,
    )
    headGlow.addColorStop(0, `rgba(255, 255, 255, ${0.98 * idleFade})`)
    headGlow.addColorStop(0.22, `rgba(255, 255, 255, ${0.74 * idleFade * themeStrength})`)
    headGlow.addColorStop(0.58, `rgba(255, 255, 255, ${0.24 * idleFade * themeStrength})`)
    headGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = headGlow
    context.beginPath()
    context.arc(latestPoint.x, latestPoint.y, headRadius, 0, Math.PI * 2)
    context.fill()

    cursorTrailFrameRef.current = window.requestAnimationFrame(
      (nextFrameTime) => cursorTrailDrawRef.current(nextFrameTime),
    )
  }, [isNight])

  useEffect(() => {
    cursorTrailDrawRef.current = drawCursorTrail
  }, [drawCursorTrail])

  const requestCursorTrailFrame = useCallback(() => {
    if (cursorTrailFrameRef.current !== null || cursorTrailReducedMotionRef.current) return
    cursorTrailFrameRef.current = window.requestAnimationFrame(drawCursorTrail)
  }, [drawCursorTrail])

  const updateCursorGlow = useCallback((event: PointerEvent) => {
    const shell = globeShellRef.current
    const glow = cursorGlowRef.current
    if (!shell || !glow) return

    const bounds = shell.getBoundingClientRect()
    glow.style.setProperty('--cursor-x', `${event.clientX - bounds.left}px`)
    glow.style.setProperty('--cursor-y', `${event.clientY - bounds.top}px`)
    glow.dataset.active = 'true'

    if (event.pointerType !== 'mouse') return
    if (!cursorTrailRef.current || cursorTrailReducedMotionRef.current) return

    if (cursorTrailNeedsResetRef.current) {
      cursorTrailPointsRef.current = []
      lastCursorPointRef.current = null
      cursorTrailNeedsResetRef.current = false
    }

    const coalescedPointerEvents = event.getCoalescedEvents?.() ?? []
    const coalescedEvents = coalescedPointerEvents.length > 0
      ? coalescedPointerEvents
      : [event]
    const frameTime = performance.now()

    coalescedEvents.forEach((pointerEvent, index) => {
      const x = pointerEvent.clientX - bounds.left
      const y = pointerEvent.clientY - bounds.top
      const time = frameTime - (coalescedEvents.length - 1 - index) * 2
      const previous = lastCursorPointRef.current

      if (!previous) {
        lastCursorPointRef.current = { x, y, time }
        cursorTrailPointsRef.current.push({ x, y, time, speed: 0 })
        return
      }

      const distance = Math.hypot(x - previous.x, y - previous.y)
      const elapsed = Math.max(time - previous.time, 4)
      if (distance < 0.85) return

      const speed = Math.min(3.2, distance / elapsed)
      lastCursorPointRef.current = { x, y, time }
      cursorTrailPointsRef.current.push({ x, y, time, speed })
    })

    cursorTrailPointsRef.current = trimCursorTrailPoints(cursorTrailPointsRef.current, frameTime)
      .slice(-cursorTrailMaxPoints)
    requestCursorTrailFrame()
  }, [requestCursorTrailFrame])
  const hideCursorGlow = useCallback(() => {
    if (cursorGlowRef.current) cursorGlowRef.current.dataset.active = 'false'
    lastCursorPointRef.current = null
    cursorTrailNeedsResetRef.current = true
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', updateCursorGlow, { capture: true, passive: true })
    window.addEventListener('blur', hideCursorGlow)
    document.documentElement.addEventListener('pointerleave', hideCursorGlow)

    return () => {
      window.removeEventListener('pointermove', updateCursorGlow, true)
      window.removeEventListener('blur', hideCursorGlow)
      document.documentElement.removeEventListener('pointerleave', hideCursorGlow)
    }
  }, [hideCursorGlow, updateCursorGlow])

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      cursorTrailReducedMotionRef.current = reducedMotionQuery.matches
      if (!reducedMotionQuery.matches) return

      cursorTrailPointsRef.current = []
      if (cursorTrailFrameRef.current !== null) {
        window.cancelAnimationFrame(cursorTrailFrameRef.current)
        cursorTrailFrameRef.current = null
      }
      const canvas = cursorTrailRef.current
      const context = canvas?.getContext('2d')
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
    }

    updateReducedMotion()
    reducedMotionQuery.addEventListener('change', updateReducedMotion)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateReducedMotion)
      if (cursorTrailFrameRef.current !== null) {
        window.cancelAnimationFrame(cursorTrailFrameRef.current)
      }
    }
  }, [])
  const captureViewer = useCallback(
    (component: CesiumComponentRef<CesiumViewer> | null) => {
      if (viewerRef.current === component) return
      viewerRef.current = component
      setViewerReadyVersion((current) => current + 1)
    },
    [],
  )

  const mappedCities = useMemo<MappedCity[]>(
    () =>
      cities.filter(
        (city): city is MappedCity =>
          typeof city.lat === 'number' && typeof city.lng === 'number',
      ),
    [],
  )

  const journeyVisitCounts = useMemo(
    () =>
      journeyDays.reduce(
        (counts, day) => {
          counts[day.cityId] = (counts[day.cityId] ?? 0) + 1
          return counts
        },
        {} as Record<CityId, number>,
      ),
    [],
  )

  const mappedRoutes = useMemo(
    () => {
      const orderedCountryRoutes = countries.flatMap((country) =>
        country.cityIds.slice(1).flatMap((toCityId, index) => {
          const fromCityId = country.cityIds[index]
          const from = cityById[fromCityId]
          const to = cityById[toCityId]

          if (!from || !to) return []

          const existingRoute = routes.find(
            (route) =>
              route.fromCityId === fromCityId &&
              route.toCityId === toCityId,
          )
          const fromJourneyIds = new Set(
            from.records?.map((record) => record.journeyId).filter(Boolean),
          )
          const sharedJourneyId = to.records
            ?.map((record) => record.journeyId)
            .find((journeyId) => journeyId && fromJourneyIds.has(journeyId))

          return [{
            id: existingRoute?.id ?? `country-order__${country.id}__${fromCityId}__${toCityId}`,
            fromCityId,
            toCityId,
            journeyId: existingRoute?.journeyId ?? sharedJourneyId,
            type: existingRoute?.type ?? 'main' as const,
          }]
        }),
      )
      const crossCountryRoutes = routes.filter((route) => {
        const from = cityById[route.fromCityId]
        const to = cityById[route.toCityId]
        return from?.countryId && to?.countryId && from.countryId !== to.countryId
      })

      return [...orderedCountryRoutes, ...crossCountryRoutes].flatMap((route) => {
        const from = cityById[route.fromCityId]
        const to = cityById[route.toCityId]

        if (
          !route.journeyId ||
          !from ||
          !to ||
          typeof from.lat !== 'number' ||
          typeof from.lng !== 'number' ||
          typeof to.lat !== 'number' ||
          typeof to.lng !== 'number'
        ) {
          return []
        }

        return [{
          ...route,
          fromLat: from.lat,
          fromLng: from.lng,
          toLat: to.lat,
          toLng: to.lng,
          fromCountryId: from.countryId,
          toCountryId: to.countryId,
          positions: createRoutePositions(
            from.lng,
            from.lat,
            to.lng,
            to.lat,
            route.type,
          ),
        }]
      })
    },
    [],
  )
  const activeCityRouteIds = useMemo(
    () =>
      new Set(
        mappedRoutes
          .filter(
            (route) =>
              selectedCityId &&
              route.fromCountryId === selectedCountryId &&
              route.toCountryId === selectedCountryId &&
              (route.fromCityId === selectedCityId ||
                route.toCityId === selectedCityId),
          )
          .map((route) => route.id),
      ),
    [mappedRoutes, selectedCityId, selectedCountryId],
  )
  const activeRoutePairs = mappedRoutes
    .filter((route) => activeCityRouteIds.has(route.id))
    .map((route) => `${route.fromCityId}->${route.toCityId}`)
    .join('|')
  const activeDroneMediaItems = useMemo(
    () =>
      activeDroneMediaCityId
        ? droneMediaItems.filter((item) => item.cityId === activeDroneMediaCityId)
        : [],
    [activeDroneMediaCityId],
  )
  const selectedDroneMediaItem = activeDroneMediaItemId
    ? droneMediaById[activeDroneMediaItemId]
    : undefined
  const cameraFocus = useMemo<CameraFocus>(() => {
    if (selectedDroneMediaItem) {
      return { type: 'droneItem', id: selectedDroneMediaItem.id, item: selectedDroneMediaItem }
    }

    if (activeDroneMediaItems.length > 0) {
      return { type: 'droneGroup', id: activeDroneMediaCityId, items: activeDroneMediaItems }
    }

    if (
      selectionMode === 'city' &&
      selectedCity &&
      typeof selectedCity.lat === 'number' &&
      typeof selectedCity.lng === 'number'
    ) {
      return { type: 'city', id: selectedCity.id, lat: selectedCity.lat, lng: selectedCity.lng }
    }

    if (
      selectionMode === 'country' &&
      selectedCountry &&
      typeof selectedCountry.centerLat === 'number' &&
      typeof selectedCountry.centerLng === 'number'
    ) {
      return {
        type: 'country',
        id: selectedCountry.id,
        lat: selectedCountry.centerLat,
        lng: selectedCountry.centerLng,
      }
    }

    return { type: 'overview', id: 'overview', lat: overviewTarget.lat, lng: overviewTarget.lng }
  }, [
    activeDroneMediaItems,
    activeDroneMediaCityId,
    selectedCity,
    selectedCountry,
    selectedDroneMediaItem,
    selectionMode,
  ])
  const cameraScale = useMemo<CameraScale>(() => {
    if (cameraFocus.type === 'droneItem') return 'drone'
    if (cameraFocus.type === 'droneGroup') return 'droneGroup'
    return cameraScaleForGlobeScale(globeScale)
  }, [cameraFocus.type, globeScale])
  const cameraFocusKey = useMemo(() => {
    if (cameraFocus.type === 'droneItem') return `drone-item:${cameraFocus.item.id}:${cameraScale}`
    if (cameraFocus.type === 'droneGroup') {
      return `drone-group:${activeDroneMediaCityId}:${cameraFocus.items.map((item) => item.id).join('|')}:${cameraScale}`
    }
    if (cameraFocus.type === 'city') {
      return `city:${selectedCityId}:${cameraScale}`
    }
    if (cameraFocus.type === 'country') {
      return `country:${selectedCountryId}:${cameraScale}`
    }
    return `overview:${cameraScale}:${resetVersion}`
  }, [activeDroneMediaCityId, cameraFocus, cameraScale, resetVersion, selectedCityId, selectedCountryId])
  const cameraRuntimeRef = useRef({
    activeDroneMediaCityId,
    activeDroneMediaItemId,
    cameraFocus,
    cameraScale,
    globeScale,
    selectedCityId,
    selectedCountryId,
  })

  useEffect(() => {
    cameraRuntimeRef.current = {
      activeDroneMediaCityId,
      activeDroneMediaItemId,
      cameraFocus,
      cameraScale,
      globeScale,
      selectedCityId,
      selectedCountryId,
    }
  }, [
    activeDroneMediaCityId,
    activeDroneMediaItemId,
    cameraFocus,
    cameraScale,
    globeScale,
    selectedCityId,
    selectedCountryId,
  ])

  useEffect(() => {
    debugCesiumGlobeScaleProp({
      globeScale,
      selectedCountryId,
      selectedCityId,
      activeDroneMediaCityId,
      activeDroneMediaItemId,
    })
  }, [
    activeDroneMediaCityId,
    activeDroneMediaItemId,
    globeScale,
    selectedCityId,
    selectedCountryId,
  ])

  const activateDebugDroneCameraLock = useCallback(() => {
    debugDroneCameraLockUntilRef.current = Date.now() + 3_000
  }, [])

  const executeCameraCommand = useCallback<ExecuteCameraCommand>((request) => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return false

    const {
      activeDroneMediaCityId,
      activeDroneMediaItemId,
      cameraFocus,
      cameraScale,
      globeScale,
      selectedCityId,
      selectedCountryId,
    } = cameraRuntimeRef.current
    const now = Date.now()
    const debugLockActive = now < debugDroneCameraLockUntilRef.current
    const droneCameraLockActive = Boolean(
      activeDroneMediaItemId ||
      activeDroneMediaCityId ||
      debugLockActive,
    )

    if (
      droneCameraLockActive &&
      !droneLockAllowedCameraSources.has(request.source)
    ) {
      debugCameraBlockedByDroneLock({
        source: request.source,
        reason: request.reason,
        lock: {
          activeDroneMediaCityId,
          activeDroneMediaItemId,
          debugLockActive,
          debugLockRemainingMs: debugLockActive
            ? Math.max(0, debugDroneCameraLockUntilRef.current - now)
            : 0,
        },
        currentFocus: {
          type: cameraFocus.type,
          id: cameraFocus.id,
          scale: cameraScale,
          globeScale,
          selectedCityId,
          selectedCountryId,
        },
        blockedCommand: request.details,
      })
      return false
    }

    const cameraCommandNumber = cameraCommandCountRef.current + 1
    cameraCommandCountRef.current = cameraCommandNumber
    debugCameraCommand(cameraCommandNumber, {
      source: request.source,
      reason: request.reason,
      droneCameraLockActive,
      lock: {
        activeDroneMediaCityId,
        activeDroneMediaItemId,
        debugLockActive,
        debugLockRemainingMs: debugLockActive
          ? Math.max(0, debugDroneCameraLockUntilRef.current - now)
          : 0,
      },
      ...request.details,
    })
    viewer.camera.cancelFlight()
    request.run(viewer)
    return true
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return

    configureViewer(viewer)
  }, [viewerReadyVersion])

  useEffect(() => {
    if (cameraScale !== 'world') return undefined

    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return undefined

    const lockedPosition = new Cartesian3()
    const positionDirection = new Cartesian3()
    const lockedDirection = new Cartesian3()
    const lockedUp = new Cartesian3()
    const upProjection = new Cartesian3()

    const normalizeLockedUp = () => {
      const upDotDirection = Cartesian3.dot(viewer.camera.upWC, lockedDirection)
      Cartesian3.multiplyByScalar(lockedDirection, upDotDirection, upProjection)
      Cartesian3.subtract(viewer.camera.upWC, upProjection, lockedUp)

      if (Cartesian3.magnitudeSquared(lockedUp) < 1e-8) {
        const zDotDirection = Cartesian3.dot(Cartesian3.UNIT_Z, lockedDirection)
        Cartesian3.multiplyByScalar(lockedDirection, zDotDirection, upProjection)
        Cartesian3.subtract(Cartesian3.UNIT_Z, upProjection, lockedUp)
      }

      if (Cartesian3.magnitudeSquared(lockedUp) < 1e-8) {
        Cartesian3.clone(Cartesian3.UNIT_Y, lockedUp)
      }

      Cartesian3.normalize(lockedUp, lockedUp)
    }

    const lockWorldCenter = () => {
      if (viewer.isDestroyed()) return

      Cartesian3.clone(viewer.camera.positionWC, lockedPosition)
      Cartesian3.normalize(viewer.camera.positionWC, positionDirection)
      Cartesian3.negate(positionDirection, lockedDirection)
      const directionDrift = 1 - Cartesian3.dot(
        viewer.camera.directionWC,
        lockedDirection,
      )

      if (directionDrift < 1e-12) return

      normalizeLockedUp()

      viewer.camera.setView({
        destination: lockedPosition,
        orientation: {
          direction: lockedDirection,
          up: lockedUp,
        },
      })
    }

    viewer.scene.preRender.addEventListener(lockWorldCenter)

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.scene.preRender.removeEventListener(lockWorldCenter)
      }
    }
  }, [cameraScale, viewerReadyVersion])

  useEffect(() => {
    if (import.meta.env.PROD) return undefined

    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return undefined

    const debugCamera = installDebugCameraApi(
      viewer,
      executeCameraCommand,
      activateDebugDroneCameraLock,
    )

    return () => {
      if (debugCamera && window.__travelAtlasDebugCamera === debugCamera) {
        delete window.__travelAtlasDebugCamera
      }
    }
  }, [activateDebugDroneCameraLock, executeCameraCommand, viewerReadyVersion])

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return

    const updateVisibleHemisphere = () => {
      const cameraPosition = viewer.camera.positionWC
      const nextCityIds = new Set(
        mappedCities
          .filter((city) =>
            isPositionFacingCamera(
              cityPosition(city.lng, city.lat),
              cameraPosition,
            ),
          )
          .map((city) => city.id),
      )
      const nextRouteIds = new Set(
        mappedRoutes
          .filter((route) =>
            route.positions.some((position) =>
              isPositionFacingCamera(position, cameraPosition),
            ),
          )
          .map((route) => route.id),
      )

      setVisibleCityIds((current) => setsMatch(current, nextCityIds) ? current : nextCityIds)
      setVisibleRouteIds((current) => setsMatch(current, nextRouteIds) ? current : nextRouteIds)
    }

    updateVisibleHemisphereRef.current = updateVisibleHemisphere
    updateVisibleHemisphere()
    const updateAfterFirstRender = () => {
      updateVisibleHemisphere()
      viewer.scene.postRender.removeEventListener(updateAfterFirstRender)
    }
    viewer.scene.postRender.addEventListener(updateAfterFirstRender)
    viewer.camera.changed.addEventListener(updateVisibleHemisphere)
    viewer.camera.moveEnd.addEventListener(updateVisibleHemisphere)

    return () => {
      viewer.scene.postRender.removeEventListener(updateAfterFirstRender)
      viewer.camera.changed.removeEventListener(updateVisibleHemisphere)
      viewer.camera.moveEnd.removeEventListener(updateVisibleHemisphere)
      updateVisibleHemisphereRef.current = () => undefined
    }
  }, [mappedCities, mappedRoutes, viewerReadyVersion])

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    if (lastCameraFocusKeyRef.current === cameraFocusKey) return

    const {
      activeDroneMediaCityId,
      activeDroneMediaItemId,
      cameraFocus,
      cameraScale,
      globeScale,
      selectedCityId,
      selectedCountryId,
    } = cameraRuntimeRef.current

    debugCameraState({
      userAction: cameraFocus.type,
      focusTargetType: cameraFocus.type,
      focusTargetId: cameraFocus.id,
      cameraScale,
      globeScale,
      activeDroneMediaItemId,
      activeDroneMediaCityId,
      selectedCityId,
      selectedCountryId,
    })

    if (cameraFocus.type === 'droneItem') {
      const cameraState = cameraScaleStates.drone
      const targetPosition = droneMediaPosition(cameraFocus.item)
      debugCameraFocus('drone-item', {
        itemId: cameraFocus.item.id,
        cityId: activeDroneMediaCityId,
        selectedCityId,
        selectedCountryId,
        lat: cameraFocus.item.position.lat,
        lng: cameraFocus.item.position.lng,
        altitudeMeters: cameraFocus.item.position.altitudeMeters,
      })
      const commandAllowed = executeCameraCommand({
        source: 'drone-item',
        reason: 'cameraIntentKey changed',
        details: {
          scale: cameraScale,
          globeScale,
          focusType: cameraFocus.type,
          selectedCityId,
          selectedCountryId,
          activeDroneMediaCityId,
          activeDroneMediaItemId,
          target: {
            itemId: cameraFocus.item.id,
            lat: cameraFocus.item.position.lat,
            lng: cameraFocus.item.position.lng,
            altitudeMeters: cameraFocus.item.position.altitudeMeters,
          },
          destination: 'bounding-sphere',
          rangeOrHeight: cameraState.rangeOrHeight,
        },
        run: (currentViewer) => {
          currentViewer.camera.flyToBoundingSphere(
            new BoundingSphere(targetPosition, 350),
            {
              duration: cameraState.duration,
              offset: new HeadingPitchRange(
                0,
                CesiumMath.toRadians(cameraState.pitch),
                cameraState.rangeOrHeight,
              ),
              complete: updateVisibleHemisphereRef.current,
            },
          )
        },
      })
      if (commandAllowed) lastCameraFocusKeyRef.current = cameraFocusKey
      return
    }

    if (cameraFocus.type === 'droneGroup') {
      const cameraState = cameraScaleStates.droneGroup
      const dronePositions = cameraFocus.items.map(droneMediaPosition)
      const boundingSphere = BoundingSphere.fromPoints(dronePositions)
      const groupRange = Math.min(
        28_000,
        Math.max(12_000, boundingSphere.radius * 7, cameraState.rangeOrHeight),
      )
      debugCameraFocus('drone-group', {
        cityId: activeDroneMediaCityId,
        itemIds: cameraFocus.items.map((item) => item.id),
        selectedCityId,
        selectedCountryId,
        radius: Math.round(boundingSphere.radius),
      })
      const commandAllowed = executeCameraCommand({
        source: 'drone-group',
        reason: 'cameraIntentKey changed',
        details: {
          scale: cameraScale,
          globeScale,
          focusType: cameraFocus.type,
          selectedCityId,
          selectedCountryId,
          activeDroneMediaCityId,
          activeDroneMediaItemId,
          target: {
            itemIds: cameraFocus.items.map((item) => item.id),
            radius: Math.round(boundingSphere.radius),
          },
          destination: 'bounding-sphere',
          rangeOrHeight: groupRange,
        },
        run: (currentViewer) => {
          currentViewer.camera.flyToBoundingSphere(
            boundingSphere,
            {
              duration: cameraState.duration,
              offset: new HeadingPitchRange(
                0,
                CesiumMath.toRadians(cameraState.pitch),
                groupRange,
              ),
              complete: updateVisibleHemisphereRef.current,
            },
          )
        },
      })
      if (commandAllowed) lastCameraFocusKeyRef.current = cameraFocusKey
      return
    }

    const cameraState = cameraScaleStates[cameraScale]
    const targetPosition = Cartesian3.fromDegrees(cameraFocus.lng, cameraFocus.lat, 600)
    debugCameraFocus(cameraFocus.type, {
      activeDroneMediaCityId,
      activeDroneMediaItemId,
      selectedCityId,
      selectedCountryId,
      lat: cameraFocus.lat,
      lng: cameraFocus.lng,
      globeScale,
    })
    const updateFocusOffset = () => {
      const screenPosition = SceneTransforms.worldToWindowCoordinates(
        viewer.scene,
        targetPosition,
      )

      if (!screenPosition) return

      setFocusOffset({
        x: Math.round(screenPosition.x - viewer.canvas.clientWidth / 2),
        y: Math.round(screenPosition.y - viewer.canvas.clientHeight / 2),
      })
      updateVisibleHemisphereRef.current()
    }

    if (cameraScale === 'world') {
      const destination = Cartesian3.fromDegrees(
        cameraFocus.lng,
        cameraFocus.lat,
        cameraState.rangeOrHeight,
      )
      const direction = Cartesian3.normalize(
        Cartesian3.negate(destination, new Cartesian3()),
        new Cartesian3(),
      )
      const right = Cartesian3.normalize(
        Cartesian3.cross(direction, Cartesian3.UNIT_Z, new Cartesian3()),
        new Cartesian3(),
      )
      const up = Cartesian3.normalize(
        Cartesian3.cross(right, direction, new Cartesian3()),
        new Cartesian3(),
      )

      const commandAllowed = executeCameraCommand({
        source: cameraFocus.type,
        reason: 'cameraIntentKey changed',
        details: {
          scale: cameraScale,
          globeScale,
          focusType: cameraFocus.type,
          selectedCityId,
          selectedCountryId,
          activeDroneMediaCityId,
          activeDroneMediaItemId,
          target: {
            lat: cameraFocus.lat,
            lng: cameraFocus.lng,
          },
          destination: 'cartesian-height',
          rangeOrHeight: cameraState.rangeOrHeight,
        },
        run: (currentViewer) => {
          currentViewer.camera.flyTo({
            destination,
            duration: cameraState.duration,
            orientation: {
              direction,
              up,
            },
            complete: updateFocusOffset,
          })
        },
      })
      if (commandAllowed) lastCameraFocusKeyRef.current = cameraFocusKey
      return
    }

    const commandAllowed = executeCameraCommand({
      source: cameraFocus.type,
      reason: 'cameraIntentKey changed',
      details: {
        scale: cameraScale,
        globeScale,
        focusType: cameraFocus.type,
        selectedCityId,
        selectedCountryId,
        activeDroneMediaCityId,
        activeDroneMediaItemId,
        target: {
          lat: cameraFocus.lat,
          lng: cameraFocus.lng,
        },
        destination: 'bounding-sphere',
        rangeOrHeight: cameraState.rangeOrHeight,
      },
      run: (currentViewer) => {
        currentViewer.camera.flyToBoundingSphere(
          new BoundingSphere(
            targetPosition,
            cameraScale === 'country' ? 150_000 : 15_000,
          ),
          {
            duration: cameraState.duration,
            offset: new HeadingPitchRange(
              0,
              CesiumMath.toRadians(cameraState.pitch),
              cameraState.rangeOrHeight,
            ),
            complete: updateFocusOffset,
          },
        )
      },
    })
    if (commandAllowed) lastCameraFocusKeyRef.current = cameraFocusKey
  }, [
    cameraFocusKey,
    executeCameraCommand,
    viewerReadyVersion,
  ])

  return (
    <div
      ref={globeShellRef}
      className={`cesium-atlas-shell absolute inset-0 h-full w-full ${isNight ? 'bg-[#020817]' : 'bg-sky-100'}`}
      data-focus-offset-x={focusOffset.x}
      data-focus-offset-y={focusOffset.y}
      data-visible-city-count={visibleCityIds?.size ?? mappedCities.length}
      data-visible-route-count={visibleRouteIds?.size ?? mappedRoutes.length}
      data-active-route-pairs={activeRoutePairs}
    >
      <Viewer
        ref={captureViewer}
        full
        animation={false}
        baseLayer={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        navigationHelpButton={false}
        scene3DOnly
        sceneModePicker={false}
        selectionIndicator={false}
        timeline={false}
        useBrowserRecommendedResolution={false}
      >
        <ImageryLayer
          imageryProvider={atlasImageryProvider}
          brightness={imageryBrightness}
          contrast={imageryContrast}
          saturation={imagerySaturation}
          show={showMapContent}
        />
        <Scene backgroundColor={Color.fromCssColorString(isNight ? '#010409' : '#dbeafe')} />
        <CesiumGlobe
          baseColor={Color.fromCssColorString(isNight ? '#07111f' : '#cbd5e1')}
          dynamicAtmosphereLighting={isNight}
          enableLighting={isNight}
          show={showMapContent}
          vertexShadowDarkness={isNight ? 0.48 : 0.3}
        />
        <CesiumSkyBox show={!isNight} />
        <SkyAtmosphere show={showMapContent} />
        <CesiumSun show={!isNight} />
        <ScreenSpaceCameraController
          enableInputs={showMapContent}
          enableLook={cameraScale !== 'world'}
          enableRotate
          enableTilt
          enableTranslate={cameraScale !== 'world'}
          enableZoom
          inertiaZoom={0.72}
        />
        <CesiumConstellationSky
          occludeMoonWithEarth={showMapContent}
          overviewHeight={cameraScaleStates.world.rangeOrHeight}
          overviewLat={overviewTarget.lat}
          overviewLng={overviewTarget.lng}
          show={isNight}
        />

        {mappedRoutes.map((route) => {
          const isCityRoute = activeCityRouteIds.has(route.id)
          const isCountryRoute =
            selectedCountryId &&
            (route.fromCountryId === selectedCountryId || route.toCountryId === selectedCountryId)
          const isActive = selectedCityId ? isCityRoute : Boolean(isCountryRoute)
          const isMuted = selectionMode !== 'overview' && !isActive
          const isVisible =
            cameraFocus.type !== 'droneGroup' &&
            cameraFocus.type !== 'droneItem' &&
            (visibleRouteIds?.has(route.id) ?? true) &&
            (selectionMode !== 'city' || isCityRoute)
          const routeColor = Color.fromCssColorString(
            isActive ? selectedAccent : '#bae6fd',
          ).withAlpha(
            isActive ? 0.94 : isMuted ? 0.1 : 0.42,
          )
          const routeOutlineColor = Color.fromCssColorString(
            isActive ? '#f8fafc' : '#38bdf8',
          ).withAlpha(
            isActive ? 0.58 : isMuted ? 0.04 : 0.22,
          )

          return (
            <Entity
              key={route.id}
              name={`${route.journeyId}: ${route.fromCityId} to ${route.toCityId}`}
              show={showMapContent && isVisible}
              polyline={{
                arcType: ArcType.NONE,
                clampToGround: false,
                material: new PolylineOutlineMaterialProperty({
                  color: routeColor,
                  outlineColor: routeOutlineColor,
                  outlineWidth: isActive ? 1.2 : 0.8,
                }),
                positions: route.positions,
                width: isActive ? 4 : isMuted ? 1 : 2,
              }}
            />
          )
        })}

        {mappedCities.map((city) => {
          const isSelected = city.id === selectedCityId
          const isHoveredCountryCity =
            hoveredCountryId !== undefined && city.countryId === hoveredCountryId
          const isCountryCity =
            selectedCountryId !== undefined && city.countryId === selectedCountryId
          const country = city.countryId ? countryById[city.countryId] : undefined
          const accent = country?.accent ?? '#38bdf8'
          const visitCount = journeyVisitCounts[city.id] ?? 1
          const isMuted =
            selectionMode !== 'overview' && !isSelected && !isCountryCity
          const corePixelSize = isCountryCity ? 12 : 7
          const showHoverGlow = isHoveredCountryCity && !isSelected

          return (
            <Entity
              key={city.id}
              name={`${city.nameEn ?? city.nameZh ?? city.id} · ${visitCount} visit records`}
              show={showMapContent && (visibleCityIds?.has(city.id) ?? true)}
              position={cityPosition(city.lng, city.lat)}
              onClick={() => onSelectCity(city.id)}
              billboard={showHoverGlow ? {
                color: Color.WHITE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                height: 38,
                image: cityHoverMarkerImage(accent, corePixelSize),
                width: 38,
              } : undefined}
              point={showHoverGlow ? undefined : {
                color: Color.fromCssColorString(accent).withAlpha(isMuted ? 0.28 : 1),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                outlineColor: Color.WHITE.withAlpha(isMuted ? 0.36 : 0.94),
                outlineWidth: isSelected ? 3 : 2,
                pixelSize: isSelected ? 18 : corePixelSize,
              }}
              label={{
                backgroundColor: Color.fromCssColorString(
                  isSelected ? accent : '#0f172a',
                ).withAlpha(isSelected ? 0.9 : 0.72),
                fillColor: Color.WHITE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                font: isSelected ? '700 15px Inter, sans-serif' : '600 13px Inter, sans-serif',
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                pixelOffset: new Cartesian2(0, -28),
                show: isSelected || isCountryCity,
                showBackground: true,
                style: LabelStyle.FILL_AND_OUTLINE,
                text: city.nameEn ?? city.nameZh ?? city.id,
              }}
              ellipse={isSelected ? {
                height: 300,
                material: Color.fromCssColorString(accent).withAlpha(0.14),
                outline: true,
                outlineColor: Color.fromCssColorString(accent).withAlpha(0.88),
                semiMajorAxis: 42_000,
                semiMinorAxis: 42_000,
              } : undefined}
            />
          )
        })}

        {activeDroneMediaItems.map((item, index) => {
          const isSelected = item.id === activeDroneMediaItemId
          const itemNumber = String(index + 1).padStart(2, '0')

          return (
            <Entity
              key={item.id}
              name={`${item.titleEn} ${item.fileName}`}
              show={showMapContent}
              position={droneMediaPosition(item)}
              onClick={() => onSelectDroneMediaItem(item)}
              billboard={{
                color: Color.WHITE.withAlpha(isSelected ? 1 : 0.78),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                height: isSelected ? 42 : 32,
                image: dronePinImage,
                scale: isSelected ? 1.08 : 0.92,
                width: isSelected ? 42 : 32,
              }}
              label={{
                backgroundColor: Color.fromCssColorString(
                  isSelected ? '#0ea5e9' : '#020617',
                ).withAlpha(isSelected ? 0.92 : 0.74),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                fillColor: Color.WHITE,
                font: isSelected ? '700 13px Inter, sans-serif' : '600 12px Inter, sans-serif',
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                pixelOffset: new Cartesian2(0, -34),
                show: true,
                showBackground: true,
                style: LabelStyle.FILL_AND_OUTLINE,
                text: `Drone ${itemNumber}`,
              }}
              point={{
                color: Color.fromCssColorString(isSelected ? '#7dd3fc' : '#e0f2fe').withAlpha(0.9),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                outlineColor: Color.WHITE.withAlpha(0.95),
                outlineWidth: 2,
                pixelSize: isSelected ? 13 : 9,
              }}
            />
          )
        })}
      </Viewer>
      <div
        ref={cursorGlowRef}
        aria-hidden="true"
        className="atlas-cursor-glow"
        data-active="false"
      />
      <canvas
        ref={cursorTrailRef}
        aria-hidden="true"
        className="atlas-cursor-trail"
      />

      <div className="cesium-map-status pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/14 bg-slate-950/62 px-4 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-2xl">
        {mappedCities.length} mapped cities · {mappedRoutes.length} journey route segments
      </div>
    </div>
  )
}
