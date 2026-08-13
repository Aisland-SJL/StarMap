import { useEffect, useRef } from 'react'
import {
  BlendOption,
  Cartesian3,
  Color,
  Ellipsoid,
  EllipsoidGeometry,
  GeometryInstance,
  Material,
  MaterialAppearance,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  PointPrimitiveCollection,
  PolylineCollection,
  Primitive,
  buildModuleUrl,
} from 'cesium'
import { useCesium } from 'resium'

type StarDefinition = {
  longitude: number
  latitude: number
  pixelSize: number
  opacity: number
  tone?: 'cyan' | 'violet'
}

type ConstellationDefinition = {
  name: string
  longitude: number
  latitude: number
  rotation: number
  scale: number
  tone: 'cyan' | 'violet'
  points: ReadonlyArray<readonly [number, number]>
  edges: ReadonlyArray<readonly [number, number]>
  brightStars: ReadonlyArray<number>
}

const celestialHeight = 80_000_000
const idleRotationRadiansPerSecond = CesiumMath.toRadians(0.32)
const moonDistanceFromCamera = 70_000_000
const moonRadius = 1_737_400
const earthOcclusionPadding = 48_000
const moonVerticalOffset = 0.18
const galaxyLatitudeShift = -7
const auroraDistanceFromCamera = 77_000_000
const auroraDriftRadiansPerSecond = 0.42
const auroraBankCount = 6
const meteorDistanceFromCamera = 9_000_000
const meteorTrailSegmentCount = 9

// Simplified bright-star topology based on the IAU / Sky & Telescope
// constellation-figure convention. Each zodiac constellation deliberately
// keeps a distinct silhouette while sharing the same restrained visual system.
const constellationDefinitions: ConstellationDefinition[] = [
  {
    name: 'Aries',
    longitude: -165,
    latitude: 6,
    rotation: -8,
    scale: 0.9,
    tone: 'cyan',
    points: [[-4, 1], [-2.2, 0], [0, 0.4], [2.2, 1.6], [4, 0.8]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
    brightStars: [0, 2],
  },
  {
    name: 'Taurus',
    longitude: -135,
    latitude: 13,
    rotation: 10,
    scale: 0.84,
    tone: 'violet',
    points: [[-5, 3.6], [-2.4, 1.4], [0, -1], [2.4, 1.4], [5, 3.6], [-1.2, 0.2], [1.2, 0.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 3]],
    brightStars: [1, 3],
  },
  {
    name: 'Gemini',
    longitude: -105,
    latitude: 18,
    rotation: -4,
    scale: 0.82,
    tone: 'cyan',
    points: [[-2.8, 4], [2.8, 4], [-2.4, 2], [2.2, 2], [-2, 0], [2, 0], [-3, -2.8], [-0.8, -2.8], [0.8, -2.8], [3.2, -2.8]],
    edges: [[0, 1], [0, 2], [2, 4], [4, 6], [4, 7], [1, 3], [3, 5], [5, 8], [5, 9], [2, 3]],
    brightStars: [0, 1],
  },
  {
    name: 'Cancer',
    longitude: -75,
    latitude: 19,
    rotation: 12,
    scale: 0.9,
    tone: 'violet',
    points: [[0, 0], [-3.8, 2.8], [-1.8, 1.2], [2.2, 2.6], [1.6, -2], [3.8, -3.6]],
    edges: [[0, 2], [2, 1], [0, 3], [0, 4], [4, 5]],
    brightStars: [0, 4],
  },
  {
    name: 'Leo',
    longitude: -45,
    latitude: 13,
    rotation: -10,
    scale: 0.86,
    tone: 'cyan',
    points: [[-4.5, -1.6], [-4, 1], [-2.8, 3], [-1.2, 3.8], [-0.2, 2.2], [-1.4, 0.4], [1.5, -1], [4.5, -2.4], [3.2, 1.3]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 7], [7, 8], [8, 6]],
    brightStars: [0, 7],
  },
  {
    name: 'Virgo',
    longitude: -15,
    latitude: 4,
    rotation: 5,
    scale: 0.86,
    tone: 'violet',
    points: [[-4.8, 2], [-2.4, 1.1], [0, 0], [2.4, 1.8], [4.8, 3], [1.5, -1.8], [2.6, -4], [-1.8, -1.8], [-3.5, -3.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [2, 7], [7, 8]],
    brightStars: [2, 6],
  },
  {
    name: 'Libra',
    longitude: 15,
    latitude: -6,
    rotation: -6,
    scale: 0.94,
    tone: 'cyan',
    points: [[-3.8, 1.8], [0, 3], [3.8, 1.8], [2.5, -2.2], [-2.5, -2.2], [0, -3.8]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [3, 5], [4, 5]],
    brightStars: [0, 2],
  },
  {
    name: 'Scorpio',
    longitude: 45,
    latitude: -15,
    rotation: -18,
    scale: 0.82,
    tone: 'violet',
    points: [[-4.8, 3], [-3.4, 1.8], [-2, 2.7], [-1.2, 0.8], [0, -0.8], [1.6, -2.2], [3.4, -2.8], [4.6, -1.8], [4, -0.2], [2.8, 0.4]],
    edges: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
    brightStars: [3, 6],
  },
  {
    name: 'Sagittarius',
    longitude: 75,
    latitude: -20,
    rotation: 8,
    scale: 0.86,
    tone: 'cyan',
    points: [[-4, 2.2], [-1.8, 3], [0, 1.2], [2.5, 2.8], [4.2, 1], [2.4, -1.8], [-1.6, -2.4], [-4.3, -0.8]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [2, 5], [2, 6]],
    brightStars: [1, 5],
  },
  {
    name: 'Capricorn',
    longitude: 105,
    latitude: -18,
    rotation: -4,
    scale: 0.9,
    tone: 'violet',
    points: [[-5, 1.8], [-2.8, 2.8], [0, 1], [3.2, 2.3], [5, 1], [2.4, -2.6], [-1.8, -3]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [2, 6]],
    brightStars: [0, 4],
  },
  {
    name: 'Aquarius',
    longitude: 135,
    latitude: -10,
    rotation: 8,
    scale: 0.86,
    tone: 'cyan',
    points: [[-4.8, 2.8], [-3, 1.2], [-1.2, 2.2], [0.6, 0.6], [2.4, 1.6], [4.4, 0], [2.8, -1.6], [1.2, -3.2], [3.6, -3.8]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
    brightStars: [1, 5],
  },
  {
    name: 'Pisces',
    longitude: 165,
    latitude: 0,
    rotation: -8,
    scale: 0.72,
    tone: 'violet',
    points: [[-6, 2], [-4.8, 3.5], [-3, 3], [-2.4, 1.2], [-4.2, 0.4], [-1, 0], [1.2, -1], [3.2, -2.8], [5, -2.2], [6, -0.4], [4.8, 1], [3, 0.3]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [3, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 7]],
    brightStars: [1, 7],
  },
]

const rotateOffset = (
  [longitude, latitude]: readonly [number, number],
  rotation: number,
) => {
  const angle = CesiumMath.toRadians(rotation)
  return {
    longitude: longitude * Math.cos(angle) - latitude * Math.sin(angle),
    latitude: longitude * Math.sin(angle) + latitude * Math.cos(angle),
  }
}

const constellationInstances = constellationDefinitions.map((definition) => ({
  definition,
  stars: definition.points.map((offset, starIndex) => {
    const rotatedOffset = rotateOffset(offset, definition.rotation)
    const isBrightStar = definition.brightStars.includes(starIndex)
    return {
      longitude: definition.longitude + rotatedOffset.longitude * definition.scale,
      latitude: definition.latitude + rotatedOffset.latitude * definition.scale,
      opacity: isBrightStar ? 0.98 : 0.74 + (starIndex % 3) * 0.08,
      pixelSize: isBrightStar ? 5.6 : 3.5 + (starIndex % 3) * 0.48,
      tone: isBrightStar || starIndex % 4 === 0 ? definition.tone : undefined,
    }
  }),
}))

const constellationStars = constellationInstances.flatMap(({ stars }) => stars)

const createSeededRandom = (initialSeed: number) => {
  let seed = initialSeed >>> 0
  return () => {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

const random = createSeededRandom(0x7a11a5)
const gaussianSpread = () => (
  random() + random() + random() + random() + random() + random() - 3
)

const starTone = () => {
  const roll = random()
  if (roll < 0.035) return 'violet' as const
  if (roll < 0.12) return 'cyan' as const
  return undefined
}

const ambientAppearance = (layer: 'base' | 'band' | 'cluster') => {
  const brightness = Math.pow(random(), layer === 'base' ? 4 : 2.6)
  const sizeFloor = layer === 'base' ? 1.85 : layer === 'band' ? 2.05 : 2.25
  const opacityFloor = layer === 'base' ? 0.34 : layer === 'band' ? 0.45 : 0.52
  return {
    opacity: opacityFloor + brightness * 0.46,
    pixelSize: sizeFloor + brightness * 2.7,
    tone: starTone(),
  }
}

const voids = [
  { longitude: -48, latitude: 37, longitudeRadius: 30, latitudeRadius: 20 },
  { longitude: 126, latitude: -34, longitudeRadius: 26, latitudeRadius: 18 },
]

const baseStarCount = 1_600
const galaxyBandStarCount = 2_800
const starsPerCluster = 100

const isInsideVoid = (longitude: number, latitude: number) => voids.some((voidArea) => {
  const longitudeDistance = (longitude - voidArea.longitude) / voidArea.longitudeRadius
  const latitudeDistance = (latitude - voidArea.latitude) / voidArea.latitudeRadius
  return longitudeDistance * longitudeDistance + latitudeDistance * latitudeDistance < 1
})

const baseStars: StarDefinition[] = []
while (baseStars.length < baseStarCount) {
  const longitude = random() * 360 - 180
  const latitude = CesiumMath.toDegrees(Math.asin(random() * 1.9 - 0.95))
  if (isInsideVoid(longitude, latitude) && random() < 0.82) continue
  baseStars.push({ longitude, latitude, ...ambientAppearance('base') })
}

const galaxyBandStars: StarDefinition[] = Array.from(
  { length: galaxyBandStarCount },
  (_, index) => {
  const longitude = random() * 360 - 180
  const bandLatitude = 20 * Math.sin(CesiumMath.toRadians(longitude + 22))
  const spread = index < galaxyBandStarCount * 0.76 ? 7.5 : 16
  const latitude = Math.max(-78, Math.min(78, bandLatitude + gaussianSpread() * spread))
  return { longitude, latitude, ...ambientAppearance('band') }
  },
)

const clusterCenters = [
  { longitude: -132, latitude: 34 },
  { longitude: -18, latitude: -24 },
  { longitude: 72, latitude: 27 },
  { longitude: 154, latitude: -8 },
]

const clusterStars: StarDefinition[] = clusterCenters.flatMap((center) => (
  Array.from({ length: starsPerCluster }, () => ({
    longitude: center.longitude + gaussianSpread() * 7,
    latitude: center.latitude + gaussianSpread() * 5,
    ...ambientAppearance('cluster'),
  }))
))

const ambientStars = [...baseStars, ...galaxyBandStars, ...clusterStars]

const stars = [...constellationStars, ...ambientStars]

const createGalaxyGlowPath = (
  latitudeOffset: number,
  phaseOffset: number,
) => Array.from({ length: 181 }, (_, index) => {
  const longitude = -180 + index * 2
  const latitude = latitudeOffset + galaxyLatitudeShift
    + 13 * Math.sin(CesiumMath.toRadians(longitude + phaseOffset))
    + 3.5 * Math.sin(CesiumMath.toRadians(longitude * 2 - 18))

  return Cartesian3.fromDegrees(longitude, latitude, celestialHeight - 1_500_000)
})

const galaxyGlowLayers = [
  {
    color: Color.fromCssColorString('#34d399').withAlpha(0.064),
    latitudeOffset: 2,
    phaseOffset: 28,
    width: 244,
  },
  {
    color: Color.fromCssColorString('#67e8f9').withAlpha(0.052),
    latitudeOffset: 4,
    phaseOffset: 32,
    width: 152,
  },
  {
    color: Color.fromCssColorString('#c4b5fd').withAlpha(0.04),
    latitudeOffset: 6,
    phaseOffset: 36,
    width: 72,
  },
]

const createGalaxyGlowMaterial = (color: Color, layerIndex: number) => new Material({
  fabric: {
    source: `
      uniform vec4 color;
      czm_material czm_getMaterial(czm_materialInput materialInput)
      {
        czm_material material = czm_getDefaultMaterial(materialInput);
        float feather = sin(clamp(materialInput.st.t, 0.0, 1.0) * czm_pi);
        feather = pow(feather, 1.7);
        material.diffuse = color.rgb;
        material.emission = color.rgb * 0.72;
        material.alpha = color.a * feather;
        return material;
      }
    `,
    type: `TravelAtlasGalaxyGlow${layerIndex}`,
    uniforms: { color },
  },
})

const createAuroraGlowMaterial = (color: Color, layerIndex: number) => new Material({
  fabric: {
    source: `
      uniform vec4 color;
      uniform float phase;
      czm_material czm_getMaterial(czm_materialInput materialInput)
      {
        czm_material material = czm_getDefaultMaterial(materialInput);
        float across = sin(clamp(materialInput.st.t, 0.0, 1.0) * czm_pi);
        float edgeFeather = pow(max(across, 0.0), 1.45);
        float along = clamp(materialInput.st.s, 0.0, 1.0);
        float endFeather = smoothstep(0.0, 0.24, along)
          * smoothstep(0.0, 0.24, 1.0 - along);
        float folds = 0.5 + 0.5 * sin(along * 54.0 + phase);
        folds = 0.54 + 0.46 * pow(folds, 3.0);
        float breathing = 0.86 + 0.14 * sin(along * 11.0 - phase * 0.38);
        material.diffuse = color.rgb;
        material.emission = color.rgb * (0.54 + folds * 0.72);
        material.alpha = color.a * edgeFeather * endFeather * folds * breathing;
        return material;
      }
    `,
    type: `TravelAtlasAuroraGlow${layerIndex}`,
    uniforms: { color, phase: 0 },
  },
})

const starPosition = ({ longitude, latitude }: StarDefinition) =>
  Cartesian3.fromDegrees(longitude, latitude, celestialHeight)

const starColor = (star: StarDefinition) => {
  const color = star.tone === 'violet'
    ? '#a5b4fc'
    : star.tone === 'cyan'
      ? '#67e8f9'
      : '#e0f2fe'

  return Color.fromCssColorString(color).withAlpha(star.opacity)
}

type CesiumConstellationSkyProps = {
  occludeMoonWithEarth?: boolean
  overviewHeight: number
  overviewLat: number
  overviewLng: number
  show: boolean
}

export function CesiumConstellationSky({
  occludeMoonWithEarth = true,
  overviewHeight,
  overviewLat,
  overviewLng,
  show,
}: CesiumConstellationSkyProps) {
  const { viewer } = useCesium()
  const occludeMoonWithEarthRef = useRef(occludeMoonWithEarth)

  useEffect(() => {
    occludeMoonWithEarthRef.current = occludeMoonWithEarth
  }, [occludeMoonWithEarth])

  useEffect(() => {
    if (!viewer || !show) return undefined

    const pointCollection = viewer.scene.primitives.add(
      new PointPrimitiveCollection({ blendOption: BlendOption.TRANSLUCENT }),
    )
    const galaxyGlowCollection = viewer.scene.primitives.add(new PolylineCollection())
    const auroraGlowCollection = viewer.scene.primitives.add(new PolylineCollection())
    const lineCollection = viewer.scene.primitives.add(new PolylineCollection())
    const meteorPointCollection = viewer.scene.primitives.add(
      new PointPrimitiveCollection({ blendOption: BlendOption.TRANSLUCENT }),
    )
    const meteorTrailCollection = viewer.scene.primitives.add(new PolylineCollection())

    galaxyGlowLayers.forEach((layer, layerIndex) => {
      galaxyGlowCollection.add({
        material: createGalaxyGlowMaterial(layer.color, layerIndex),
        positions: createGalaxyGlowPath(layer.latitudeOffset, layer.phaseOffset),
        width: layer.width,
      })
    })

    stars.forEach((star) => {
      pointCollection.add({
        color: starColor(star),
        disableDepthTestDistance: 0,
        outlineColor: Color.fromCssColorString('#7dd3fc').withAlpha(star.opacity * 0.18),
        outlineWidth: 1.5,
        pixelSize: star.pixelSize,
        position: starPosition(star),
      })
    })

    constellationInstances.forEach(({ definition, stars: constellation }) => {
      const lineColor = definition.tone === 'violet' ? '#a5b4fc' : '#67e8f9'
      definition.edges.forEach(([startIndex, endIndex]) => {
        lineCollection.add({
          material: Material.fromType('Color', {
            color: Color.fromCssColorString(lineColor).withAlpha(0.28),
          }),
          positions: [
            starPosition(constellation[startIndex]),
            starPosition(constellation[endIndex]),
          ],
          width: 0.95,
        })
      })
    })

    const meteorSlots = Array.from({ length: 2 }, () => {
      const trailMaterials = Array.from(
        { length: meteorTrailSegmentCount },
        (_, segmentIndex) => Material.fromType('Color', {
          color: Color.fromCssColorString(segmentIndex > 5 ? '#f0f9ff' : '#67e8f9').withAlpha(0),
        }),
      )
      return {
        active: false,
        duration: 1.8,
        end: new Cartesian3(),
        headCore: meteorPointCollection.add({
          color: Color.WHITE.withAlpha(0),
          disableDepthTestDistance: 0,
          outlineColor: Color.fromCssColorString('#a5f3fc').withAlpha(0),
          outlineWidth: 1.5,
          pixelSize: 4.6,
          position: Cartesian3.ZERO,
          show: false,
        }),
        headGlow: meteorPointCollection.add({
          color: Color.fromCssColorString('#67e8f9').withAlpha(0),
          disableDepthTestDistance: 0,
          outlineColor: Color.fromCssColorString('#e0f2fe').withAlpha(0),
          outlineWidth: 2,
          pixelSize: 11,
          position: Cartesian3.ZERO,
          show: false,
        }),
        startedAt: 0,
        start: new Cartesian3(),
        tailLength: 0.12,
        trailMaterials,
        trailSegments: trailMaterials.map((material, segmentIndex) => (
          meteorTrailCollection.add({
            material,
            positions: [new Cartesian3(), new Cartesian3()],
            show: false,
            width: 0.7 + ((segmentIndex + 1) / meteorTrailSegmentCount) * 2.1,
          })
        )),
      }
    })

    const rotation = new Matrix3()
    const modelMatrix = new Matrix4()
    const moonModelMatrix = new Matrix4()
    const earthCenterEC = new Cartesian3()
    const earthDirectionEC = new Cartesian3(0, 0, -1)
    let moonBaseModelMatrix: Matrix4 | undefined
    let moonMaterial: Material | undefined
    let moonPrimitive: Primitive | undefined
    const auroraMaterials: Material[] = []
    const startTime = performance.now()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let meteorSeed = 0x1c0ffee
    const meteorRandom = () => {
      meteorSeed = (meteorSeed * 1_664_525 + 1_013_904_223) >>> 0
      return meteorSeed / 4_294_967_296
    }
    const meteorTracks = [
      { down: 0.82, right: 0.3, startRight: -0.56, startUp: 0.75 },
      { down: 1.0, right: 0.36, startRight: -0.32, startUp: 0.82 },
      { down: 0.84, right: 0.3, startRight: -0.05, startUp: 0.7 },
      { down: 0.95, right: 0.28, startRight: 0.18, startUp: 0.78 },
      { down: 0.78, right: 0.24, startRight: 0.38, startUp: 0.62 },
    ]
    let previousMeteorTrack = -1
    let nextMeteorAt = reduceMotion ? Number.POSITIVE_INFINITY : 1.8 + meteorRandom() * 1.6

    const cameraRelativeDirection = (rightOffset: number, upOffset: number) => (
      Cartesian3.normalize(
        Cartesian3.add(
          viewer.camera.directionWC,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(viewer.camera.rightWC, rightOffset, new Cartesian3()),
            Cartesian3.multiplyByScalar(viewer.camera.upWC, upOffset, new Cartesian3()),
            new Cartesian3(),
          ),
          new Cartesian3(),
        ),
        new Cartesian3(),
      )
    )

    const placeCelestialBodies = () => {
      if (viewer.isDestroyed()) return

      const camera = viewer.camera
      const overviewCameraPosition = Cartesian3.fromDegrees(
        overviewLng,
        overviewLat,
        overviewHeight,
      )
      const overviewDirection = Cartesian3.normalize(
        Cartesian3.negate(overviewCameraPosition, new Cartesian3()),
        new Cartesian3(),
      )
      const overviewRight = Cartesian3.normalize(
        Cartesian3.cross(overviewDirection, Cartesian3.UNIT_Z, new Cartesian3()),
        new Cartesian3(),
      )
      const overviewUp = Cartesian3.normalize(
        Cartesian3.cross(overviewRight, overviewDirection, new Cartesian3()),
        new Cartesian3(),
      )
      const moonDirection = Cartesian3.normalize(
        Cartesian3.add(
          overviewDirection,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(overviewRight, 0.28, new Cartesian3()),
            Cartesian3.multiplyByScalar(overviewUp, moonVerticalOffset, new Cartesian3()),
            new Cartesian3(),
          ),
          new Cartesian3(),
        ),
        new Cartesian3(),
      )
      const moonPosition = Cartesian3.add(
        overviewCameraPosition,
        Cartesian3.multiplyByScalar(
          moonDirection,
          moonDistanceFromCamera,
          new Cartesian3(),
        ),
        new Cartesian3(),
      )

      const createAuroraPath = (
        rightStart: number,
        rightEnd: number,
        upBase: number,
        wavePhase: number,
        waveStrength: number,
        tilt: number,
      ) => Array.from({ length: 72 }, (_, index) => {
        const progress = index / 71
        const rightOffset = rightStart + (rightEnd - rightStart) * progress
        const upOffset = upBase
          + (progress - 0.5) * tilt
          + Math.sin(progress * Math.PI * 2.2 + wavePhase) * waveStrength
          + Math.sin(progress * Math.PI * 5.4 - wavePhase * 0.7) * waveStrength * 0.28
        const direction = cameraRelativeDirection(rightOffset, upOffset)
        return Cartesian3.add(
          camera.positionWC,
          Cartesian3.multiplyByScalar(
            direction,
            auroraDistanceFromCamera,
            new Cartesian3(),
          ),
          new Cartesian3(),
        )
      })

      const auroraLayerDefinitions = [
        {
          color: Color.fromCssColorString('#34d399').withAlpha(0.055),
          rightEnd: 1.0,
          rightStart: -1.04,
          tilt: 0.12,
          upBase: 0.09,
          wavePhase: 0.08,
          waveStrength: 0.07,
          width: 140,
        },
        {
          color: Color.fromCssColorString('#22d3ee').withAlpha(0.082),
          rightEnd: 1.02,
          rightStart: -0.98,
          tilt: -0.1,
          upBase: 0.155,
          wavePhase: 0.46,
          waveStrength: 0.065,
          width: 44,
        },
        {
          color: Color.fromCssColorString('#34d399').withAlpha(0.068),
          rightEnd: 0.98,
          rightStart: -1.0,
          tilt: 0.08,
          upBase: 0.22,
          wavePhase: 0.84,
          waveStrength: 0.052,
          width: 96,
        },
        {
          color: Color.fromCssColorString('#a78bfa').withAlpha(0.042),
          rightEnd: 0.96,
          rightStart: -1.02,
          tilt: 0.11,
          upBase: 0.325,
          wavePhase: 1.72,
          waveStrength: 0.05,
          width: 72,
        },
        {
          color: Color.fromCssColorString('#5eead4').withAlpha(0.05),
          rightEnd: 1.06,
          rightStart: -0.94,
          tilt: -0.08,
          upBase: 0.365,
          wavePhase: 2.18,
          waveStrength: 0.065,
          width: 50,
        },
      ]

      Array.from({ length: auroraBankCount }, (_, bankIndex) => {
        const bankAngle = bankIndex * CesiumMath.TWO_PI / auroraBankCount
        const bankRotation = Matrix3.fromRotationZ(bankAngle, new Matrix3())
        const bankPhaseOffset = bankIndex * 0.53
        const bankHeightOffset = (bankIndex % 3 - 1) * 0.012
        const bankWaveScale = 0.94 + (bankIndex % 3) * 0.05

        auroraLayerDefinitions.forEach((layer, layerIndex) => {
          const sourcePath = createAuroraPath(
            layer.rightStart,
            layer.rightEnd,
            layer.upBase + bankHeightOffset,
            layer.wavePhase + bankPhaseOffset,
            layer.waveStrength * bankWaveScale,
            layer.tilt * (bankIndex % 2 === 0 ? 1 : -1),
          )
          const materialIndex = bankIndex * auroraLayerDefinitions.length + layerIndex
          const material = createAuroraGlowMaterial(layer.color, materialIndex)
          auroraMaterials.push(material)
          auroraGlowCollection.add({
            material,
            positions: sourcePath.map((position) => (
              Matrix3.multiplyByVector(bankRotation, position, new Cartesian3())
            )),
            width: layer.width,
          })
        })
      })

      moonBaseModelMatrix = Matrix4.fromTranslation(moonPosition, new Matrix4())
      moonMaterial = new Material({
        fabric: {
          source: `
            uniform sampler2D image;
            uniform vec3 earthDirectionEC;
            uniform float earthCosineLimit;
            uniform float lambertDiffuseMultiplier;
            uniform float shadowDarkness;
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
              vec3 fragmentDirectionEC = normalize(-materialInput.positionToEyeEC);
              if (dot(fragmentDirectionEC, earthDirectionEC) > earthCosineLimit) {
                discard;
              }
              czm_material material = czm_getDefaultMaterial(materialInput);
              vec4 surface = texture(image, materialInput.st);
              vec3 surfaceNormalEC = normalize(materialInput.normalEC);
              float diffuseIntensity = clamp(
                czm_getLambertDiffuse(czm_lightDirectionEC, surfaceNormalEC)
                  * lambertDiffuseMultiplier + shadowDarkness,
                0.0,
                1.0
              );
              material.diffuse = surface.rgb * czm_lightColor * diffuseIntensity;
              material.emission = vec3(0.0);
              material.alpha = 1.0;
              return material;
            }
          `,
          type: 'TravelAtlasMoonSurface',
          uniforms: {
            earthCosineLimit: 2,
            earthDirectionEC,
            image: buildModuleUrl('Assets/Textures/moonSmall.jpg'),
            lambertDiffuseMultiplier: 0.9,
            shadowDarkness: 0.48,
          },
        },
      })

      moonPrimitive = viewer.scene.primitives.add(new Primitive({
        appearance: new MaterialAppearance({
          closed: true,
          faceForward: false,
          flat: true,
          material: moonMaterial,
          translucent: false,
        }),
        asynchronous: false,
        modelMatrix: Matrix4.clone(moonBaseModelMatrix),
        geometryInstances: new GeometryInstance({
          geometry: new EllipsoidGeometry({
            radii: new Cartesian3(moonRadius, moonRadius, moonRadius),
            vertexFormat: MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
          }),
        }),
      }))
      viewer.scene.requestRender()
    }

    const celestialPlacementTimer = window.setTimeout(placeCelestialBodies, 360)

    type MeteorSlot = (typeof meteorSlots)[number]

    const hideMeteor = (meteor: MeteorSlot) => {
      meteor.headGlow.show = false
      meteor.headCore.show = false
      meteor.trailSegments.forEach((segment) => {
        segment.show = false
      })
    }

    const beginMeteor = (meteor: MeteorSlot, elapsedSeconds: number) => {
      const trackOffset = 1 + Math.floor(meteorRandom() * (meteorTracks.length - 1))
      const trackIndex = (previousMeteorTrack + trackOffset) % meteorTracks.length
      const track = meteorTracks[trackIndex]
      const startRight = track.startRight + (meteorRandom() - 0.5) * 0.1
      const startUp = track.startUp + (meteorRandom() - 0.5) * 0.12
      const endRight = startRight + track.right + (meteorRandom() - 0.5) * 0.06
      const endUp = startUp - track.down + (meteorRandom() - 0.5) * 0.1
      const pathSpan = Math.hypot(endRight - startRight, endUp - startUp)
      const cameraPosition = viewer.camera.positionWC
      const startDirection = cameraRelativeDirection(startRight, startUp)
      const endDirection = cameraRelativeDirection(endRight, endUp)

      meteor.start = Cartesian3.add(
        cameraPosition,
        Cartesian3.multiplyByScalar(
          startDirection,
          meteorDistanceFromCamera,
          new Cartesian3(),
        ),
        meteor.start,
      )
      meteor.end = Cartesian3.add(
        cameraPosition,
        Cartesian3.multiplyByScalar(
          endDirection,
          meteorDistanceFromCamera,
          new Cartesian3(),
        ),
        meteor.end,
      )
      const visualScale = 0.88 + meteorRandom() * 0.24
      meteor.startedAt = elapsedSeconds
      meteor.duration = Math.min(2.8, Math.max(1.55, pathSpan / (0.43 + meteorRandom() * 0.05)))
      meteor.tailLength = Math.min(0.16, Math.max(0.085, 0.12 / pathSpan))
      meteor.headGlow.pixelSize = 11 * visualScale
      meteor.headCore.pixelSize = 4.6 * visualScale
      meteor.trailSegments.forEach((segment, segmentIndex) => {
        segment.width = (0.7 + ((segmentIndex + 1) / meteorTrailSegmentCount) * 2.1) * visualScale
      })
      meteor.active = true
      previousMeteorTrack = trackIndex
    }

    const smoothstep = (start: number, end: number, value: number) => {
      const progress = Math.min(1, Math.max(0, (value - start) / (end - start)))
      return progress * progress * (3 - 2 * progress)
    }

    const updateMeteor = (elapsedSeconds: number) => {
      if (reduceMotion) return

      if (elapsedSeconds >= nextMeteorAt) {
        const availableMeteor = meteorSlots.find((meteor) => !meteor.active)
        if (availableMeteor) {
          beginMeteor(availableMeteor, elapsedSeconds)
          const isBurstFollowUp = meteorRandom() < 0.46
          nextMeteorAt = elapsedSeconds + (isBurstFollowUp
            ? 0.55 + meteorRandom() * 0.75
            : 1.8 + meteorRandom() * 3.2)
        } else {
          nextMeteorAt = elapsedSeconds + 0.3
        }
      }

      meteorSlots.forEach((meteor) => {
        if (!meteor.active) return

        const progress = (elapsedSeconds - meteor.startedAt) / meteor.duration
        if (progress >= 1) {
          meteor.active = false
          hideMeteor(meteor)
          return
        }

        const fade = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.72, 1, progress))
        const headPosition = Cartesian3.lerp(
          meteor.start,
          meteor.end,
          progress,
          new Cartesian3(),
        )

        meteor.headGlow.position = headPosition
        meteor.headGlow.color = Color.fromCssColorString('#67e8f9').withAlpha(0.16 * fade)
        meteor.headGlow.outlineColor = Color.fromCssColorString('#e0f2fe').withAlpha(0.2 * fade)
        meteor.headGlow.show = true
        meteor.headCore.position = headPosition
        meteor.headCore.color = Color.WHITE.withAlpha(0.98 * fade)
        meteor.headCore.outlineColor = Color.fromCssColorString('#a5f3fc').withAlpha(0.74 * fade)
        meteor.headCore.show = true

        meteor.trailSegments.forEach((segment, segmentIndex) => {
          const segmentStrength = (segmentIndex + 1) / meteorTrailSegmentCount
          const segmentEnd = progress
            - meteor.tailLength * (meteorTrailSegmentCount - 1 - segmentIndex) / meteorTrailSegmentCount
          const segmentStart = progress
            - meteor.tailLength * (meteorTrailSegmentCount - segmentIndex) / meteorTrailSegmentCount

          if (segmentEnd <= 0) {
            segment.show = false
            return
          }

          const startPosition = Cartesian3.lerp(
            meteor.start,
            meteor.end,
            Math.max(0, segmentStart),
            new Cartesian3(),
          )
          const endPosition = Cartesian3.lerp(
            meteor.start,
            meteor.end,
            Math.min(1, segmentEnd),
            new Cartesian3(),
          )
          const trailAlpha = fade * (0.035 + Math.pow(segmentStrength, 2.15) * 0.7)

          segment.positions = [startPosition, endPosition]
          meteor.trailMaterials[segmentIndex].uniforms.color = Color.fromCssColorString(
            segmentIndex > 5 ? '#f0f9ff' : '#67e8f9',
          ).withAlpha(trailAlpha)
          segment.show = true
        })
      })
    }

    const updateRotation = () => {
      const elapsedSeconds = (performance.now() - startTime) / 1000
      const angle = reduceMotion ? 0 : elapsedSeconds * idleRotationRadiansPerSecond
      const cameraDistance = Cartesian3.magnitude(viewer.camera.positionWC)
      const expandedEarthRadius = Ellipsoid.WGS84.maximumRadius + earthOcclusionPadding
      const earthAngularRadius = Math.asin(Math.min(0.999, expandedEarthRadius / cameraDistance))
      const earthCosineLimit = Math.cos(earthAngularRadius)

      Matrix4.multiplyByPoint(
        viewer.camera.viewMatrix,
        Cartesian3.ZERO,
        earthCenterEC,
      )
      Cartesian3.normalize(earthCenterEC, earthDirectionEC)
      if (moonMaterial) {
        moonMaterial.uniforms.earthCosineLimit = occludeMoonWithEarthRef.current
          ? earthCosineLimit
          : 2
      }

      Matrix3.fromRotationZ(angle, rotation)
      Matrix4.fromRotationTranslation(rotation, Cartesian3.ZERO, modelMatrix)
      pointCollection.modelMatrix = Matrix4.clone(modelMatrix, pointCollection.modelMatrix)
      galaxyGlowCollection.modelMatrix = Matrix4.clone(
        modelMatrix,
        galaxyGlowCollection.modelMatrix,
      )
      lineCollection.modelMatrix = Matrix4.clone(modelMatrix, lineCollection.modelMatrix)
      auroraGlowCollection.modelMatrix = Matrix4.clone(
        modelMatrix,
        auroraGlowCollection.modelMatrix,
      )
      const auroraPhase = reduceMotion ? 0 : elapsedSeconds * auroraDriftRadiansPerSecond
      auroraMaterials.forEach((material, materialIndex) => {
        material.uniforms.phase = auroraPhase + materialIndex * 0.82
      })
      if (moonPrimitive && moonBaseModelMatrix) {
        Matrix4.multiply(modelMatrix, moonBaseModelMatrix, moonModelMatrix)
        moonPrimitive.modelMatrix = Matrix4.clone(moonModelMatrix, moonPrimitive.modelMatrix)
      }
      updateMeteor(elapsedSeconds)
    }

    viewer.scene.preRender.addEventListener(updateRotation)
    viewer.scene.requestRender()

    return () => {
      if (viewer.isDestroyed()) return

      window.clearTimeout(celestialPlacementTimer)
      viewer.scene.preRender.removeEventListener(updateRotation)
      if (viewer.scene.primitives.contains(pointCollection)) {
        viewer.scene.primitives.remove(pointCollection)
      }
      if (viewer.scene.primitives.contains(galaxyGlowCollection)) {
        viewer.scene.primitives.remove(galaxyGlowCollection)
      }
      if (viewer.scene.primitives.contains(auroraGlowCollection)) {
        viewer.scene.primitives.remove(auroraGlowCollection)
      }
      if (viewer.scene.primitives.contains(lineCollection)) {
        viewer.scene.primitives.remove(lineCollection)
      }
      if (viewer.scene.primitives.contains(meteorPointCollection)) {
        viewer.scene.primitives.remove(meteorPointCollection)
      }
      if (viewer.scene.primitives.contains(meteorTrailCollection)) {
        viewer.scene.primitives.remove(meteorTrailCollection)
      }
      if (moonPrimitive && viewer.scene.primitives.contains(moonPrimitive)) {
        viewer.scene.primitives.remove(moonPrimitive)
      }
    }
  }, [overviewHeight, overviewLat, overviewLng, show, viewer])

  return null
}
