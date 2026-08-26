import exifr from 'exifr'

export type DroneFileMetadata = {
  date?: string
  lat?: number
  lng?: number
  altitudeMeters?: number
  relativeAltitudeMeters?: number
  camera?: string
}

type ExifRecord = Record<string, unknown>

const finiteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const match = value.trim().match(/[+-]?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatExifDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = String(value.getFullYear()).padStart(4, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (typeof value !== 'string') return undefined
  const match = value.trim().match(/^(\d{4})[:/-](\d{2})[:/-](\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined
}

const firstDefined = <T,>(...values: (T | undefined)[]) => values.find((value) => value !== undefined)

const cameraName = (metadata: ExifRecord) => {
  const make = typeof metadata.Make === 'string' ? metadata.Make.trim() : ''
  const model = typeof metadata.Model === 'string' ? metadata.Model.trim() : ''
  const combined = [make, model].filter(Boolean).join(' ')
  return combined || undefined
}

export async function readDroneFileMetadata(file: File): Promise<DroneFileMetadata> {
  const metadata = await exifr.parse(file, true) as ExifRecord | undefined
  if (!metadata) return {}

  const gpsAltitude = finiteNumber(metadata.GPSAltitude)
  const altitudeReference = metadata.GPSAltitudeRef
  const isBelowSeaLevel = altitudeReference === 1
    || (typeof altitudeReference === 'string' && /below/i.test(altitudeReference))
  const normalizedGpsAltitude = gpsAltitude === undefined
    ? undefined
    : isBelowSeaLevel ? -Math.abs(gpsAltitude) : gpsAltitude

  return {
    date: firstDefined(
      formatExifDate(metadata.DateTimeOriginal),
      formatExifDate(metadata.CreateDate),
      formatExifDate(metadata.DateTimeDigitized),
      formatExifDate(metadata.ModifyDate),
      formatExifDate(metadata.DateTime),
    ),
    lat: firstDefined(finiteNumber(metadata.latitude), finiteNumber(metadata.Latitude)),
    lng: firstDefined(finiteNumber(metadata.longitude), finiteNumber(metadata.Longitude)),
    altitudeMeters: firstDefined(
      finiteNumber(metadata.AbsoluteAltitude),
      normalizedGpsAltitude,
      finiteNumber(metadata.Altitude),
    ),
    relativeAltitudeMeters: firstDefined(
      finiteNumber(metadata.RelativeAltitude),
      finiteNumber(metadata.FlightHeight),
    ),
    camera: cameraName(metadata),
  }
}
