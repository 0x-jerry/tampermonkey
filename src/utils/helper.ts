export function css(
  template: { raw: readonly string[] | ArrayLike<string> },
  ...substitutions: any[]
) {
  return String.raw(template, ...substitutions)
}

export function html(
  template: { raw: readonly string[] | ArrayLike<string> },
  ...substitutions: any[]
) {
  const doc = document.createDocumentFragment()
  const div = document.createElement('div')
  div.innerHTML = String.raw(template, ...substitutions)
  doc.append(...div.childNodes)

  return doc
}

interface StyleVariableDeclaration {
  [key: `--${string}`]: string | number | null
}

export function applyStyle(
  el: HTMLElement,
  style: Partial<CSSStyleDeclaration & StyleVariableDeclaration>,
) {
  for (const key in style) {
    const val = Reflect.get(style, key)
    el.style.setProperty(key, val)
  }
}
