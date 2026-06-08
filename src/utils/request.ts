export function parseRawHeadersString(rawHeadersString?: string) {
  const headers = new Headers()

  if (!rawHeadersString) return headers

  const lines = rawHeadersString.trim().split(/[\r\n]+/)

  for (const line of lines) {
    const separatorIdx = line.indexOf(':')

    const key = (line.slice(0, separatorIdx) || '').trim().toLowerCase()
    const value = (line.slice(separatorIdx + 1) || '').trim()

    if (key) {
      headers.append(key, value)
    }
  }

  return headers
}
