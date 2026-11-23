import { setClipboard } from '../clipboard'
import { methodLabels } from '../config'
import { context } from '../context'
import { iframeDownload, el } from '../dom'
import { sizeFormat } from '../format'
import type { DownloadMode, DownloadResult, Provider } from '../types'
import { loading, plain, showModal, toast } from '../ui/modal'
import { toAria2, toBitcomet, toCurl } from './convert'
import { sendToAbdm, sendToAria2, sendToIdm } from './send-to'

export async function startDownload(provider: Provider, mode: DownloadMode) {
  context.page = provider.detectPage()
  loading.open('获取中')

  try {
    const result = await provider.getLink()
    loading.close()
    renderDownloads(result, mode)
  } catch (error) {
    loading.close()
    toast(errorText(error), 'error')
    console.error('[netdisk-download]', error)
  }
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message || String(error)
  if (typeof error === 'string') return error

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function renderDownloads(result: DownloadResult, mode: DownloadMode) {
  const body = document.createElement('div')
  const list = document.createElement('div')
  body.append(list)

  const allLinks: string[] = []

  result.files.forEach((file, index) => {
    if (result.get.dir(file)) return

    const name = result.get.name(file)
    const size = result.get.size(file)
    const link = result.get.link(file)
    const item = el(`<div class="nd-item" data-index="${index}"></div>`)
    const title = el(`<div class="nd-name"></div>`)
    title.append(document.createTextNode(name))

    const sizeNode = el(`<span class="nd-size"></span>`)
    sizeNode.textContent = sizeFormat(size)
    title.append(sizeNode)
    item.append(title)

    if (!link || !link.includes('http')) {
      const message = el(`<div class="nd-message"></div>`)
      message.textContent = link || '获取下载地址失败，刷新网页后再试试吧~'
      item.append(message)
      list.append(item)
      return
    }

    allLinks.push(link)

    const actions = el(`<div class="nd-actions"></div>`)
    const addButton = (label: string, action: string, className = '') => {
      const button = el(`<button type="button" class="nd-btn ${className}"></button>`)
      button.textContent = label
      button.dataset.action = action
      actions.append(button)
    }

    if (mode === 'api') {
      addButton('直接下载', 'download', 'nd-primary')
      addButton('复制地址', 'copy-link')
      addButton('复制名称', 'copy-name')
      addButton('推送至 IDM', 'send-idm')
    } else if (mode === 'curl') {
      const command = toCurl(link, name, result.headers)
      const code = el(`<pre class="nd-code"></pre>`)
      code.textContent = command
      item.append(code)
      addButton('复制命令', 'copy-curl')
    } else if (mode === 'aria2') {
      const command = toAria2(link, name, result.headers)
      addButton('推送至 Aria2', 'send-aria2')
      addButton('复制命令', 'copy-aria2')
      const code = el(`<pre class="nd-code"></pre>`)
      code.textContent = command
      item.append(code)
    } else if (mode === 'bitcomet') {
      const command = toBitcomet(link, name, result.headers)
      const code = el(`<pre class="nd-code"></pre>`)
      code.textContent = command
      item.append(code)
      addButton('复制 BC 地址', 'copy-bitcomet')
    } else if (mode === 'abdm') {
      addButton('推送至 ABDM', 'send-abdm')
    }

    item.append(actions)
    list.append(item)
  })

  const footer = el(`<div class="nd-footer"></div>`)
  const copyAll = el(`<button type="button" class="nd-btn"></button>`)
  copyAll.textContent = '复制全部地址'
  copyAll.dataset.action = 'copy-all'
  footer.append(copyAll)
  body.append(footer)

  const overlay = showModal({ title: methodLabels[mode], body })

  overlay.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!target) return

    const action = target.dataset.action
    const item = target.closest<HTMLElement>('.nd-item')
    const index = Number(item?.dataset.index ?? -1)
    const file = result.files[index]
    const link = file ? result.get.link(file) : ''
    const name = file ? result.get.name(file) : ''
    const size = file ? result.get.size(file) : 0

    switch (action) {
      case 'download':
        if (link) iframeDownload(link)
        break
      case 'copy-link':
        if (link) await copyWithFeedback(target, link)
        break
      case 'copy-name':
        if (name) await copyWithFeedback(target, name)
        break
      case 'copy-curl':
        if (link) await copyWithFeedback(target, toCurl(link, name, result.headers))
        break
      case 'copy-aria2':
        if (link) await copyWithFeedback(target, toAria2(link, name, result.headers))
        break
      case 'copy-bitcomet':
        if (link) await copyWithFeedback(target, toBitcomet(link, name, result.headers))
        break
      case 'copy-all':
        if (allLinks.length) await copyWithFeedback(target, allLinks.join('\r\n'))
        break
      case 'send-idm':
        if (link) await sendWithFeedback(target, () => sendToIdm(link, name, size, result.headers))
        break
      case 'send-aria2':
        if (link) await sendWithFeedback(target, () => sendToAria2(link, name, result.headers))
        break
      case 'send-abdm':
        if (link) await sendWithFeedback(target, () => sendToAbdm(link, name, result.headers))
        break
    }
  })
}

async function copyWithFeedback(button: HTMLElement, text: string) {
  const original = button.textContent || ''
  const ok = await setClipboard(text)

  button.textContent = ok ? '复制成功' : '复制失败'
  button.classList.add(ok ? 'nd-success' : 'nd-danger')

  setTimeout(() => {
    button.textContent = original
    button.classList.remove('nd-success', 'nd-danger')
  }, 1500)
}

async function sendWithFeedback(button: HTMLElement, action: () => Promise<string>) {
  if (button.dataset.busy) return

  const original = button.textContent || ''
  button.dataset.busy = '1'
  button.textContent = '发送中...'

  try {
    const result = await action()
    const ok = result === 'success'
    button.textContent = ok ? '发送成功' : '发送失败'
    button.classList.add(ok ? 'nd-success' : 'nd-danger')
    toast(ok ? '发送成功' : '发送失败，请检查下载器配置', ok ? 'success' : 'error')
  } catch (error) {
    button.textContent = '发送失败'
    button.classList.add('nd-danger')
    toast(plain(errorText(error)), 'error')
  } finally {
    setTimeout(() => {
      button.textContent = original
      button.classList.remove('nd-success', 'nd-danger')
      delete button.dataset.busy
    }, 1800)
  }
}
