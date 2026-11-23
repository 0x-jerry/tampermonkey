import { fixFilename } from '../format'
import { standHeaders } from '../request'
import { encodeBase } from '../serialize'
import { getCurlTerminal } from '../settings'

function headerParts(headers: Record<string, string | string[]> | undefined, style: 'curl' | 'aria2') {
  const normalized = standHeaders(headers, true, false)
  const parts: string[] = []

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === null) continue
    const safe = String(value).replace(/"/g, '\\"')
    parts.push(style === 'curl' ? `-H "${key}: ${safe}"` : `--header="${key}: ${safe}"`)
  }

  return parts.length ? ` ${parts.join(' ')}` : ''
}

export function toCurl(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  const terminal = getCurlTerminal()
  const name = fixFilename(filename)
  const command = terminal !== 'wp' ? 'curl' : 'curl.exe'

  return `${command} -L -C - "${link}" -o "${name}"${headerParts(headers, 'curl')}`
}

export function toAria2(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  const name = fixFilename(filename)
  return `aria2c "${link}" --out "${name}"${headerParts(headers, 'aria2')}`
}

export function toBitcomet(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  const name = fixFilename(filename)
  const normalized = standHeaders(headers, true, false)
  const data = new URLSearchParams()

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === null) continue

    switch (key.toLowerCase()) {
      case 'referer':
        data.set('referrer', String(value))
        break
      case 'user-agent':
        data.set('user_agent', String(value))
        break
      case 'cookie':
        data.set('cookie', String(value))
        break
    }
  }

  const extra = data.toString()
  const bc = `AA/${encodeURIComponent(name)}/?url=${encodeURIComponent(link)}${
    extra ? `&${extra}` : ''
  }ZZ`

  return `bc://http/${encodeBase(bc)}`
}
