import { defaultAbdmRpc } from '../download/send-to/abdm'
import { defaultAria2Rpc } from '../download/send-to/aria2'
import { el } from '../dom'
import {
  getIdmClient,
  getRpcList,
  saveRpcList,
  setIdmClient,
  type RpcKind,
} from '../settings'
import type { RpcConfig } from '../types'
import { closeModal, showModal, toast } from './modal'

interface RpcField {
  key: keyof RpcConfig
  label: string
  placeholder?: string
}

const rpcFields: Record<RpcKind, RpcField[]> = {
  aria2: [
    { key: 'domain', label: '地址', placeholder: 'http://localhost' },
    { key: 'port', label: '端口', placeholder: '6800' },
    { key: 'path', label: '路径', placeholder: '/jsonrpc' },
    { key: 'token', label: 'Token', placeholder: '可选' },
    { key: 'dir', label: '下载目录', placeholder: '可选，留空使用默认目录' },
  ],
  abdm: [
    { key: 'domain', label: '地址', placeholder: 'http://localhost' },
    { key: 'port', label: '端口', placeholder: '15151' },
    { key: 'key', label: 'API Key', placeholder: '可选' },
  ],
}

const rpcTitles: Record<RpcKind, string> = {
  aria2: 'Aria2 RPC',
  abdm: 'ABDM RPC',
}

const rpcDefaults: Record<RpcKind, RpcConfig> = {
  aria2: defaultAria2Rpc,
  abdm: defaultAbdmRpc,
}

function textInput(value: unknown, placeholder = '') {
  const input = el<HTMLInputElement>('<input class="nd-input" type="text">')
  input.value = value === undefined || value === null ? '' : String(value)
  input.placeholder = placeholder
  return input
}

function labeled(label: string, input: HTMLElement) {
  const field = el('<label class="nd-field"></label>')
  const text = el('<span></span>')
  text.textContent = label
  field.append(text, input)
  return field
}

function createRpcRow(kind: RpcKind, config: RpcConfig) {
  const row = el('<div class="nd-rpc"></div>')
  const head = el('<div class="nd-rpc-head"></div>')
  const defaultLabel = el('<label class="nd-radio"></label>')
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.name = `nd-default-${kind}`
  radio.checked = !!config.default
  defaultLabel.append(radio, document.createTextNode('默认'))

  const remove = el('<button type="button" class="nd-btn nd-danger">删除</button>')
  remove.dataset.remove = '1'
  head.append(defaultLabel, remove)

  const grid = el('<div class="nd-grid"></div>')
  for (const field of rpcFields[kind]) {
    const input = textInput(config[field.key], field.placeholder)
    input.dataset.key = field.key
    grid.append(labeled(field.label, input))
  }

  row.append(head, grid)
  return row
}

function createRpcSection(kind: RpcKind) {
  const section = el('<section class="nd-section"></section>')
  const head = el('<div class="nd-section-head"></div>')
  const title = el('<h4></h4>')
  title.textContent = rpcTitles[kind]

  const add = el('<button type="button" class="nd-btn">添加</button>')
  head.append(title, add)

  const list = el('<div class="nd-rpc-list"></div>')
  list.dataset.kind = kind

  const configs = getRpcList(kind)
  if (!configs.some((config) => config.default)) configs[0].default = true
  configs.forEach((config) => list.append(createRpcRow(kind, config)))

  add.addEventListener('click', () => {
    list.append(createRpcRow(kind, { ...rpcDefaults[kind], default: false }))
  })

  list.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-remove]')
    if (!button) return

    if (list.querySelectorAll('.nd-rpc').length <= 1) {
      toast('至少保留一个 RPC 配置', 'info')
      return
    }

    const row = button.closest('.nd-rpc')!
    const wasDefault = !!row.querySelector<HTMLInputElement>('input[type=radio]')?.checked
    row.remove()

    if (wasDefault) {
      const next = list.querySelector<HTMLInputElement>('input[type=radio]')
      if (next) next.checked = true
    }
  })

  section.append(head, list)
  return { section, list }
}

function readRpcList(kind: RpcKind, list: HTMLElement) {
  const configs: RpcConfig[] = []

  for (const row of list.querySelectorAll<HTMLElement>('.nd-rpc')) {
    const config: any = { path: '' }

    for (const field of rpcFields[kind]) {
      const input = row.querySelector<HTMLInputElement>(`[data-key="${field.key}"]`)
      config[field.key] = input?.value.trim() || ''
    }

    config.default = !!row.querySelector<HTMLInputElement>('input[type=radio]')?.checked
    configs.push(config as RpcConfig)
  }

  if (configs.length === 0) throw new Error('请至少添加一个 RPC 配置')

  configs.forEach((config, index) => {
    const name = `${rpcTitles[kind]} 第 ${index + 1} 项`
    const port = Number(config.port)

    if (!config.domain) throw new Error(`${name}：请填写地址`)
    if (!/^\d+$/.test(config.port) || port < 1 || port > 65535) {
      throw new Error(`${name}：端口应为 1-65535`)
    }
    if (kind === 'aria2' && !config.path) throw new Error(`${name}：请填写路径`)

    if (!/^https?:\/\//i.test(config.domain)) config.domain = `http://${config.domain}`
    config.domain = config.domain.replace(/\/+$/, '')
    if (config.path && !config.path.startsWith('/')) config.path = `/${config.path}`
  })

  if (!configs.some((config) => config.default)) configs[0].default = true
  return configs
}

export function openSettings() {
  const body = el('<div class="nd-settings"></div>')
  const general = el('<section class="nd-section"></section>')
  const generalTitle = el('<h4>通用</h4>')

  const idm = textInput(getIdmClient(), '1')

  const grid = el('<div class="nd-grid"></div>')
  grid.append(labeled('IDM 客户端编号', idm))
  general.append(generalTitle, grid)

  const aria2 = createRpcSection('aria2')
  const abdm = createRpcSection('abdm')

  const footer = el('<div class="nd-settings-footer"></div>')
  const errorNode = el('<div class="nd-settings-error"></div>')
  const cancel = el('<button type="button" class="nd-btn">取消</button>')
  const save = el('<button type="button" class="nd-btn nd-primary">保存</button>')
  footer.append(errorNode, cancel, save)

  body.append(general, aria2.section, abdm.section, footer)

  showModal({ title: '下载设置', body })

  cancel.addEventListener('click', closeModal)

  save.addEventListener('click', () => {
    try {
      const aria2List = readRpcList('aria2', aria2.list)
      const abdmList = readRpcList('abdm', abdm.list)

      saveRpcList('aria2', aria2List)
      saveRpcList('abdm', abdmList)
      setIdmClient(idm.value.trim() || '1')

      closeModal()
      toast('设置已保存', 'success')
    } catch (error) {
      errorNode.textContent = error instanceof Error ? error.message : String(error)
    }
  })
}
