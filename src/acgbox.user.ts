// ==UserScript==
// @name         No redirect
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/acgbox.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/acgbox.user.js
// @description  try to save the world!
// @author       x.jerry.wang@gmail.com
// @match        https://www.acgbox.link/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=acgbox.link
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run } from './utils'

run(async () => {
  document
    .querySelectorAll<HTMLAnchorElement>('a[data-url]')
    .forEach((anchor) => {
      anchor.addEventListener('click', (evt) => {
        const url = anchor.dataset.url
        if (!url) {
          return
        }
        evt.preventDefault()
        window.open(url, '_blank')
      })
    })
})
