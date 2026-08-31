import { useCallback, useMemo, useRef, useState } from 'react'
import { CalendarDays, Compass, GripVertical, Layers3, Star, X } from 'lucide-react'
import { localEditorAvailable, travelAtlasEditorState } from '../data/editorState'
import { allImportedMediaItems, getCityCoverPhoto, getCityPhotos, getMediaSource } from '../data/mediaCatalog'
import { addLocalTravelRecord, deleteHiddenLocalMedia, importLocalMedia, reloadAfterLocalSave, searchLocalCities, updateLocalEditorState, uploadLocalMedia } from '../data/localEditorApi'
import type { CitySearchOption } from '../data/localEditorApi'
import { cityById, countryById, getCitiesForCountry } from '../data/travelAtlas'
import type { CityId, Country, CountryId, SelectionMode } from '../types/travel'
import type { CityPhotoGalleryRequest } from './CityPhotoGalleryModal'
import { LocationSearchField } from './LocationSearchField'
import { LocalEditorToolbar } from './LocalEditorToolbar'
import { useFlipLayout } from './useFlipLayout'

type InfoCardProps = {
  mode: SelectionMode
  selectedCountryId?: CountryId
  selectedCityId?: CityId
  onSelectCity?: (cityId: CityId) => void
  onOpenCityPhotos?: (request: CityPhotoGalleryRequest) => void
}

const continentRules: Array<{ continent: string; regions: string[] }> = [
  { continent: 'North America', regions: ['north america', '北美', '中美', '加勒比'] },
  { continent: 'South America', regions: ['south america', '南美'] },
  { continent: 'Europe', regions: ['europe', '欧洲', '北欧', '东欧', '西欧', '南欧', '欧亚'] },
  { continent: 'Asia', regions: ['asia', '亚洲', '东亚', '东南亚', '南亚', '中亚', '西亚', '中东', '印度洋'] },
  { continent: 'Africa', regions: ['africa', '非洲', '北非', '东非', '西非', '南非'] },
  { continent: 'Oceania', regions: ['oceania', '大洋洲', '澳洲'] },
  { continent: 'Antarctica', regions: ['antarctica', '南极'] },
]

const getContinentName = (country?: Country) => {
  const regionText = [
    ...(country?.keywords ?? []),
    ...(country?.records?.map((record) => record.region).filter(Boolean) ?? []),
  ]
    .join(' ')
    .toLowerCase()

  return continentRules.find(({ regions }) => regions.some((region) => regionText.includes(region)))?.continent ?? '—'
}

export function InfoCard({ mode, selectedCountryId, selectedCityId, onSelectCity, onOpenCityPhotos }: InfoCardProps) {
  const country = selectedCountryId ? countryById[selectedCountryId] : undefined
  const city = selectedCityId ? cityById[selectedCityId] : undefined
  const isCityMode = mode === 'city' && city && country
  const isOverview = mode === 'overview' || !country
  const memoryCities = useMemo(() => country ? getCitiesForCountry(country.id) : [], [country])
  const isCountryGrid = mode === 'country' && Boolean(country)
  const cityPhotos = useMemo(() => isCityMode ? getCityPhotos(city.id) : [], [city, isCityMode])
  const isCityPhotoGrid = isCityMode && cityPhotos.length > 0
  const usesMemoryGridPreview = isCountryGrid || Boolean(isCityMode)
  const memorySectionLabel = isCityMode ? 'City photos' : 'City cards'
  const cityCoverPhoto = useMemo(() => isCityMode ? getCityCoverPhoto(city.id) : undefined, [city, isCityMode])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [cityEditing, setCityEditing] = useState(false)
  const [photoEditing, setPhotoEditing] = useState(false)
  const [showAddCity, setShowAddCity] = useState(false)
  const [editorNotice, setEditorNotice] = useState('')
  const [editorBusy, setEditorBusy] = useState(false)
  const [draggedCityId, setDraggedCityId] = useState<CityId>()
  const [draggedPhotoId, setDraggedPhotoId] = useState<string>()
  const [draftCityIds, setDraftCityIds] = useState<CityId[]>(memoryCities.map((item) => item.id))
  const [draftHiddenCityIds, setDraftHiddenCityIds] = useState<CityId[]>(travelAtlasEditorState.hiddenCityIds)
  const [draftPhotoIds, setDraftPhotoIds] = useState<string[]>(cityPhotos.map((item) => item.id))
  const [draftHiddenPhotoIds, setDraftHiddenPhotoIds] = useState<string[]>(travelAtlasEditorState.hiddenMediaIds)
  const [draftCoverPhotoId, setDraftCoverPhotoId] = useState<string | undefined>(cityCoverPhoto?.id)
  const [selectedCityOption, setSelectedCityOption] = useState<CitySearchOption>()
  const [isManualCityEntry, setIsManualCityEntry] = useState(false)
  const [manualCity, setManualCity] = useState({ nameZh: '', nameEn: '', lat: '', lng: '' })
  const [cityVisitDates, setCityVisitDates] = useState({ startDate: '', endDate: '' })
  const cityByDraftId = new Map(memoryCities.map((item) => [item.id, item]))
  const photoByDraftId = new Map(cityPhotos.map((item) => [item.id, item]))
  const displayedMemoryCities = cityEditing
    ? draftCityIds.map((id) => cityByDraftId.get(id)).filter(Boolean)
    : memoryCities
  const displayedCityPhotos = photoEditing
    ? draftPhotoIds.map((id) => photoByDraftId.get(id)).filter(Boolean)
    : cityPhotos
  const memoryGridRef = useFlipLayout<HTMLDivElement>(
    isCityMode ? draftPhotoIds.join('|') : draftCityIds.join('|'),
  )
  const hiddenCityIdsForCountry = country
    ? draftHiddenCityIds.filter((id) => id.startsWith(`${country.id}__`))
    : []
  const hiddenPhotoIdsForCity = city
    ? draftHiddenPhotoIds.filter((id) => allImportedMediaItems.some((item) => item.id === id && item.cityId === city.id && item.kind === 'photo'))
    : []
  const countryCode = country?.flagCode
  const searchCityOptions = useCallback((query: string, signal: AbortSignal) => {
    if (!countryCode) return Promise.reject(new Error('这个国家缺少 ISO 代码，暂时无法检索城市。'))
    return searchLocalCities(query, countryCode, signal)
  }, [countryCode])

  const saveCityDraft = async () => {
    if (!country) return
    setEditorBusy(true)
    setEditorNotice('正在保存城市布局…')
    try {
      await updateLocalEditorState((current) => ({
        ...current,
        cityOrderByCountry: { ...current.cityOrderByCountry, [country.id]: draftCityIds },
        hiddenCityIds: draftHiddenCityIds,
      }))
      reloadAfterLocalSave()
    } catch (error) {
      setEditorNotice(error instanceof Error ? error.message : '保存失败。')
      setEditorBusy(false)
    }
  }

  const savePhotoDraft = async () => {
    if (!city) return
    setEditorBusy(true)
    setEditorNotice('正在保存照片布局…')
    try {
      await updateLocalEditorState((current) => ({
        ...current,
        mediaOrderByCity: { ...current.mediaOrderByCity, [city.id]: draftPhotoIds },
        hiddenMediaIds: draftHiddenPhotoIds,
        coverMediaByCity: draftCoverPhotoId
          ? { ...current.coverMediaByCity, [city.id]: draftCoverPhotoId }
          : current.coverMediaByCity,
      }))
      reloadAfterLocalSave()
    } catch (error) {
      setEditorNotice(error instanceof Error ? error.message : '保存失败。')
      setEditorBusy(false)
    }
  }

  const addCity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!country) return
    if (!selectedCityOption && !isManualCityEntry) {
      setEditorNotice('请先从候选列表中选择一个城市。')
      return
    }
    const manualLat = Number(manualCity.lat)
    const manualLng = Number(manualCity.lng)
    const cityOption: CitySearchOption | undefined = isManualCityEntry
      ? {
          id: `manual-${manualCity.nameEn || manualCity.nameZh}`,
          nameZh: manualCity.nameZh.trim(),
          nameEn: (manualCity.nameEn || manualCity.nameZh).trim(),
          countryCode: country.flagCode ?? '',
          lat: manualLat,
          lng: manualLng,
          detail: '手动坐标',
          provider: 'manual',
        }
      : selectedCityOption
    if (
      !cityOption?.nameZh
      || !cityOption.nameEn
      || (isManualCityEntry && (!manualCity.lat.trim() || !manualCity.lng.trim()))
      || !Number.isFinite(cityOption.lat)
      || !Number.isFinite(cityOption.lng)
      || cityOption.lat < -90
      || cityOption.lat > 90
      || cityOption.lng < -180
      || cityOption.lng > 180
    ) {
      setEditorNotice('请填写城市名称及有效经纬度。')
      return
    }
    setEditorBusy(true)
    setEditorNotice('正在创建城市…')
    try {
      await addLocalTravelRecord({
        country: country.nameZh,
        country_en: country.nameEn,
        country_code: country.flagCode,
        city: cityOption.nameZh,
        city_en: cityOption.nameEn,
        start_date: cityVisitDates.startDate,
        end_date: cityVisitDates.endDate || undefined,
        lat: cityOption.lat,
        lng: cityOption.lng,
      })
      reloadAfterLocalSave()
    } catch (error) {
      setEditorNotice(error instanceof Error ? error.message : '创建失败。')
      setEditorBusy(false)
    }
  }

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length || !country || !city) return
    setEditorBusy(true)
    setEditorNotice(`正在接收 ${files.length} 张照片…`)
    try {
      const uploadedSourcePaths: string[] = []
      for (const file of Array.from(files)) {
        const uploaded = await uploadLocalMedia({ countryId: country.id, cityId: city.id, kind: 'photo', file })
        uploadedSourcePaths.push(uploaded.sourcePath)
      }
      setEditorNotice('照片已进入私有投递箱，正在生成三级网页资源…')
      await importLocalMedia(uploadedSourcePaths)
      reloadAfterLocalSave()
    } catch (error) {
      setEditorNotice(error instanceof Error ? error.message : '照片导入失败。')
      setEditorBusy(false)
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }
  const visitedCityCount = country?.cityIds.length ?? 0
  const openCityGallery = (galleryMode: CityPhotoGalleryRequest['mode'], initialPhotoId?: string) => {
    if (!isCityPhotoGrid || !city) return
    onOpenCityPhotos?.({
      photos: cityPhotos,
      cityName: city.nameZh ?? city.nameEn ?? 'City',
      initialPhotoId,
      mode: galleryMode,
    })
  }
  const eyebrowLabel = isOverview ? 'Overview' : isCityMode ? 'City info' : 'Selected country'
  const title = isOverview ? 'StarMap' : isCityMode ? city.nameZh : country.nameZh
  const continentName = getContinentName(country)
  const titleDetail = isOverview
    ? 'Journey map overview'
    : isCityMode
      ? `${city.nameZh} / ${city.nameEn}`
      : `${country.nameZh} / ${country.nameEn}`
  const dateLabel = isOverview
    ? 'Select a country or city'
    : isCityMode
      ? city.visitedDateRange
      : country.visitedDateRange
  const summary = isOverview
    ? 'A soft overview of visited destinations, mapped routes and future story material.'
    : isCityMode
      ? city.summary
      : country.summary

  return (
    <aside
      className="atlas-info-panel selector-scrollbar glass-panel pointer-events-auto relative z-10 flex w-full max-w-sm flex-col overflow-hidden p-5 text-left"
      data-memory-layout={usesMemoryGridPreview ? 'grid' : 'track'}
    >
      <div className="atlas-info-header mb-5 flex shrink-0 items-center justify-between gap-3">
        <div className="atlas-panel-body">
          <p className="atlas-card-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-white">
            {eyebrowLabel}
          </p>
          <h2 className="atlas-card-title mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            {title}
          </h2>
          {!isOverview ? (
            <>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {isCityMode ? city.nameEn : country.nameEn}
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {isCityMode ? city.visitedDateRange : country.visitedDateRange}
              </p>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="atlas-panel-body grid size-11 place-items-center rounded-full bg-slate-950 text-white shadow-lg">
            <CalendarDays className="size-5" />
          </div>
        </div>
      </div>

      <div className="atlas-info-content atlas-panel-body flex min-h-0 flex-1 flex-col gap-4">
        {isOverview ? (
          <div>
            <p className="text-sm text-slate-500">
              {dateLabel}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
              {titleDetail}
            </h3>
          </div>
        ) : null}

        {isCityMode ? (
          <div className="atlas-preview-card shrink-0 overflow-hidden rounded-[22px] border border-white/70 bg-white/50 shadow-[0_16px_50px_rgba(15,23,42,0.1)]">
            {cityCoverPhoto ? (
              <img
                src={getMediaSource(cityCoverPhoto, 'thumb')}
                alt={`${city.nameEn} travel preview`}
                className="h-24 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="h-24 bg-[radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.95),transparent_24%),linear-gradient(135deg,rgba(14,165,233,0.52),rgba(15,23,42,0.78)),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[length:auto,auto,28px_28px]"
                style={{ backgroundColor: country.accent }}
              />
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Preview image
              </span>
              <span className="text-xs font-medium text-slate-500">{city.nameEn}</span>
            </div>
          </div>
        ) : null}

        <div className="grid shrink-0 grid-cols-2 gap-3">
          <div className="atlas-info-metric rounded-[18px] border border-white/60 bg-white/55 p-3">
            <p className="text-xs text-slate-400">
              {isOverview ? 'Mode' : isCityMode ? 'Country' : 'Visited Cities'}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isOverview
                ? 'Overview'
                : isCityMode
                  ? country.nameEn
                  : `${visitedCityCount} ${visitedCityCount === 1 ? 'city' : 'cities'}`}
            </p>
          </div>
          <div className="atlas-info-metric rounded-[18px] border border-white/60 bg-white/55 p-3">
            <p className="text-xs text-slate-400">{isOverview ? 'Keywords' : 'Continent'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isOverview ? 'Travel / Games' : continentName}
            </p>
          </div>
        </div>

        {isOverview ? <p className="text-sm leading-6 text-slate-600">{summary}</p> : null}

        {(isCountryGrid || isCityMode) && (
          (isCityMode ? cityPhotos.length > 0 : memoryCities.length > 0) || localEditorAvailable
        ) ? (
          <div
            className={`atlas-memory-panel flex min-h-0 flex-col rounded-[22px] bg-slate-950 p-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.2)] ${
              usesMemoryGridPreview ? 'atlas-memory-panel-grid-preview' : ''
            }`}
            data-photo-gallery={isCityMode ? 'true' : undefined}
            onClick={isCityPhotoGrid ? () => openCityGallery('grid') : undefined}
          >
            {isCityMode ? (
              <div className="atlas-memory-panel-heading-row mb-3">
                <button
                  type="button"
                  className="atlas-memory-panel-heading flex shrink-0 items-center gap-2"
                  disabled={!isCityPhotoGrid || photoEditing}
                  onClick={(event) => {
                    event.stopPropagation()
                    openCityGallery('grid')
                  }}
                >
                  <Layers3 className="size-4 text-sky-300" />
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {memorySectionLabel}
                  </span>
                </button>
                {localEditorAvailable ? (
                  <LocalEditorToolbar
                    editing={photoEditing}
                    busy={editorBusy}
                    label="城市照片"
                    onToggle={() => {
                      setPhotoEditing((editing) => !editing)
                      setDraftPhotoIds(cityPhotos.map((photo) => photo.id))
                      setDraftHiddenPhotoIds(travelAtlasEditorState.hiddenMediaIds)
                      setDraftCoverPhotoId(cityCoverPhoto?.id)
                      setEditorNotice('')
                    }}
                    onReset={() => {
                      setDraftPhotoIds(cityPhotos.map((photo) => photo.id))
                      setDraftHiddenPhotoIds(travelAtlasEditorState.hiddenMediaIds)
                      setDraftCoverPhotoId(cityCoverPhoto?.id)
                      setEditorNotice('已撤销本轮尚未保存的照片调整。')
                    }}
                    onAdd={() => photoInputRef.current?.click()}
                    onSave={savePhotoDraft}
                  />
                ) : null}
                <input
                  ref={photoInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={(event) => void uploadPhotos(event.currentTarget.files)}
                />
              </div>
            ) : (
              <div className="atlas-memory-panel-heading-row mb-3">
                <div className="flex shrink-0 items-center gap-2">
                  <Layers3 className="size-4 text-sky-300" />
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {memorySectionLabel}
                  </p>
                </div>
                {localEditorAvailable ? (
                  <LocalEditorToolbar
                    editing={cityEditing}
                    busy={editorBusy}
                    label="城市列表"
                    onToggle={() => {
                      setCityEditing((editing) => !editing)
                      setDraftCityIds(memoryCities.map((item) => item.id))
                      setDraftHiddenCityIds(travelAtlasEditorState.hiddenCityIds)
                      setShowAddCity(false)
                      setSelectedCityOption(undefined)
                      setIsManualCityEntry(false)
                      setManualCity({ nameZh: '', nameEn: '', lat: '', lng: '' })
                      setCityVisitDates({ startDate: '', endDate: '' })
                      setEditorNotice('')
                    }}
                    onReset={() => {
                      setDraftCityIds(memoryCities.map((item) => item.id))
                      setDraftHiddenCityIds(travelAtlasEditorState.hiddenCityIds)
                      setShowAddCity(false)
                      setSelectedCityOption(undefined)
                      setCityVisitDates({ startDate: '', endDate: '' })
                      setEditorNotice('已撤销本轮尚未保存的城市调整。')
                    }}
                    onAdd={() => setShowAddCity((open) => !open)}
                    onSave={saveCityDraft}
                  />
                ) : null}
              </div>
            )}

            {isCountryGrid && cityEditing && showAddCity ? (
              <form className="atlas-local-editor-form atlas-local-editor-form-dark" onSubmit={addCity} onClick={(event) => event.stopPropagation()}>
                {isManualCityEntry ? (
                  <div className="atlas-local-editor-form-grid">
                    <label className="atlas-local-editor-date-field">
                      <span>城市名称</span>
                      <input required value={manualCity.nameZh} onChange={(event) => setManualCity((value) => ({ ...value, nameZh: event.target.value }))} />
                    </label>
                    <label className="atlas-local-editor-date-field">
                      <span>英文名（可选）</span>
                      <input value={manualCity.nameEn} onChange={(event) => setManualCity((value) => ({ ...value, nameEn: event.target.value }))} />
                    </label>
                    <label className="atlas-local-editor-date-field">
                      <span>纬度（-90～90）</span>
                      <input required type="number" min="-90" max="90" step="any" value={manualCity.lat} onChange={(event) => setManualCity((value) => ({ ...value, lat: event.target.value }))} />
                    </label>
                    <label className="atlas-local-editor-date-field">
                      <span>经度（-180～180）</span>
                      <input required type="number" min="-180" max="180" step="any" value={manualCity.lng} onChange={(event) => setManualCity((value) => ({ ...value, lng: event.target.value }))} />
                    </label>
                  </div>
                ) : (
                  <LocationSearchField
                    label="城市名称"
                    placeholder="输入中文或 English，至少 2 个字…"
                    selected={selectedCityOption}
                    search={searchCityOptions}
                    onSelect={setSelectedCityOption}
                    minQueryLength={2}
                    searchOnSubmit
                    getMeta={(option) => option.detail}
                  />
                )}
                <button
                  type="button"
                  className="atlas-local-editor-mode-toggle"
                  onClick={() => {
                    setIsManualCityEntry((value) => !value)
                    setSelectedCityOption(undefined)
                    setEditorNotice('')
                  }}
                >
                  {isManualCityEntry ? '返回在线检索' : '搜索不到？手动填写坐标'}
                </button>
                <div className="atlas-local-editor-form-grid">
                  <label className="atlas-local-editor-date-field">
                    <span>到访日期</span>
                    <input required type="date" value={cityVisitDates.startDate} onChange={(event) => setCityVisitDates((dates) => ({ ...dates, startDate: event.target.value }))} />
                  </label>
                  <label className="atlas-local-editor-date-field">
                    <span>结束日期（可选）</span>
                    <input type="date" min={cityVisitDates.startDate || undefined} value={cityVisitDates.endDate} onChange={(event) => setCityVisitDates((dates) => ({ ...dates, endDate: event.target.value }))} />
                  </label>
                </div>
                {!isManualCityEntry ? (
                  <p className="atlas-local-editor-attribution">
                    城市检索需要联网：优先使用 Cesium ion geocode；无权限、无结果或超时后回退{' '}
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>。
                  </p>
                ) : null}
                <button type="submit" disabled={editorBusy || (!isManualCityEntry && !selectedCityOption)}>确认添加城市</button>
              </form>
            ) : null}

            {editorNotice ? <p className="atlas-local-editor-notice atlas-local-editor-notice-dark" role="status">{editorNotice}</p> : null}

            {isCountryGrid && cityEditing && hiddenCityIdsForCountry.length > 0 ? (
              <button
                type="button"
                className="atlas-local-editor-restore"
                disabled={editorBusy}
                onClick={(event) => {
                  event.stopPropagation()
                  setEditorBusy(true)
                  void updateLocalEditorState((current) => ({
                    ...current,
                    hiddenCityIds: current.hiddenCityIds.filter((id) => !id.startsWith(`${country?.id}__`)),
                  })).then(reloadAfterLocalSave).catch((error: unknown) => {
                    setEditorNotice(error instanceof Error ? error.message : '恢复失败。')
                    setEditorBusy(false)
                  })
                }}
              >
                恢复本国已隐藏城市（{hiddenCityIdsForCountry.length}）
              </button>
            ) : null}

            {isCityMode && photoEditing && hiddenPhotoIdsForCity.length > 0 ? (
              <div className="atlas-local-editor-hidden-actions">
                <button
                  type="button"
                  className="atlas-local-editor-restore"
                  disabled={editorBusy}
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditorBusy(true)
                    void updateLocalEditorState((current) => ({
                      ...current,
                      hiddenMediaIds: current.hiddenMediaIds.filter((id) => !hiddenPhotoIdsForCity.includes(id)),
                    })).then(reloadAfterLocalSave).catch((error: unknown) => {
                      setEditorNotice(error instanceof Error ? error.message : '恢复失败。')
                      setEditorBusy(false)
                    })
                  }}
                >
                  恢复本城隐藏照片（{hiddenPhotoIdsForCity.length}）
                </button>
                <button
                  type="button"
                  className="atlas-local-editor-delete"
                  disabled={editorBusy}
                  onClick={(event) => {
                    event.stopPropagation()
                    const confirmed = window.confirm(`确定永久删除本城已隐藏的 ${hiddenPhotoIdsForCity.length} 张照片吗？\n\n这会同时删除投递箱原图、生成后的网页文件和目录记录，无法恢复。`)
                    if (!confirmed) return
                    setEditorBusy(true)
                    setEditorNotice('正在彻底删除已隐藏照片…')
                    void updateLocalEditorState((current) => ({
                      ...current,
                      hiddenMediaIds: [...new Set([...current.hiddenMediaIds, ...hiddenPhotoIdsForCity])],
                    }))
                      .then(() => deleteHiddenLocalMedia(city.id, hiddenPhotoIdsForCity))
                      .then(reloadAfterLocalSave)
                      .catch((error: unknown) => {
                        setEditorNotice(error instanceof Error ? error.message : '彻底删除失败。')
                        setEditorBusy(false)
                      })
                  }}
                >
                  彻底删除隐藏照片
                </button>
              </div>
            ) : null}

            {isCityMode && displayedCityPhotos.length === 0 ? (
              <div className="atlas-local-editor-empty">暂无城市照片。点击设置，再点＋即可从本机导入。</div>
            ) : null}
            <div
              ref={memoryGridRef}
              className={`atlas-memory-track selector-scrollbar min-h-0 gap-3 overflow-auto pb-2 ${
                usesMemoryGridPreview ? 'atlas-memory-grid-preview' : 'flex snap-x'
              }`}
            >
              {isCityMode ? displayedCityPhotos.map((photo, index) => {
                if (!photo) return null
                return (
                <button
                  type="button"
                  key={photo.id}
                  data-flip-id={photo.id}
                  className="city-photo-card"
                  data-editing={photoEditing}
                  data-dragging={draggedPhotoId === photo.id}
                  draggable={photoEditing}
                  aria-label={`Open ${city.nameEn} photo ${index + 1}`}
                  onDragStart={(event) => {
                    if (!photoEditing) return
                    setDraggedPhotoId(photo.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', photo.id)
                  }}
                  onDragOver={(event) => {
                    if (!photoEditing || !draggedPhotoId || draggedPhotoId === photo.id) return
                    event.preventDefault()
                    setDraftPhotoIds((current) => {
                      const next = current.filter((id) => id !== draggedPhotoId)
                      next.splice(next.indexOf(photo.id), 0, draggedPhotoId)
                      return next
                    })
                  }}
                  onDragEnd={() => setDraggedPhotoId(undefined)}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!photoEditing) openCityGallery('viewer', photo.id)
                  }}
                >
                  <img
                    src={getMediaSource(photo, 'thumb')}
                    alt={`${city.nameEn} city photo ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                  {photoEditing ? (
                    <span className="atlas-local-media-tools" onClick={(event) => event.stopPropagation()}>
                      <span className="atlas-local-editor-drag" aria-label="拖动照片排序"><GripVertical /></span>
                      <span
                        role="button"
                        tabIndex={0}
                        data-active={draftCoverPhotoId === photo.id}
                        aria-label="设为城市封面"
                        title="设为城市封面"
                        onClick={() => setDraftCoverPhotoId(photo.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setDraftCoverPhotoId(photo.id)
                        }}
                      ><Star /></span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="隐藏照片"
                        title="隐藏（不删除原图）"
                        onClick={() => {
                          setDraftPhotoIds((current) => current.filter((id) => id !== photo.id))
                          setDraftHiddenPhotoIds((current) => [...new Set([...current, photo.id])])
                          if (draftCoverPhotoId === photo.id) setDraftCoverPhotoId(undefined)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            setDraftPhotoIds((current) => current.filter((id) => id !== photo.id))
                            setDraftHiddenPhotoIds((current) => [...new Set([...current, photo.id])])
                          }
                        }}
                      ><X /></span>
                    </span>
                  ) : null}
                  {draftCoverPhotoId === photo.id ? <span className="atlas-local-cover-badge">封面</span> : null}
                </button>
              )}) : displayedMemoryCities.map((memoryCity, index) => {
                if (!memoryCity) return null
                const isActive = memoryCity.id === selectedCityId
                const memoryCoverPhoto = getCityCoverPhoto(memoryCity.id)

                return (
                  <button
                    type="button"
                    key={memoryCity.id}
                    data-flip-id={memoryCity.id}
                    data-editing={cityEditing}
                    data-dragging={draggedCityId === memoryCity.id}
                    draggable={cityEditing}
                    onDragStart={(event) => {
                      if (!cityEditing) return
                      setDraggedCityId(memoryCity.id)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', memoryCity.id)
                    }}
                    onDragOver={(event) => {
                      if (!cityEditing || !draggedCityId || draggedCityId === memoryCity.id) return
                      event.preventDefault()
                      setDraftCityIds((current) => {
                        const next = current.filter((id) => id !== draggedCityId)
                        next.splice(next.indexOf(memoryCity.id), 0, draggedCityId)
                        return next
                      })
                    }}
                    onDragEnd={() => setDraggedCityId(undefined)}
                    onClick={() => {
                      if (!cityEditing) onSelectCity?.(memoryCity.id)
                    }}
                    aria-pressed={isActive}
                    className={`memory-city-card overflow-hidden rounded-[18px] border transition ${
                      usesMemoryGridPreview
                        ? 'memory-city-card-grid-preview min-w-0'
                        : 'min-w-[154px] snap-start'
                    } ${
                      isActive ? 'border-sky-300/90 bg-white/18 shadow-[0_0_34px_rgba(125,211,252,0.2)]' : 'border-white/10 bg-white/10'
                    }`}
                  >
                    {memoryCoverPhoto ? (
                      <img
                        src={getMediaSource(memoryCoverPhoto, 'thumb')}
                        alt={`${memoryCity.nameEn} travel memory`}
                        className={`w-full object-cover ${usesMemoryGridPreview ? 'h-[52px]' : 'h-24'}`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className={`${usesMemoryGridPreview ? 'h-[52px]' : 'h-24'} bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.92),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.24),rgba(15,23,42,0.28)),linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:auto,auto,22px_22px]`}
                        style={{ backgroundColor: country?.accent ?? '#38bdf8' }}
                      />
                    )}
                    <div className="p-3">
                      {isCountryGrid ? (
                        <div className="memory-city-card-heading">
                          <h4 className="memory-city-card-title text-sm font-semibold text-white">{memoryCity.nameZh}</h4>
                          <p className="memory-city-card-index text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="memory-city-card-index text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <h4 className="memory-city-card-title mt-1 text-sm font-semibold text-white">{memoryCity.nameZh}</h4>
                        </>
                      )}
                      <p className="memory-city-card-subtitle text-xs text-slate-300">{memoryCity.nameEn}</p>
                      <p className="memory-city-card-date mt-2 text-xs leading-5 text-slate-300">
                        {memoryCity.visitedDateRange ?? 'Travel memory'}
                      </p>
                    </div>
                    {cityEditing ? (
                      <span className="atlas-local-media-tools atlas-local-city-tools" onClick={(event) => event.stopPropagation()}>
                        <span className="atlas-local-editor-drag" aria-label="拖动城市排序"><GripVertical /></span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`隐藏${memoryCity.nameZh}`}
                          title="隐藏（不删除旅行记录）"
                          onClick={() => {
                            if (!window.confirm(`从本地展示中隐藏“${memoryCity.nameZh}”？原始旅行记录不会删除。`)) return
                            setDraftCityIds((current) => current.filter((id) => id !== memoryCity.id))
                            setDraftHiddenCityIds((current) => [...new Set([...current, memoryCity.id])])
                          }}
                        ><X /></span>
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
          <Compass className="size-4" />
          Focus: {isOverview ? 'World overview' : isCityMode ? city.nameEn : country.nameEn}
        </div>
      </div>
    </aside>
  )
}
