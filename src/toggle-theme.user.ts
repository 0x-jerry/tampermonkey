import { defineHeader, registerMenuCommand, run, storage } from './utils'

defineHeader({
  name: 'Toggle Theme',
  version: '1.1.7',
  description: 'Very lightweight solution to toggle dark/light theme.',
  matches: ['https://*/**', 'http://*/**'],
  grants: ['GM_addStyle', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand'],
  runAt: 'document-start',
})

run(async () => {
  'use strict'

  const storageKey = 'toggle-theme:enabled'
  let styleElement: HTMLElement | null = null

  const getMenuName = () => `Toggle Theme: ${storage.get(storageKey, false)}`

  registerMenuCommand(getMenuName, toggleTheme)

  doEffect()

  function toggleTheme() {
    const enabled = storage.get(storageKey, false)
    storage.set(storageKey, !enabled)

    doEffect()
  }

  function doEffect() {
    const enabled = storage.get(storageKey, false)

    styleElement?.remove()
    styleElement = null

    if (!enabled) {
      return
    }

    styleElement = GM_addStyle(`
      html {
        filter: invert(1);
      }

      html img,
      html iframe,
      html canvas,
      html video,
      html svg {
        filter: invert(1);
      }
    `)
  }
})
