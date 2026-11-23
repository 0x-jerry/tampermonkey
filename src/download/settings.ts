import { defaultAbdmRpc } from './download/send-to/abdm'
import { defaultAria2Rpc } from './download/send-to/aria2'
import { defaultIdmRpc } from './download/send-to/idm'
import { gmStore } from './store'
import type { RpcConfig } from './types'

export type RpcKind = 'aria2' | 'abdm'

const rpcKeys: Record<RpcKind, string> = {
  aria2: 'setting_aria2_rpc',
  abdm: 'setting_abdm_rpc',
}

// 惰性取值，避免与 send-to 适配器循环引用时读到未初始化的默认值
function rpcDefault(kind: RpcKind) {
  return kind === 'aria2' ? defaultAria2Rpc : defaultAbdmRpc
}

function normalizeRpcList(raw: unknown, fallback: RpcConfig): RpcConfig[] {
  let list: unknown = raw

  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw)
    } catch {
      list = null
    }
  }

  if (Array.isArray(list)) {
    const items = list.filter((item): item is RpcConfig => !!item && typeof item === 'object')
    if (items.length) return items
  } else if (list && typeof list === 'object') {
    return [list as RpcConfig]
  }

  return [{ ...fallback }]
}

export function getRpcList(kind: RpcKind) {
  return normalizeRpcList(gmStore.get(rpcKeys[kind], [rpcDefault(kind)]), rpcDefault(kind))
}

export function saveRpcList(kind: RpcKind, list: RpcConfig[]) {
  gmStore.set(rpcKeys[kind], list)
}

export function getDefaultRpc(kind: RpcKind) {
  const list = getRpcList(kind)
  return list.find((item) => item.default) || list[0] || { ...rpcDefault(kind) }
}

export function getIdmClient() {
  const value = gmStore.get('setting_idm_rpc', defaultIdmRpc)
  return String(value || defaultIdmRpc)
}

export function setIdmClient(value: string) {
  gmStore.set('setting_idm_rpc', value)
}
