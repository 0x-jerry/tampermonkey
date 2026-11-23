import { addStyle } from './dom'
import { resolveProvider } from './providers'
import { STYLE } from './ui/style'

export function main() {
  try {
    if (typeof unsafeWindow === 'undefined') (window as any).unsafeWindow = window
  } catch {}

  const provider = resolveProvider()
  if (!provider) return

  addStyle('netdisk-download-style', STYLE)

  provider.addButton()

  console.info(
    `[netdisk-download] ${location.host}${location.pathname} · ${provider.detectPage() || 'unknown'}`,
  )
}
