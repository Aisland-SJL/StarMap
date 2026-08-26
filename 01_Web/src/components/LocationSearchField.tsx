import { LoaderCircle, MapPin, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type SearchOption = {
  id: string
  nameZh: string
  nameEn: string
}

type LocationSearchFieldProps<T extends SearchOption> = {
  label: string
  placeholder: string
  selected?: T
  search: (query: string, signal: AbortSignal) => Promise<T[]>
  onSelect: (option?: T) => void
  minQueryLength?: number
  getMeta?: (option: T) => string
  searchOnSubmit?: boolean
}

export function LocationSearchField<T extends SearchOption>({
  label,
  placeholder,
  selected,
  search,
  onSelect,
  minQueryLength = 1,
  getMeta,
  searchOnSubmit = false,
}: LocationSearchFieldProps<T>) {
  const listboxId = useId()
  const [query, setQuery] = useState(selected?.nameZh ?? '')
  const [results, setResults] = useState<T[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const requestVersionRef = useRef(0)
  const activeControllerRef = useRef<AbortController | undefined>(undefined)

  const runSearch = useCallback((normalizedQuery: string, controller: AbortController) => {
    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion
    setIsLoading(true)
    setNotice('')
    void search(normalizedQuery, controller.signal)
      .then((nextResults) => {
        if (requestVersionRef.current !== requestVersion) return
        setResults(nextResults)
        setActiveIndex(0)
        setNotice(nextResults.length === 0 ? '没有找到匹配地点，请换一个名称或代码。' : '')
        setIsOpen(true)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestVersionRef.current !== requestVersion) return
        setResults([])
        setNotice(error instanceof Error ? error.message : '地点检索暂时不可用。')
        setIsOpen(true)
      })
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsLoading(false)
      })
  }, [search])

  const submitSearch = () => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < minQueryLength) {
      setNotice(`请至少输入 ${minQueryLength} 个字符。`)
      setIsOpen(true)
      return
    }
    activeControllerRef.current?.abort()
    const controller = new AbortController()
    activeControllerRef.current = controller
    runSearch(normalizedQuery, controller)
  }

  useEffect(() => {
    if (searchOnSubmit) return
    if (selected && query === selected.nameZh) return
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < minQueryLength) return

    activeControllerRef.current?.abort()
    const controller = new AbortController()
    activeControllerRef.current = controller
    const timeout = window.setTimeout(() => {
      runSearch(normalizedQuery, controller)
    }, minQueryLength === 0 ? 80 : 280)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [minQueryLength, query, runSearch, searchOnSubmit, selected])

  const choose = (option: T) => {
    setQuery(option.nameZh)
    setResults([])
    setNotice('')
    setIsOpen(false)
    onSelect(option)
  }

  return (
    <div className="atlas-location-search">
      <label htmlFor={`${listboxId}-input`}>{label}</label>
      <div className="atlas-location-search-input-wrap">
        <Search aria-hidden="true" />
        <input
          id={`${listboxId}-input`}
          type="search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={isOpen && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            if (event.target.value.trim().length < minQueryLength) {
              setResults([])
              setNotice('')
              setIsLoading(false)
            }
            setIsOpen(true)
            onSelect(undefined)
          }}
          onFocus={() => {
            if (results.length > 0 || notice) setIsOpen(true)
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && results.length > 0) {
              event.preventDefault()
              setIsOpen(true)
              setActiveIndex((index) => Math.min(index + 1, results.length - 1))
            }
            if (event.key === 'ArrowUp' && results.length > 0) {
              event.preventDefault()
              setIsOpen(true)
              setActiveIndex((index) => Math.max(index - 1, 0))
            }
            if (event.key === 'Enter' && isOpen && results[activeIndex]) {
              event.preventDefault()
              choose(results[activeIndex])
            } else if (event.key === 'Enter' && searchOnSubmit) {
              event.preventDefault()
              submitSearch()
            }
            if (event.key === 'Escape') setIsOpen(false)
          }}
        />
        {isLoading ? <LoaderCircle className="atlas-location-search-spinner" aria-label="正在检索" /> : null}
        {searchOnSubmit ? (
          <button type="button" className="atlas-location-search-submit" onMouseDown={(event) => event.preventDefault()} onClick={submitSearch}>
            检索
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="atlas-location-search-selected">
          <MapPin aria-hidden="true" />
          <span>{selected.nameZh}</span>
          <span>{selected.nameEn}</span>
          {getMeta ? <span>{getMeta(selected)}</span> : null}
        </div>
      ) : null}

      {isOpen && (results.length > 0 || notice) ? (
        <div className="atlas-location-search-results" id={listboxId} role="listbox">
          {results.map((option, index) => (
            <button
              key={option.id}
              id={`${listboxId}-${option.id}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="atlas-location-search-result-main">
                <strong>{option.nameZh}</strong>
                <span>{option.nameEn}</span>
              </span>
              {getMeta ? <span className="atlas-location-search-result-meta">{getMeta(option)}</span> : null}
            </button>
          ))}
          {notice ? <p role="status">{notice}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
