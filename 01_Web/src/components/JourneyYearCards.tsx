import { CalendarDays, MapPin } from 'lucide-react'
import { cityById, countryById, journeyDays, shouldHideCityFromNavigation } from '../data/travelAtlas'
import type { City, Country, CountryId, JourneyDay } from '../types/travel'

type CountryYearGroup = {
  country: Country
  startDate: string
  endDate: string
  cities: City[]
}

type YearGroup = {
  year: number
  countries: CountryYearGroup[]
}

const getDayEndDate = (day: JourneyDay) => {
  const city = cityById[day.cityId]
  const record = city?.records?.find((item) => item.id === day.id)
  return record?.end_date || record?.start_date || day.date
}

const buildYearGroups = (): YearGroup[] => {
  const orderedDays = [...journeyDays].sort((a, b) =>
    `${a.date}-${a.id}`.localeCompare(`${b.date}-${b.id}`),
  )
  const groups = new Map<number, Map<CountryId, { days: JourneyDay[]; cityIds: Set<string> }>>()

  orderedDays.forEach((day) => {
    if (!day.countryId) return
    const year = Number(day.date.slice(0, 4))
    if (!Number.isFinite(year)) return

    const countriesForYear = groups.get(year) ?? new Map()
    const countryGroup = countriesForYear.get(day.countryId) ?? {
      days: [],
      cityIds: new Set<string>(),
    }

    countryGroup.days.push(day)
    countryGroup.cityIds.add(day.cityId)
    countriesForYear.set(day.countryId, countryGroup)
    groups.set(year, countriesForYear)
  })

  return [...groups.entries()]
    .map(([year, countriesForYear]) => ({
      year,
      countries: [...countriesForYear.entries()]
        .map(([countryId, group]) => {
          const country = countryById[countryId]
          const endDates = group.days.map(getDayEndDate).sort()

          return {
            country,
            startDate: group.days[0]?.date ?? `${year}`,
            endDate: endDates[endDates.length - 1] ?? group.days[0]?.date ?? `${year}`,
            cities: country.cityIds
              .filter((cityId) => group.cityIds.has(cityId))
              .map((cityId) => cityById[cityId])
              .filter((city) => Boolean(city) && !shouldHideCityFromNavigation(city)),
          }
        })
        .filter((group): group is CountryYearGroup => Boolean(group.country))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }))
    .sort((a, b) => b.year - a.year)
}

const yearGroups = buildYearGroups()

export function JourneyYearCards() {
  return (
    <section className="journey-view-section mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
      <div className="space-y-[18px]">
        {yearGroups.map((yearGroup) => (
          <section key={yearGroup.year} className="journey-year-group p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/55 text-slate-500 shadow-sm">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Travel year
                </p>
                <h3 className="text-3xl font-semibold tracking-normal text-slate-950">
                  {yearGroup.year}
                </h3>
              </div>
            </div>

            <div className="selector-scrollbar flex snap-x gap-4 overflow-x-auto pb-3">
              {yearGroup.countries.map((countryGroup) => {
                const { country } = countryGroup
                const dateRange = countryGroup.startDate === countryGroup.endDate
                  ? countryGroup.startDate
                  : `${countryGroup.startDate} - ${countryGroup.endDate}`

                return (
                  <article
                    key={`${yearGroup.year}-${country.id}`}
                    className="journey-country-card min-h-[260px] w-[290px] shrink-0 snap-start rounded-[24px] border border-white/70 bg-white/48 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/65 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="journey-year-card-flag" aria-hidden="true">
                          {country.flagCode ? (
                            <img
                              alt=""
                              src={`https://flagcdn.com/w80/${country.flagCode}.png`}
                            />
                          ) : (
                            <span>{country.flag ?? '\u2022'}</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xl font-semibold tracking-normal text-slate-950">
                            {country.nameZh}
                          </h4>
                          <p className="mt-0.5 truncate text-sm font-medium text-slate-500">
                            {country.nameEn}
                          </p>
                        </div>
                      </div>
                      <span
                        className="mt-1 size-3 rounded-full shadow-[0_0_18px_var(--country-color)]"
                        style={{ backgroundColor: country.accent, '--country-color': country.accent } as React.CSSProperties}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="mt-4 text-xs font-medium text-slate-400">{dateRange}</p>

                    <div className="mt-5 space-y-2">
                      {countryGroup.cities.map((city) => (
                        <div
                          key={city.id}
                          className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"
                        >
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                          <p>
                            <span className="font-semibold">{city.nameZh}</span>{' '}
                            <span className="text-slate-400">{city.nameEn}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
