import { abdmAdapter } from './abdm'
import { aria2Adapter } from './aria2'
import { idmAdapter } from './idm'
import type { SendAdapter, SendRequest, SendTarget } from './types'

const adapters: Record<SendTarget, SendAdapter> = {
  idm: idmAdapter,
  aria2: aria2Adapter,
  abdm: abdmAdapter,
}

export function sendTo(target: SendTarget, request: SendRequest) {
  return adapters[target].send(request)
}
