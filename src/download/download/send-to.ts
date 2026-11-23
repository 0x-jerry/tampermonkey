import { getExtension } from '../format'
import { post, standHeaders } from '../request'
import { getDefaultRpc, getIdmClient } from '../settings'

const idmState: { lock: Promise<any>; seq: number } = { lock: Promise.resolve(), seq: 1 }
const aria2Lock: { lock: Promise<any> } = { lock: Promise.resolve() }
const abdmLock: { lock: Promise<any> } = { lock: Promise.resolve() }

export function sendToIdm(
  link: string,
  filename: string,
  filesize: number,
  headers: Record<string, string | string[]> = {},
) {
  const rpc = getIdmClient()

  idmState.lock = idmState.lock.catch(() => {}).then(async () => {
    const normalized = standHeaders(headers)
    const seq = idmState.seq
    const time = Date.now()
    const url = `http://127.0.0.1:1001/client/${rpc}?seq=${seq}`
    const ext = getExtension(filename)
    const headersText =
      Object.entries(normalized)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') + '\n'

    const format = (key: number, value: unknown) => {
      if (value === undefined || value === null) return ''
      const str = String(value)
      const length = new Blob([str]).size
      return `${key}=${length}${length > 0 ? `:${str}` : ''}`
    }

    const fields = [
      format(4, ext),
      format(6, link),
      format(7, location.origin),
      format(11, headersText),
      format(100, filename),
      format(122, 4),
    ]

    const data = `MSG#${seq}#13#1#10241:${seq + 1000}:0:${time}:0:1:2:${filesize}:0,${fields.join(',')};`

    const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 15000))
    const response = await Promise.race([
      post<string>(url, data, {}, 'text', false),
      timeout,
    ])

    if (response && response.endsWith(`${seq}:3;`)) {
      idmState.seq++
      return 'success' as const
    }

    return 'fail' as const
  })

  return idmState.lock
}

export function sendToAria2(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  aria2Lock.lock = aria2Lock.lock.catch(() => {}).then(async () => {
    const normalized = standHeaders(headers)
    const headerParts = Object.entries(normalized).map(([key, value]) => `${key}: ${value}`)
    const rpc = getDefaultRpc('aria2')
    const url = `${rpc.domain}:${rpc.port}${rpc.path}`
    const dir = rpc.dir !== null && rpc.dir !== '' ? rpc.dir : undefined

    const data: any = {
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'aria2.addUri',
      params: [
        [link],
        {
          ...(dir ? { dir } : {}),
          ...(normalized['User-Agent'] ? { 'user-agent': normalized['User-Agent'] } : {}),
          referer: normalized.Referer || `${location.origin}/`,
          out: filename,
          header: headerParts,
        },
      ],
    }

    if (rpc.token) data.params.unshift(`token:${rpc.token}`)

    const response = await post<any>(
      url,
      data,
      { Accept: 'application/json', 'Content-Type': 'application/json;charset=UTF-8' },
      'json',
      false,
    )

    return response?.result ? ('success' as const) : ('fail' as const)
  })

  return aria2Lock.lock
}

export function sendToAbdm(
  link: string,
  filename: string,
  headers?: Record<string, string | string[]>,
) {
  abdmLock.lock = abdmLock.lock.catch(() => {}).then(async () => {
    const normalized = standHeaders(headers)
    const rpc = getDefaultRpc('abdm')
    const url = `${rpc.domain}:${rpc.port}/start-headless-download`

    const data: any = {
      downloadSource: {
        name: filename,
        description: 'netdisk-download',
        link,
        headers: normalized,
      },
      name: filename,
      startDownload: true,
    }

    if (normalized.Referer) data.downloadSource.downloadPage = normalized.Referer
    if (rpc.dir) data.folder = rpc.dir

    const response = await post<string>(
      url,
      data,
      { 'Content-Type': 'application/json;charset=UTF-8', 'X-Api-Key': rpc.key || '' },
      'text',
      false,
    )

    return response === 'OK' ? ('success' as const) : ('fail' as const)
  })

  return abdmLock.lock
}
