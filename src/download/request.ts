import { isType } from './format'

export type HeaderValue = string | string[] | number | boolean | null | undefined
export type HeadersInput = Record<string, HeaderValue | object> | string | undefined

export function standCookies(input: string | string[], type = 'cookie') {
  const cookies: Record<string, string> = {}
  if (!input) return cookies

  const lines = Array.isArray(input) ? input : [input]
  const isSetCookie = type.includes('set-cookie')
  const blocks = lines.flatMap((line) => line.split(','))

  for (const block of blocks) {
    const parts = block.split(';')

    if (isSetCookie) {
      const mainPair = parts[0].trim()
      if (!mainPair.includes('=')) continue
      const [key, ...valueParts] = mainPair.split('=')
      const trimmedKey = key.trim()
      if (/^(path|domain|expires|max-age|samesite|secure|httponly)$/i.test(trimmedKey)) continue
      cookies[trimmedKey] = valueParts.join('=').trim()
    } else {
      for (const part of parts) {
        if (!part.includes('=')) continue
        const [key, ...valueParts] = part.split('=')
        cookies[key.trim()] = valueParts.join('=').trim()
      }
    }
  }

  return cookies
}

export function standHeaders(
  headers: HeadersInput = {},
  withServer = true,
  withOrigin = true,
  withCookie = false,
) {
  const pairs: Array<[string, HeaderValue]> = []

  if (typeof headers === 'string') {
    for (const line of headers.split(/[\r\n]+/)) {
      if (!line.includes(':')) continue
      const [key, ...valueParts] = line.split(':')
      pairs.push([key, valueParts.join(':')])
    }
  } else if (headers) {
    for (const key in headers) {
      const value = headers[key]
      pairs.push([
        key,
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? JSON.stringify(value)
          : (value as HeaderValue),
      ])
    }
  }

  const normalized: Record<string, any> = {}

  for (const [key, value] of pairs) {
    const normalizedKey = key
      .trim()
      .toLowerCase()
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-')

    const normalizedValue = typeof value === 'string' ? value.trim() : value

    if (normalized[normalizedKey]) {
      normalized[normalizedKey] = ([] as any[]).concat(normalized[normalizedKey], normalizedValue)
    } else {
      normalized[normalizedKey] = normalizedValue
    }
  }

  if (withCookie) {
    for (const key in normalized) {
      if (key.toLowerCase().includes('cookie')) {
        normalized[key] = standCookies(normalized[key] as string | string[], key.toLowerCase()) as any
      }
    }
  }

  if (!withServer) return normalized

  return {
    Accept: '*/*',
    'User-Agent': navigator.userAgent,
    ...(withOrigin ? { Origin: location.origin, Referer: `${location.origin}/` } : {}),
    ...normalized,
  } as Record<string, HeaderValue>
}

export function toRequestHeaders(headers: Record<string, HeaderValue>) {
  const result: Record<string, string> = {}

  for (const key in headers) {
    const value = headers[key]
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      result[key] = key.toLowerCase().includes('cookie') ? value.join('; ') : value.join(', ')
    } else {
      result[key] = String(value)
    }
  }

  return result
}

function parseResponse(response: Tampermonkey.Response<any>, type: string) {
  if (type === 'json') {
    if (response.response && typeof response.response === 'object') return response.response
    try {
      return JSON.parse(response.responseText)
    } catch {
      return response.responseText
    }
  }

  if (type === 'blob' || type === 'arraybuffer') return response.response

  return response.responseText
}

function attachResponseHeaders(response: Tampermonkey.Response<any>) {
  const raw =
    (response as any).responseHeaders ||
    (typeof (response as any).getAllResponseHeaders === 'function'
      ? (response as any).getAllResponseHeaders()
      : '') ||
    ''

  const parsed = standHeaders(typeof raw === 'string' ? raw.trim() : '', false, false, true)
  ;(response as any).responseHeaders = parsed
  return response
}

type RequestOptions = Omit<Tampermonkey.Request, 'responseType'> & { responseType?: string }

function request(options: RequestOptions) {
  const fn =
    typeof GM_xmlhttpRequest === 'function'
      ? GM_xmlhttpRequest
      : typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function'
        ? GM.xmlHttpRequest
        : null

  if (!fn) throw new Error('GM_xmlhttpRequest is unavailable')

  return fn({ withCredentials: true, ...options } as any) as Tampermonkey.AbortHandle<any>
}

function requestPromise(options: RequestOptions) {
  let handle: Tampermonkey.AbortHandle<any> | undefined

  const promise = new Promise<Tampermonkey.Response<any>>((resolve, reject) => {
    handle = request({
      ...options,
      onload: (response) => resolve(attachResponseHeaders(response)),
      onerror: (error) => reject(new Error(`请求失败: ${JSON.stringify(error)}`)),
      ontimeout: () => reject(new Error('请求超时')),
    })
  }) as Promise<Tampermonkey.Response<any>> & { abort?: () => void }

  promise.abort = () => handle?.abort?.()

  return promise
}

export async function get<T = any>(
  url: string,
  headers?: HeadersInput,
  type = 'json',
  withOrigin = true,
): Promise<T> {
  const response = await requestPromise({
    method: 'GET',
    url,
    headers: toRequestHeaders(standHeaders(headers, true, withOrigin)),
    responseType: type as any,
    anonymous: false,
  })

  return parseResponse(response, type) as T
}

export async function post<T = any>(
  url: string,
  data: unknown,
  headers?: HeadersInput,
  type = 'json',
  withOrigin = true,
  full = false,
): Promise<T> {
  let body: string | undefined
  let contentType: string | undefined

  if (isType(data) === 'object' || isType(data) === 'array') {
    body = JSON.stringify(data)
    contentType = 'application/json'
  } else if (isType(data) === 'urlsearchparams') {
    body = String(data)
    contentType = 'application/x-www-form-urlencoded'
  } else {
    body = data === undefined || data === null ? undefined : String(data)
  }

  const normalized = standHeaders(headers, true, withOrigin)
  normalized.Accept = '*/*,application/json;charset=utf-8'
  if (contentType && !Object.keys(normalized).some((key) => key.toLowerCase() === 'content-type')) {
    normalized['Content-Type'] = contentType
  }

  const response = await requestPromise({
    method: 'POST',
    url,
    headers: toRequestHeaders(normalized),
    data: body,
    responseType: type as any,
    anonymous: false,
  })

  return (full ? response : parseResponse(response, type)) as T
}

export async function head(url: string, headers?: HeadersInput, usingGET = false): Promise<any> {
  const response = await requestPromise({
    method: usingGET ? 'GET' : 'HEAD',
    url,
    headers: toRequestHeaders(standHeaders(headers)),
    anonymous: false,
  })

  if (!usingGET && (response.status < 200 || response.status >= 400)) {
    const nextHeaders = typeof headers === 'object' && headers ? { ...headers } : {}
    return head(response.finalUrl || url, { ...nextHeaders, Range: 'bytes=0-0' }, true)
  }

  return response
}

export async function getFinal(
  url: string,
  headers: HeadersInput = {},
  usingGET = false,
  returnURL = true,
): Promise<any> {
  const response = await head(url, headers, usingGET)

  if (!response.finalUrl) throw response
  if (response.status === 204 && response.statusText === 'IDM') throw response

  if (response.status >= 300 && response.status < 400) {
    return getFinal(response.finalUrl, headers, usingGET, returnURL)
  }

  return returnURL ? response.finalUrl : response
}
