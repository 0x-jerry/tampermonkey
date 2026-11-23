import { fixFilename } from '../format'
import { standHeaders } from '../request'

function headerParts(headers: Record<string, string | string[]> | undefined) {
  const normalized = standHeaders(headers, true, false)
  const parts: string[] = []

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === null) continue
    const safe = String(value).replace(/"/g, '\\"')
    parts.push(`--header="${key}: ${safe}"`)
  }

  return parts.length ? ` ${parts.join(' ')}` : ''
}

export function toAria2(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  const name = fixFilename(filename)
  return `aria2c "${link}" --out "${name}"${headerParts(headers)}`
}
