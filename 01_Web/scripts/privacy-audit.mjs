import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(webRoot, '..')
const publicFiles = process.argv.includes('--manifest-stdin')
  ? readFileSync(0, 'utf8').split('\0').filter(Boolean)
  : []

const isPrivateTrackedPath = (filePath) => {
  const normalized = filePath.replaceAll('\\', '/')
  if (normalized.startsWith('02_Assets/PrivateData/')) return true
  if (normalized.startsWith('01_Web/public/media/user/')) return true
  if (normalized.startsWith('01_Web/src/data/generated/')) return true
  if (normalized.includes('.local.')) return true
  if (normalized === '01_Web/src/data/travel_map_export.json') return true
  if (normalized.startsWith('02_Assets/MediaInbox/')) {
    return normalized !== '02_Assets/MediaInbox/README.md'
      && !normalized.startsWith('02_Assets/MediaInbox/_country-template/')
  }
  if (/^01_Web\/\.env(?:\.|$)/.test(normalized)) return normalized !== '01_Web/.env.example'
  return false
}

const existingViolations = publicFiles.filter((filePath) =>
  isPrivateTrackedPath(filePath) && existsSync(path.join(projectRoot, filePath)),
)

const samplePath = path.join(webRoot, 'src', 'data', 'travel-map.sample.json')
const sampleData = JSON.parse(readFileSync(samplePath, 'utf8'))
const errors = []
const gitignore = readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')
const requiredIgnoreRules = [
  '06_private/',
  '.starmap-private/',
  '02_Assets/MediaInbox/*',
  '01_Web/public/media/user/',
  '01_Web/src/data/generated/*.local.*',
  '.env.*',
  '!.env.example',
]

if (publicFiles.length === 0) {
  errors.push('No public-file manifest was provided. Run this audit through npm run privacy:check.')
}

if (existingViolations.length > 0) {
  errors.push(`Private paths are tracked:\n${existingViolations.map((filePath) => `  - ${filePath}`).join('\n')}`)
}
const missingIgnoreRules = requiredIgnoreRules.filter((rule) => !gitignore.split(/\r?\n/).includes(rule))
if (missingIgnoreRules.length > 0) {
  errors.push(`Required .gitignore safeguards are missing:\n${missingIgnoreRules.map((rule) => `  - ${rule}`).join('\n')}`)
}
if (sampleData.privacy_level !== 'public-sample') {
  errors.push('travel-map.sample.json must declare privacy_level = public-sample.')
}
if (!Array.isArray(sampleData.records) || sampleData.records.length === 0) {
  errors.push('travel-map.sample.json needs at least one runnable sample record.')
}

const droneSource = readFileSync(path.join(webRoot, 'src', 'data', 'droneMedia.ts'), 'utf8')
if (droneSource.includes('builtInDroneMediaItems') || /src:\s*['"]\/media\//.test(droneSource)) {
  errors.push('droneMedia.ts still contains built-in media instead of the private local catalog.')
}

if (errors.length > 0) {
  console.error(`StarMap privacy audit failed (${errors.length}):`)
  for (const error of errors) console.error(`\n${error}`)
  process.exitCode = 1
} else {
  console.log('StarMap privacy audit passed.')
  console.log(`Tracked and unignored public files checked: ${publicFiles.length}`)
  console.log(`Neutral sample records: ${sampleData.records.length}`)
  console.log('Required .gitignore safeguards are present.')
  console.log('Private Inbox, generated media, local catalogs, local travel data, and environment files are outside the tracked public boundary.')
  console.log('Note: this checks the current tree. Publish from a clean repository so earlier private Git history is not inherited.')
}
