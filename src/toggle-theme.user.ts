// ==UserScript==
// @name         Toggle Theme
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @description  Very lightweight solution to toggle dark/light theme.
// @author       x.jerry.wang@gmail.com
// @match        https://*/**
// @match        http://*/**
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

import { run, storage } from './utils'

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
