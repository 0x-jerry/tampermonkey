import { post, standHeaders, toRequestHeaders } from '../../request'
import { getDefaultRpc } from '../../settings'
import { createQueue } from './queue'
import type { SendAdapter } from './types'

const queue = createQueue()

export const abdmAdapter: SendAdapter = {
  send({ link, filename, headers }) {
    return queue(async () => {
      const normalized = toRequestHeaders(standHeaders(headers))
      const rpc = getDefaultRpc('abdm')
      const url = `${rpc.domain}:${rpc.port}/add`

      const item: Record<string, unknown> = {
        link,
        headers: normalized,
        suggestedName: filename,
      }

      if (normalized.Referer) item.downloadPage = normalized.Referer

      const response = await post<string>(
        url,
        [item],
        { 'Content-Type': 'application/json;charset=UTF-8', 'X-Api-Key': rpc.key || '' },
        'text',
        false,
      )

      return String(response).trim() === 'OK' ? ('success' as const) : ('fail' as const)
    })
  },
}
