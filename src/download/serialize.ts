export function clone<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    if (value === null || value === undefined || typeof value !== 'object') return value
    if (value instanceof Date) return new Date(value) as T
    if (Array.isArray(value)) return value.map((item) => clone(item)) as T

    const result: Record<string, unknown> = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = clone((value as Record<string, unknown>)[key])
      }
    }
    return result as T
  }
}

export function encodeBase(str: string) {
  try {
    str = encodeURIComponent(str)
  } catch {}
  try {
    str = unescape(str)
  } catch {}
  try {
    str = btoa(str)
  } catch {}
  return str
}

export function decodeBase(str: string) {
  try {
    str = decodeURIComponent(str)
  } catch {}
  try {
    str = atob(str)
  } catch {}
  try {
    str = escape(str)
  } catch {}
  try {
    str = decodeURIComponent(str)
  } catch {}
  return str
}

export function stringify(obj: Record<string, unknown>) {
  let str = ''
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

    const value = obj[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        str += `${encodeURIComponent(key)}=${encodeURIComponent(item)}&`
      }
    } else {
      str += `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}&`
    }
  }
  return str.slice(0, -1)
}
