import { css, defineHeader, registerMenuCommand, run, storage } from './utils'

defineHeader({
  name: 'Unlock Selection',
  version: '1.0.6',
  description: 'Unlock text selection',
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document-start',
  grants: ['GM_addStyle', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand'],
})

run(async () => {
  const storageKey = 'unlock-selection:enabled'
  let styleElement: HTMLElement | null = null

  const getMenuName = () => `Unlock Selection: ${storage.get(storageKey, false)}`

  registerMenuCommand(getMenuName, () => {
    const enabled = storage.get(storageKey, false)

    if (enabled) {
      styleElement = GM_addStyle(css`
        * {
          user-select: auto !important;
        }
      `)
    } else {
      styleElement?.remove()
      styleElement = null
    }
  })
})
