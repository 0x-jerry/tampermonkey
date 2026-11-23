import { isType } from './format'

export function findReact(dom: Element | null, traverseUp = 0): any {
  if (!dom) return null

  const key = Object.keys(dom).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'),
  )
  if (!key) return null

  const domFiber = (dom as any)[key]
  if (domFiber == null) return null

  if (domFiber._currentElement) {
    let compFiber = domFiber._currentElement._owner
    for (let i = 0; i < traverseUp; i++) compFiber = compFiber._currentElement._owner
    return compFiber._instance
  }

  const getCompFiber = (fiber: any) => {
    let parentFiber = fiber.return
    while (isType(parentFiber?.type) === 'string') parentFiber = parentFiber.return
    return parentFiber
  }

  let compFiber = getCompFiber(domFiber)
  for (let i = 0; i < traverseUp; i++) compFiber = getCompFiber(compFiber)

  return compFiber?.stateNode || compFiber
}

export function getVueComponents(rootElement: Element | null): any[] {
  if (!rootElement) return []

  const vueAppHost = (rootElement as any).__vue_app__
    ? rootElement
    : rootElement.querySelector?.('[data-v-app]')
  const app = (vueAppHost as any)?.__vue_app__

  if (app) {
    const rootVNode = app._container?._vnode || app._vnode
    const rootComponent = rootVNode?.component || app._instance
    const out: any[] = []
    const seen = new Set<any>()

    const walk = (vnode: any) => {
      if (!vnode || typeof vnode !== 'object' || seen.has(vnode)) return
      seen.add(vnode)
      if (vnode.component) {
        out.push(vnode.component)
        walk(vnode.component.subTree)
      }
      if (Array.isArray(vnode.children)) vnode.children.forEach(walk)
      if (vnode.suspense) walk(vnode.suspense)
      if (Array.isArray(vnode.dynamicChildren)) vnode.dynamicChildren.forEach(walk)
    }

    if (rootComponent) {
      out.push(rootComponent)
      walk(rootComponent.subTree)
    } else if (rootVNode) {
      walk(rootVNode)
    }

    return out
  }

  const rootVm = (rootElement as any).__vue__
  if (rootVm) {
    const out: any[] = []
    const walk = (vm: any) => {
      if (!vm) return
      out.push(vm)
      ;(vm.$children || []).forEach(walk)
    }
    walk(rootVm)
    return out
  }

  return []
}

export function findVueComponent(
  names: string | string[],
  rootElement: Element | null,
  multiple = false,
): any {
  const matched = getVueComponents(rootElement).filter((component) => {
    const type = component.type
    const name =
      (type && (type.name || type.__name)) || (component.$options && component.$options.name) || ''
    return Array.isArray(names) ? names.includes(name) : name === names
  })

  return multiple ? matched : matched[0]
}
