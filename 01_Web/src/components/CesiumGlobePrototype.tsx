import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Cartesian2,
  Cartesian3,
  Color,
  Ion,
  LabelStyle,
  Math as CesiumMath,
  Viewer as CesiumViewer,
} from 'cesium'
import { Entity, ScreenSpaceCameraController, Viewer } from 'resium'
import type { CesiumComponentRef } from 'resium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN

if (ionToken) {
  Ion.defaultAccessToken = ionToken
}

type PrototypeTarget = {
  id: 'iceland' | 'reykjavik'
  label: string
  eyebrow: string
  lat: number
  lng: number
  height: number
  pitch: number
  summary: string
}

const prototypeTargets: PrototypeTarget[] = [
  {
    id: 'iceland',
    label: 'Iceland',
    eyebrow: 'Country flyTo',
    lat: 64.9631,
    lng: -19.0208,
    height: 4_400_000,
    pitch: -48,
    summary: 'Country-scale camera move for testing broader geographic context.',
  },
  {
    id: 'reykjavik',
    label: 'Reykjavik',
    eyebrow: 'City flyTo',
    lat: 64.1466,
    lng: -21.9426,
    height: 780_000,
    pitch: -42,
    summary: 'City-scale camera move for checking close satellite imagery and mouse-wheel zoom.',
  },
]

const reykjavikMarker = prototypeTargets[1]

export function CesiumGlobePrototype() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null)
  const [activeTargetId, setActiveTargetId] = useState<PrototypeTarget['id']>('iceland')
  const activeTarget = prototypeTargets.find((target) => target.id === activeTargetId) ?? prototypeTargets[0]

  const flyToTarget = useCallback((target: PrototypeTarget) => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return

    setActiveTargetId(target.id)
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(target.lng, target.lat, target.height),
      duration: 1.35,
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(target.pitch),
        roll: 0,
      },
    })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      flyToTarget(prototypeTargets[0])
    }, 450)

    return () => window.clearTimeout(timer)
  }, [flyToTarget])

  return (
    <section className="cesium-prototype-page min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col gap-5">
        <div className="cesium-prototype-header rounded-[30px] border border-white/12 bg-white/10 px-6 py-5 shadow-[0_28px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
            Cesium Lab
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                Cesium Globe Prototype
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Isolated technical route test: real 3D globe, satellite imagery, mouse-wheel zoom,
                and flyTo camera moves for Iceland and Reykjavik.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {prototypeTargets.map((target) => {
                const isActive = target.id === activeTargetId

                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => flyToTarget(target)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-sky-300 bg-sky-300 text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.24)]'
                        : 'border-white/12 bg-white/8 text-slate-200 hover:border-white/24 hover:bg-white/14'
                    }`}
                  >
                    {target.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="relative min-h-[650px] flex-1 overflow-hidden rounded-[34px] border border-white/12 bg-slate-900 shadow-[0_34px_120px_rgba(0,0,0,0.38)]">
          <Viewer
            ref={viewerRef}
            full
            animation={false}
            baseLayerPicker
            fullscreenButton={false}
            geocoder={false}
            homeButton
            infoBox={false}
            navigationHelpButton={false}
            scene3DOnly
            sceneModePicker={false}
            selectionIndicator={false}
            shouldAnimate
            timeline={false}
          >
            <ScreenSpaceCameraController
              enableInputs
              enableLook
              enableRotate
              enableTilt
              enableTranslate
              enableZoom
              inertiaZoom={0.72}
            />
            <Entity
              name="Reykjavik"
              position={Cartesian3.fromDegrees(reykjavikMarker.lng, reykjavikMarker.lat, 420)}
              point={{
                color: Color.fromCssColorString('#38bdf8'),
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                pixelSize: 12,
              }}
              label={{
                fillColor: Color.WHITE,
                font: '600 15px Inter, sans-serif',
                outlineColor: Color.BLACK,
                outlineWidth: 3,
                pixelOffset: new Cartesian2(0, -28),
                style: LabelStyle.FILL_AND_OUTLINE,
                text: 'Reykjavik',
              }}
            />
          </Viewer>

          <div className="pointer-events-none absolute bottom-5 left-5 max-w-sm rounded-[24px] border border-white/12 bg-slate-950/58 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80">
              {activeTarget.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{activeTarget.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{activeTarget.summary}</p>
            <p className="mt-3 text-xs text-slate-400">
              Mouse wheel zoom is enabled by Cesium's camera controller.
            </p>
          </div>

          <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/12 bg-slate-950/50 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-2xl">
            Imagery: Cesium World Imagery / Ion when token is configured
          </div>
        </div>
      </div>
    </section>
  )
}
