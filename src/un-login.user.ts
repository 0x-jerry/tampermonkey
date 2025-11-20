// ==UserScript==
// @name         Un Login
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @description  Auto close login dialog at some site, support zhihu.
// @author       x.jerry.wang@gmail.com
// @match        https://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run, stringMatcher, waitElement } from './utils'

run(() => {
  stringMatcher(location.href, [
    {
      test: /zhihu\.com/,
      handler: handleZhihuLogin,
    },
  ])

  async function handleZhihuLogin() {
    const el = await waitElement('.signFlowModal')

    const btn = el.querySelector<HTMLButtonElement>('.Modal-closeButton')

    btn?.click()

    console.debug('close login dialog successfully')
  }
})
