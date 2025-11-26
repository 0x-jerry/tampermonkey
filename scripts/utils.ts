import { pathToFileURL } from 'url'
import type { ITamperMonkeyHeader } from '../types'

export async function getScriptHeaderConfig(filepath: string) {
  globalThis._ENV_DISABLE_RUN_ = true

  const config: ITamperMonkeyHeader = (
    await import(pathToFileURL(filepath).toString())
  ).config

  return config
}
