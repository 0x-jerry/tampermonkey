import { getExtension } from '../../format'
import { post, standHeaders } from '../../request'
import { getIdmClient } from '../../settings'
import { createQueue } from './queue'
import type { SendAdapter } from './types'

const queue = createQueue()
let seq = 1

function encodeField(key: number, value: unknown) {
  if (value === undefined || value === null) return ''
  const str = String(value)
  const length = new Blob([str]).size
  return `${key}=${length}${length > 0 ? `:${str}` : ''}`
}

export const idmAdapter: SendAdapter = {
  send({ link, filename, filesize = 0, headers }) {
    return queue(async () => {
      const rpc = getIdmClient()
      const normalized = standHeaders(headers)
      const time = Date.now()
      const url = `http://127.0.0.1:1001/client/${rpc}?seq=${seq}`
      const headersText =
        Object.entries(normalized)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') + '\n'

      const fields = [
        encodeField(4, getExtension(filename)),
        encodeField(6, link),
        encodeField(7, location.origin),
        encodeField(11, headersText),
        encodeField(100, filename),
        encodeField(122, 4),
      ]

      const data = `MSG#${seq}#13#1#10241:${seq + 1000}:0:${time}:0:1:2:${filesize}:0,${fields.join(',')};`

      const timeout = new Promise<'timeout'>((resolve) =>
        setTimeout(() => resolve('timeout'), 15000),
      )
      const response = await Promise.race([post<string>(url, data, {}, 'text', false), timeout])

      if (response && response.endsWith(`${seq}:3;`)) {
        seq++
        return 'success' as const
      }

      return 'fail' as const
    })
  },
}
