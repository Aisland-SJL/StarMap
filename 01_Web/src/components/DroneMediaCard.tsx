import { useMemo, useRef, useState } from 'react'
import { Drone, GripVertical, Maximize2, X } from 'lucide-react'
import { localEditorAvailable, travelAtlasEditorState } from '../data/editorState'
import { allImportedMediaItems } from '../data/mediaCatalog'
import { deleteHiddenLocalMedia, importLocalMedia, reloadAfterLocalSave, updateLocalEditorState, uploadLocalMedia } from '../data/localEditorApi'
import { readDroneFileMetadata } from '../data/droneMetadata'
import { cityById } from '../data/travelAtlas'
import type { DroneMediaItem } from '../data/droneMedia'
import { getDroneMediaForCity } from '../data/droneMedia'
import type { CityId } from '../types/travel'
import { LocalEditorToolbar } from './LocalEditorToolbar'
import { useFlipLayout } from './useFlipLayout'

type DroneMediaCardProps = {
  cityId?: CityId
  activeItemId?: string
  onSelectItem: (item: DroneMediaItem) => void
  onOpenPanorama: (item: DroneMediaItem) => void
}

type DroneFileDraft = {
  id: string
  file: File
  status: 'reading' | 'ready'
  error?: string
  date: string
  lat: string
  lng: string
  altitudeMeters: string
  relativeAltitudeMeters: string
  camera?: string
  width?: number
  height?: number
  fromFile: {
    date: boolean
    lat: boolean
    lng: boolean
    altitudeMeters: boolean
    relativeAltitudeMeters: boolean
  }
}

const displayNumber = (value?: number) => value === undefined ? '' : String(Number(value.toFixed(7)))

const readImageDimensions = (file: File) => new Promise<{ width: number; height: number }>((resolve, reject) => {
  const source = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => {
    URL.revokeObjectURL(source)
    resolve({ width: image.naturalWidth, height: image.naturalHeight })
  }
  image.onerror = () => {
    URL.revokeObjectURL(source)
    reject(new Error('无法读取图片尺寸。'))
  }
  image.src = source
})

const isLikelyEquirectangularPanorama = (width?: number, height?: number) => {
  if (!width || !height) return false
  const ratio = width / height
  return ratio >= 1.9 && ratio <= 2.1
}

const pendingDraft = (file: File, index: number): DroneFileDraft => ({
  id: `${file.name}:${file.size}:${file.lastModified}:${index}`,
  file,
  status: 'reading',
  date: '',
  lat: '',
  lng: '',
  altitudeMeters: '',
  relativeAltitudeMeters: '',
  fromFile: {
    date: false,
    lat: false,
    lng: false,
    altitudeMeters: false,
    relativeAltitudeMeters: false,
  },
})

export function DroneMediaCard({ cityId, activeItemId, onSelectItem, onOpenPanorama }: DroneMediaCardProps) {
  const city = cityId ? cityById[cityId] : undefined
  const items = useMemo(() => getDroneMediaForCity(cityId), [cityId])
  const metadataRunRef = useRef(0)
  const [editing, setEditing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [draggedItemId, setDraggedItemId] = useState<string>()
  const [draftItemIds, setDraftItemIds] = useState(items.map((item) => item.id))
  const [draftHiddenIds, setDraftHiddenIds] = useState(travelAtlasEditorState.hiddenDroneMediaIds)
  const [uploadForm, setUploadForm] = useState({
    kind: 'panorama360' as 'panorama360' | 'aerialPhoto',
  })
  const [fileDrafts, setFileDrafts] = useState<DroneFileDraft[]>([])
  const itemById = new Map(items.map((item) => [item.id, item]))
  const displayedItems = editing
    ? draftItemIds.map((id) => itemById.get(id)).filter(Boolean)
    : items
  const droneGridRef = useFlipLayout<HTMLDivElement>(draftItemIds.join('|'))
  const hiddenIdsForCity = city
    ? draftHiddenIds.filter((id) => allImportedMediaItems.some((item) => (
        item.id === id && item.cityId === city.id && (item.kind === 'panorama360' || item.kind === 'aerialPhoto')
      )))
    : []
  const panoramaMismatchCount = uploadForm.kind === 'panorama360'
    ? fileDrafts.filter((draft) => draft.status === 'ready' && !isLikelyEquirectangularPanorama(draft.width, draft.height)).length
    : 0
  const aerialPanoramaHintCount = uploadForm.kind === 'aerialPhoto'
    ? fileDrafts.filter((draft) => draft.status === 'ready' && isLikelyEquirectangularPanorama(draft.width, draft.height)).length
    : 0

  if (!city || (items.length === 0 && !localEditorAvailable)) return null

  const mediaTitle = `${city.nameZh}无人机影像`

  const saveDraft = async () => {
    setBusy(true)
    setNotice('正在保存无人机影像布局…')
    try {
      await updateLocalEditorState((current) => ({
        ...current,
        droneOrderByCity: { ...current.droneOrderByCity, [city.id]: draftItemIds },
        hiddenDroneMediaIds: draftHiddenIds,
      }))
      reloadAfterLocalSave()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '保存失败。')
      setBusy(false)
    }
  }

  const uploadDroneFiles = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!fileDrafts.length) {
      setNotice('请先选择无人机图片。')
      return
    }
    if (fileDrafts.some((draft) => draft.status === 'reading')) {
      setNotice('文件信息仍在读取，请稍候。')
      return
    }
    if (fileDrafts.some((draft) => !/^\d{4}-\d{2}-\d{2}$/.test(draft.date))) {
      setNotice('每个文件都必须有有效的拍摄日期。文件未记录日期时，请手动补充。')
      return
    }
    if (panoramaMismatchCount > 0) {
      setNotice(`检测到 ${panoramaMismatchCount} 张图片不是常见的 2:1 全景比例。请改选“航拍照片”，或重新选择正确的 360 全景图。`)
      return
    }
    setBusy(true)
    setNotice(`正在接收 ${fileDrafts.length} 个无人机文件…`)
    try {
      const uploadedSourcePaths: string[] = []
      for (const draft of fileDrafts) {
        const lat = draft.lat.trim() ? Number(draft.lat) : undefined
        const lng = draft.lng.trim() ? Number(draft.lng) : undefined
        const altitudeMeters = draft.altitudeMeters.trim() ? Number(draft.altitudeMeters) : undefined
        const relativeAltitudeMeters = draft.relativeAltitudeMeters.trim() ? Number(draft.relativeAltitudeMeters) : undefined
        const uploaded = await uploadLocalMedia({
          countryId: city.countryId ?? '',
          cityId: city.id,
          kind: uploadForm.kind,
          file: draft.file,
          date: draft.date,
          lat,
          lng,
          altitudeMeters,
          relativeAltitudeMeters,
          titleZh: mediaTitle,
          titleEn: `${city.nameEn} Drone Media`,
        })
        uploadedSourcePaths.push(uploaded.sourcePath)
      }
      setNotice('文件已进入私有投递箱，正在生成三级网页资源…')
      await importLocalMedia(uploadedSourcePaths)
      reloadAfterLocalSave()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '无人机影像导入失败。')
      setBusy(false)
    }
  }

  const readSelectedFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])
    const runId = metadataRunRef.current + 1
    metadataRunRef.current = runId
    const pending = selectedFiles.map(pendingDraft)
    setFileDrafts(pending)
    if (!pending.length) {
      setNotice('')
      return
    }

    setNotice(`正在读取 ${pending.length} 个文件的日期、坐标和高度信息…`)
    const resolved = await Promise.all(pending.map(async (draft) => {
      try {
        const [metadataResult, dimensionsResult] = await Promise.allSettled([
          readDroneFileMetadata(draft.file),
          readImageDimensions(draft.file),
        ])
        const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : {}
        const dimensions = dimensionsResult.status === 'fulfilled' ? dimensionsResult.value : undefined
        const readErrors = [
          metadataResult.status === 'rejected' ? '无法读取 EXIF/XMP 元数据' : undefined,
          dimensionsResult.status === 'rejected' ? '无法读取图片尺寸' : undefined,
        ].filter(Boolean)
        return {
          ...draft,
          status: 'ready' as const,
          date: metadata.date ?? '',
          lat: displayNumber(metadata.lat),
          lng: displayNumber(metadata.lng),
          altitudeMeters: displayNumber(metadata.altitudeMeters),
          relativeAltitudeMeters: displayNumber(metadata.relativeAltitudeMeters),
          camera: metadata.camera,
          ...dimensions,
          ...(readErrors.length > 0 ? { error: `${readErrors.join('；')}。` } : {}),
          fromFile: {
            date: metadata.date !== undefined,
            lat: metadata.lat !== undefined,
            lng: metadata.lng !== undefined,
            altitudeMeters: metadata.altitudeMeters !== undefined,
            relativeAltitudeMeters: metadata.relativeAltitudeMeters !== undefined,
          },
        }
      } catch (error) {
        return {
          ...draft,
          status: 'ready' as const,
          error: error instanceof Error ? error.message : '无法读取文件信息。',
        }
      }
    }))

    if (metadataRunRef.current !== runId) return
    setFileDrafts(resolved)
    const missingDates = resolved.filter((draft) => !draft.date).length
    setNotice(missingDates
      ? `文件信息读取完成；${missingDates} 个文件没有拍摄日期，请补充日期后导入。`
      : '文件信息读取完成；已读取到的字段已自动锁定，缺失字段可按需补充。')
  }

  const updateFileDraft = (
    id: string,
    field: 'date' | 'lat' | 'lng' | 'altitudeMeters' | 'relativeAltitudeMeters',
    value: string,
  ) => {
    setFileDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [field]: value } : draft))
  }

  return (
    <aside className="drone-media-card glass-panel relative z-10 w-full p-[18px] text-left">
      <div className="atlas-panel-body drone-media-card-layout">
        <div className="drone-media-card-heading">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/55 bg-white/45 text-sky-600">
            <Drone className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.22em] text-white">Drone Media</p>
            <h2 className="mt-1 truncate text-[22px] font-semibold leading-[1.15] tracking-normal text-slate-950">{mediaTitle}</h2>
          </div>
          {localEditorAvailable ? (
            <LocalEditorToolbar
              editing={editing}
              busy={busy}
              label="无人机影像"
              onToggle={() => {
                setEditing((current) => !current)
                setShowUpload(false)
                setDraftItemIds(items.map((item) => item.id))
                setDraftHiddenIds(travelAtlasEditorState.hiddenDroneMediaIds)
                setFileDrafts([])
                setNotice('')
              }}
              onReset={() => {
                setDraftItemIds(items.map((item) => item.id))
                setDraftHiddenIds(travelAtlasEditorState.hiddenDroneMediaIds)
                setShowUpload(false)
                setFileDrafts([])
                setNotice('已撤销本轮尚未保存的调整。')
              }}
              onAdd={() => setShowUpload((open) => !open)}
              onSave={saveDraft}
            />
          ) : null}
        </div>

        {editing && showUpload ? (
          <form className="atlas-local-editor-form atlas-local-editor-form-dark" onSubmit={uploadDroneFiles}>
            <p>选择文件后会先自动读取日期、GPS 坐标、海拔和相对高度。只有文件没有记录的字段才需要补充；其中仅拍摄日期必填。</p>
            <div className="atlas-local-editor-form-grid">
              <select className="atlas-local-media-kind" value={uploadForm.kind} onChange={(event) => setUploadForm((form) => ({ ...form, kind: event.target.value as 'panorama360' | 'aerialPhoto' }))}>
                <option value="panorama360">360° 全景</option>
                <option value="aerialPhoto">航拍照片</option>
              </select>
              <label className="atlas-local-file-picker">
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" aria-label="无人机图片" onChange={(event) => void readSelectedFiles(event.target.files)} />
                <span className="atlas-local-file-picker-button">选择文件</span>
                <span className="atlas-local-file-picker-status" data-empty={fileDrafts.length === 0}>
                  {fileDrafts.length === 0
                    ? '未选取'
                    : fileDrafts.length === 1 ? fileDrafts[0].file.name : `已选取 ${fileDrafts.length} 个文件`}
                </span>
              </label>
            </div>
            {panoramaMismatchCount > 0 ? (
              <p className="atlas-local-editor-warning" role="alert">
                检测到 {panoramaMismatchCount} 张图片不是常见的 2:1 等距柱状全景图，强行打开会产生明显拉伸。请把类型改为“航拍照片”，或重新选择正确的 360 全景图。
              </p>
            ) : aerialPanoramaHintCount > 0 ? (
              <p className="atlas-local-editor-warning" role="status">
                检测到 {aerialPanoramaHintCount} 张图片接近 2:1，可能是 360 全景图。如果它能水平环绕，请改选“360 全景”；如果只是普通宽幅航拍，可以继续导入。
              </p>
            ) : null}
            {fileDrafts.length > 0 ? (
              <div className="atlas-drone-metadata-list">
                {fileDrafts.map((draft, index) => (
                  <article key={draft.id} className="atlas-drone-metadata-card" data-status={draft.status}>
                    <header>
                      <div>
                        <strong>{String(index + 1).padStart(2, '0')} · {draft.file.name}</strong>
                        <span>{(draft.file.size / 1024 / 1024).toFixed(2)} MiB{draft.camera ? ` · ${draft.camera}` : ''}</span>
                      </div>
                      <span>{draft.status === 'reading' ? '读取中' : '读取完成'}</span>
                    </header>
                    {draft.error ? <p>未能解析元数据：{draft.error}。仍可补充日期后导入。</p> : null}
                    <div className="atlas-drone-metadata-fields">
                      <label>
                        <span>拍摄日期 <em>{draft.fromFile.date ? '文件读取' : '缺失 · 必填'}</em></span>
                        <input type="date" required readOnly={draft.fromFile.date} value={draft.date} onChange={(event) => updateFileDraft(draft.id, 'date', event.target.value)} />
                      </label>
                      <label>
                        <span>纬度 <em>{draft.fromFile.lat ? '文件读取' : '缺失 · 选填'}</em></span>
                        <input type="number" step="any" min="-90" max="90" readOnly={draft.fromFile.lat} placeholder="未记录，可选填写" value={draft.lat} onChange={(event) => updateFileDraft(draft.id, 'lat', event.target.value)} />
                      </label>
                      <label>
                        <span>经度 <em>{draft.fromFile.lng ? '文件读取' : '缺失 · 选填'}</em></span>
                        <input type="number" step="any" min="-180" max="180" readOnly={draft.fromFile.lng} placeholder="未记录，可选填写" value={draft.lng} onChange={(event) => updateFileDraft(draft.id, 'lng', event.target.value)} />
                      </label>
                      <label>
                        <span>海拔 <em>{draft.fromFile.altitudeMeters ? '文件读取' : '缺失 · 选填'}</em></span>
                        <input type="number" step="any" readOnly={draft.fromFile.altitudeMeters} placeholder="米，可选填写" value={draft.altitudeMeters} onChange={(event) => updateFileDraft(draft.id, 'altitudeMeters', event.target.value)} />
                      </label>
                      <label>
                        <span>相对高度 <em>{draft.fromFile.relativeAltitudeMeters ? '文件读取' : '缺失 · 选填'}</em></span>
                        <input type="number" step="any" readOnly={draft.fromFile.relativeAltitudeMeters} placeholder="米，可选填写" value={draft.relativeAltitudeMeters} onChange={(event) => updateFileDraft(draft.id, 'relativeAltitudeMeters', event.target.value)} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            <button className="atlas-local-import-submit" type="submit" disabled={busy || panoramaMismatchCount > 0}>确认导入</button>
          </form>
        ) : null}

        {notice ? <p className="atlas-local-editor-notice atlas-local-editor-notice-dark" role="status">{notice}</p> : null}

        {editing && hiddenIdsForCity.length > 0 ? (
          <div className="atlas-local-editor-hidden-actions">
            <button
              type="button"
              className="atlas-local-editor-restore"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void updateLocalEditorState((current) => ({
                  ...current,
                  hiddenDroneMediaIds: current.hiddenDroneMediaIds.filter((id) => !hiddenIdsForCity.includes(id)),
                })).then(reloadAfterLocalSave).catch((error: unknown) => {
                  setNotice(error instanceof Error ? error.message : '恢复失败。')
                  setBusy(false)
                })
              }}
            >
              恢复本城隐藏影像（{hiddenIdsForCity.length}）
            </button>
            <button
              type="button"
              className="atlas-local-editor-delete"
              disabled={busy}
              onClick={() => {
                const confirmed = window.confirm(`确定永久删除本城已隐藏的 ${hiddenIdsForCity.length} 个影像吗？\n\n这会同时删除投递箱原图、生成后的网页文件和目录记录，无法恢复。`)
                if (!confirmed) return
                setBusy(true)
                setNotice('正在彻底删除已隐藏影像…')
                void deleteHiddenLocalMedia(city.id, hiddenIdsForCity)
                  .then(reloadAfterLocalSave)
                  .catch((error: unknown) => {
                    setNotice(error instanceof Error ? error.message : '删除失败。')
                    setBusy(false)
                  })
              }}
            >
              删除隐藏影像
            </button>
          </div>
        ) : null}

        {displayedItems.length === 0 ? (
          <div className="atlas-local-editor-empty">暂无无人机影像。点击设置，再点＋即可导入。</div>
        ) : (
          <div ref={droneGridRef} className="drone-media-track selector-scrollbar min-w-0 flex-1">
            {displayedItems.map((item, index) => {
              if (!item) return null
              const itemNumber = String(index + 1).padStart(2, '0')
              return (
                <article
                  key={item.id}
                  data-flip-id={item.id}
                  role="button"
                  tabIndex={0}
                  draggable={editing}
                  data-editing={editing}
                  data-dragging={draggedItemId === item.id}
                  data-active={item.id === activeItemId}
                  aria-pressed={item.id === activeItemId}
                  onDragStart={(event) => {
                    if (!editing) return
                    setDraggedItemId(item.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', item.id)
                  }}
                  onDragOver={(event) => {
                    if (!editing || !draggedItemId || draggedItemId === item.id) return
                    event.preventDefault()
                    setDraftItemIds((current) => {
                      const next = current.filter((id) => id !== draggedItemId)
                      next.splice(next.indexOf(item.id), 0, draggedItemId)
                      return next
                    })
                  }}
                  onDragEnd={() => setDraggedItemId(undefined)}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!editing) onSelectItem(item)
                  }}
                  onKeyDown={(event) => {
                    if (!editing && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      event.stopPropagation()
                      onSelectItem(item)
                    }
                  }}
                  className="drone-media-item-card drone-media-item-card-thumbnail rounded-xl border border-white/65 bg-white/52 p-2 shadow-[0_8px_18px_rgba(15,23,42,0.07)]"
                >
                  <div className="drone-media-thumbnail-frame">
                    <img src={`${item.thumbSrc}?starmapMedia=${encodeURIComponent(item.id)}`} alt={`${city.nameEn} drone media ${itemNumber}`} loading="lazy" decoding="async" />
                    <span className="drone-media-thumbnail-shade" aria-hidden="true" />
                    {item.type === 'panorama360' ? (
                      <span className="drone-media-panorama-badge" aria-label="360° 全景图" title="360° 全景图">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <ellipse cx="12" cy="12" rx="9" ry="4.5" />
                          <path d="M3 12c0-4.4 4-8 9-8s9 3.6 9 8-4 8-9 8-9-3.6-9-8Z" />
                          <path d="m7 10-2 2 2 2M17 10l2 2-2 2" />
                        </svg>
                        <span>360°</span>
                      </span>
                    ) : null}
                  </div>
                  <span className="drone-media-item-number drone-media-thumbnail-number">{itemNumber}</span>
                  {editing ? (
                    <span className="atlas-local-media-tools" onClick={(event) => event.stopPropagation()}>
                      <span className="atlas-local-editor-drag" aria-label="拖动无人机影像排序"><GripVertical /></span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="隐藏无人机影像"
                        title="隐藏（不删除原图）"
                        onClick={() => {
                          setDraftItemIds((current) => current.filter((id) => id !== item.id))
                          setDraftHiddenIds((current) => [...new Set([...current, item.id])])
                        }}
                      ><X /></span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenPanorama(item)
                      }}
                      className="drone-media-view-button mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-950 px-1.5 py-1.5 font-semibold text-white transition hover:bg-sky-500 hover:text-slate-950"
                    >
                      <Maximize2 aria-hidden="true" />
                      View
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
