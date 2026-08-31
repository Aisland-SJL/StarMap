import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const sourceRoot = path.resolve(webRoot, '..')
export const maintenanceRoot = path.resolve(sourceRoot, '..')

export function resolvePrivateRoot(environment = process.env) {
  const configuredRoot = environment.STARMAP_PRIVATE_ROOT?.trim()
  if (configuredRoot) return path.resolve(configuredRoot)

  const maintenancePrivateRoot = path.join(maintenanceRoot, '06_private')
  if (existsSync(maintenancePrivateRoot)) return maintenancePrivateRoot

  return path.join(sourceRoot, '06_private')
}

export function getPrivatePaths(environment = process.env) {
  const root = resolvePrivateRoot(environment)
  const dataRoot = path.join(root, 'data')
  return {
    root,
    configRoot: path.join(root, 'config'),
    dataRoot,
    inboxRoot: path.join(root, 'MediaInbox'),
    userMediaRoot: path.join(root, 'media', 'user'),
    editorStatePath: path.join(dataRoot, 'editor-state.local.json'),
    localTravelMapPath: path.join(dataRoot, 'travel-map.local.json'),
    mediaCatalogPath: path.join(dataRoot, 'user-media.local.json'),
    mediaSourceIndexPath: path.join(dataRoot, 'media-source-index.local.json'),
  }
}
