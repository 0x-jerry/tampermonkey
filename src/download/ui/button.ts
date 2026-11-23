import { methodLabels, startDownload } from '../download'
import { el, waitForKeyElements } from '../dom'
import type { DownloadMode, Provider } from '../types'
import { openSettings } from './settings'

function createButton(onSelect: (mode: DownloadMode) => void) {
  ensureGlobalCloseListener()

  const wrap = el(`<div class="nd-button-wrap netdisk-download">
    <button class="nd-trigger" type="button">下载助手</button>
    <ul class="nd-menu"></ul>
  </div>`)

  const menu = wrap.querySelector<HTMLElement>('.nd-menu')!
  for (const mode of Object.keys(methodLabels) as DownloadMode[]) {
    const item = el(`<li class="nd-menu-item"></li>`)
    item.dataset.mode = mode
    item.textContent = methodLabels[mode]
    menu.append(item)
  }

  const separator = el(`<li class="nd-menu-sep"></li>`)
  const settings = el(`<li class="nd-menu-item"></li>`)
  settings.dataset.settings = '1'
  settings.textContent = '设置'
  menu.append(separator, settings)

  wrap.querySelector('.nd-trigger')!.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    wrap.classList.toggle('open')
  })

  menu.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-mode], [data-settings]',
    )
    if (!target) return

    wrap.classList.remove('open')

    if (target.dataset.settings) openSettings()
    else onSelect(target.dataset.mode as DownloadMode)
  })

  return wrap
}

let globalCloseBound = false

function ensureGlobalCloseListener() {
  if (globalCloseBound) return
  globalCloseBound = true

  document.addEventListener('click', (event) => {
    for (const wrap of document.querySelectorAll('.nd-button-wrap.open')) {
      if (!wrap.contains(event.target as Node)) wrap.classList.remove('open')
    }
  })
}

export function mountProviderButton(provider: Provider, mounts: string[]) {
  for (const selector of mounts) {
    waitForKeyElements(
      selector,
      (element) => {
        if (document.querySelector('.nd-button-wrap')) return
        if (element.querySelector(':scope > .nd-button-wrap')) return

        element.prepend(createButton((mode) => startDownload(provider, mode)))
      },
      false,
    )
  }
}
