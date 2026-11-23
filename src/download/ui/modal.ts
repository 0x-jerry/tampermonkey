import { el } from '../dom'

let modal: HTMLElement | null = null
let loadingEl: HTMLElement | null = null

export function plain(text: unknown) {
  return String(text ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function showModal(options: { title: string; body: string | Node }) {
  closeModal()

  modal = el(`<div class="nd-overlay netdisk-download">
    <div class="nd-modal">
      <div class="nd-modal-header">
        <h3 class="nd-modal-title"></h3>
        <button class="nd-close" type="button" aria-label="关闭">×</button>
      </div>
      <div class="nd-modal-body"></div>
    </div>
  </div>`)

  modal.querySelector('.nd-modal-title')!.textContent = options.title

  const body = modal.querySelector<HTMLElement>('.nd-modal-body')!
  if (typeof options.body === 'string') body.innerHTML = options.body
  else body.append(options.body)

  modal.querySelector('.nd-close')!.addEventListener('click', closeModal)
  modal.addEventListener('click', (event) => {
    event.stopPropagation()
    if (event.target === modal) closeModal()
  })

  document.body.append(modal)

  return modal
}

export function closeModal() {
  modal?.remove()
  modal = null
}

export const loading = {
  open(title = '获取中') {
    if (loadingEl) {
      loading.title(title)
      return
    }

    loadingEl = el(`<div class="nd-overlay nd-loading-overlay netdisk-download">
      <div class="nd-loading">
        <div class="nd-spinner"></div>
        <div class="nd-loading-title"></div>
        <div class="nd-loading-text"></div>
      </div>
    </div>`)

    loading.title(title)
    loading.update('请稍候...')
    document.body.append(loadingEl)
  },
  title(text: string) {
    const node = loadingEl?.querySelector('.nd-loading-title')
    if (node) node.textContent = plain(text)
  },
  update(text: string) {
    const node = loadingEl?.querySelector('.nd-loading-text')
    if (node) node.textContent = plain(text)
  },
  close() {
    loadingEl?.remove()
    loadingEl = null
  },
}

export function toast(text: string, type: 'info' | 'success' | 'error' = 'info') {
  const node = el(`<div class="nd-toast netdisk-download nd-toast-${type}"></div>`)
  node.textContent = plain(text)
  document.body.append(node)
  setTimeout(() => node.remove(), 4000)
}
