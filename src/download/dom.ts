export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstElementChild as T
}

export function addStyle(id: string, css: string) {
  const existing = document.getElementById(id)
  if (existing) {
    existing.textContent = css
    return existing
  }

  const style = document.createElement('style')
  style.id = id
  style.textContent = css
  const parent = document.head || document.documentElement || document.body
  parent?.append(style)
  return style
}

export function waitForKeyElements(
  selector: string,
  callback: (element: HTMLElement) => boolean | void,
  once = true,
) {
  const processed = new WeakSet<Element>()

  const run = () => {
    for (const element of document.querySelectorAll(selector)) {
      if (processed.has(element)) continue

      const done = callback(element as HTMLElement)
      if (done) {
        observer.disconnect()
        return
      }

      if (once) processed.add(element)
    }
  }

  const observer = new MutationObserver(run)
  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })

  run()

  return () => observer.disconnect()
}

export function iframeDownload(link: string) {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = link
  document.body.append(iframe)
  setTimeout(() => iframe.remove(), 5000)
}
