const prefix = 'netdisk-download:'

export const gmStore = {
  get<T>(key: string, fallback?: T): T {
    try {
      return GM_getValue(prefix + key, fallback as T)
    } catch {
      return fallback as T
    }
  },
  set<T>(key: string, value: T) {
    GM_setValue(prefix + key, value)
  },
  del(key: string) {
    GM_deleteValue(prefix + key)
  },
}

export const localStore = {
  get<T>(key: string, fallback?: T): T {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback as T

    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  },
  set<T>(key: string, value: T) {
    const raw =
      typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
    localStorage.setItem(key, raw)
  },
  del(key: string) {
    localStorage.removeItem(key)
  },
}
