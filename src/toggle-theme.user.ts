import { defineHeader, run, storage } from './utils'

export const config = defineHeader({
  name: 'Toggle Theme',
  version: '1.1.3',
  description: 'Very lightweight solution to toggle dark/light theme.',
  matches: ['https://*/**', 'http://*/**'],
  grants: ['GM_addStyle', 'GM_registerMenuCommand'],
  runAt: 'document-end',
})

run(async () => {
  'use strict'

  const storageKey = 'toggle-theme:enabled'
  let styleElement: HTMLElement | null = null

  GM_registerMenuCommand('Toggle Theme', () => {
    toggleTheme()
  })

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
