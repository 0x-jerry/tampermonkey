export interface MatcherConfig {
  test: RegExp
  handler: () => any
}

class Xorshift {
  x = 1
  y = 0
  z = 0
  w = 0
  constructor(seed = Date.now()) {
    this.x = seed
    this.y = 362436069
    this.z = 521288629
    this.w = 88675121
  }

  next() {
    const t = this.x ^ (this.x << 11)
    this.x = this.y
    this.y = this.z
    this.z = this.w
    this.w = this.w ^ (this.w >> 19) ^ (t ^ (t >> 8))
    return this.w / 2 ** 31 // 2^32-1
  }
}

function Random(seed = 0) {
  const x = new Xorshift(seed)

  return (min = 0, max = 1) => {
    const r = x.next()

    return min + (max - min) * r
  }
}

export const random = /* @__PURE__ */ (() => Random(Date.now()))()

const storagePrefix = '_0x_monkey:'

export const storage = {
  get<T>(key: string, defaultValue?: T) {
    const _key = storagePrefix + key

    let v = defaultValue

    try {
      const s = localStorage.getItem(_key)
      if (s) {
        v = JSON.parse(s)
      }
    } catch (error) {
      console.warn(`Parse storage ${_key} failed`, error)
    }

    return v
  },
  set<T>(key: string, value?: T) {
    const _key = storagePrefix + key
    const v = JSON.stringify(value)
    localStorage.setItem(_key, v)
  },
}

export function sleep(ts = 100) {
  return new Promise((resolve) => setTimeout(resolve, ts))
}

export function sleepRandom(min = 100, max = 1000) {
  return sleep(random(min, max))
}

export async function waitElement(selector: string): Promise<HTMLElement> {
  return when(() => document.querySelector(selector))
}

/**
 *
 * @template T
 * @param {() => T } checker
 * @param {number} timeout  default is 10 * 1000 (10s).
 * @returns {Promise<T>}
 */
export async function when<T>(
  checker: () => T,
  timeout: number = 10 * 1000,
): Promise<NonNullable<T>> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const pass = await checker()

    if (pass) return pass

    await sleep(100)
  }

  throw new Error('Timeout')
}

/**
 * @param {MatcherConfig[]} configs
 * @param {string} str
 */
export function stringMatcher(str: string, configs: MatcherConfig[]) {
  const hit = configs.find((n) => n.test.test(str))

  return hit?.handler()
}

/**
 * @param {() => any} fn
 */
export async function run(fn: () => any) {
  if (__ENV_DISABLE_RUN__) {
    return
  }

  try {
    await fn()
  } catch (error) {
    console.error('Running error', error)
  }
}

export function injectStyle(style: string) {
  const $style = document.createElement('style')
  $style.innerText = style

  document.head.appendChild($style)

  return $style
}

export function tag<Key extends keyof HTMLElementTagNameMap>(
  name: Key,
  attrs: Partial<HTMLElementTagNameMap[Key]> = {},
): HTMLElementTagNameMap[Key] {
  const $el = document.createElement(name)

  for (const [key, value] of Object.entries(attrs)) {
    $el.setAttribute(key, value)
  }

  return $el
}
