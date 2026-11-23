export async function setClipboard(text: string) {
  text = String(text)

  if (typeof GM_setClipboard === 'function') {
    try {
      GM_setClipboard(text, 'text')
      return true
    } catch {}
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {}
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    if (ok) return true
  } catch {}

  return false
}
