// ==UserScript==
// @name         Youtube Background
// @description  Youtube background player, port from https://github.com/alkisqwe/Youtube-Background
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/ytb-bg.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/ytb-bg.user.js
// @author       x.jerry.wang@gmail.com
// @match        https://*.youtube.com/*
// @match        https://*.youtube-nocookie.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run } from './utils'

run(async () => {
  const IS_YOUTUBE =
    window.location.hostname.search(/(?:^|.+\.)youtube\.com/) > -1 ||
    window.location.hostname.search(/(?:^|.+\.)youtube-nocookie\.com/) > -1
  const IS_MOBILE_YOUTUBE = window.location.hostname === 'm.youtube.com'
  const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE
  const IS_VIMEO = window.location.hostname.search(/(?:^|.+\.)vimeo\.com/) > -1

  const IS_ANDROID = window.navigator.userAgent.indexOf('Android') > -1

  // Page Visibility API
  if (IS_ANDROID || !IS_DESKTOP_YOUTUBE) {
    Object.defineProperties(document, {
      hidden: { value: false },
      visibilityState: { value: 'visible' },
    })
  }

  window.addEventListener(
    'visibilitychange',
    (evt) => evt.stopImmediatePropagation(),
    true,
  )

  // Fullscreen API
  if (IS_VIMEO) {
    window.addEventListener(
      'fullscreenchange',
      (evt) => evt.stopImmediatePropagation(),
      true,
    )
  }

  // User activity tracking
  if (IS_YOUTUBE) {
    loop(pressKey, 60 * 1000, 10 * 1000) // every minute +/- 10 seconds
  }

  function pressKey() {
    const key = 18
    sendKeyEvent('keydown', key)
    sendKeyEvent('keyup', key)
  }

  function sendKeyEvent(aEvent: string, aKey: number) {
    document.dispatchEvent(
      new KeyboardEvent(aEvent, {
        bubbles: true,
        cancelable: true,
        keyCode: aKey,
        which: aKey,
      }),
    )
  }

  function loop(aCallback: () => void, aDelay: number, aJitter: number) {
    const jitter = getRandomInt(-aJitter / 2, aJitter / 2)
    const delay = Math.max(aDelay + jitter, 0)

    window.setTimeout(() => {
      aCallback()
      loop(aCallback, aDelay, aJitter)
    }, delay)
  }

  function getRandomInt(aMin: number, aMax: number) {
    const min = Math.ceil(aMin)
    const max = Math.floor(aMax)
    return Math.floor(Math.random() * (max - min)) + min
  }
})
