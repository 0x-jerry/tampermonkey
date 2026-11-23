import { post, standHeaders } from '../../request'
import { getDefaultRpc } from '../../settings'
import { createQueue } from './queue'
import type { SendAdapter } from './types'

const queue = createQueue()

export const aria2Adapter: SendAdapter = {
  send({ link, filename, headers }) {
    return queue(async () => {
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
  },
}
