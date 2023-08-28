// ==UserScript==
// @name         Un Login
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/un-login.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/un-login.user.js
// @description  Try to save the time, auto close login dialog at some site, support zhihu.
// @author       x.jerry.wang@gmail.com
// @match        https://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

/**
 * Define how to close login dialog
 */
const configs = [
  {
    matcher: /zhihu\.com/,
    handler: handleZhihuLogin,
  },
]

;(async function () {
  'use strict'

  console.debug('Un login loaded!')

  const handler = getHandler()
  await sleep(100)

  handler?.()
})()

function getHandler() {
  const url = location.href

  for (const conf of configs) {
    if (conf.matcher.test(url)) {
      console.debug('matched config', conf.matcher)
      return conf.handler
    }
  }
}

async function handleZhihuLogin() {
  const el = await waitElement('.signFlowModal')
  el.querySelector('.Modal-closeButton').click()
  console.debug('close login dialog successfully')
}

// ---------- utils ---------

/**
 * 
 * @param {string} selector 
 */
async function waitElement(selector) {
  while (true) {
    const el = document.querySelector(selector)

    if (el) return el

    await sleep(100)
  }
}

function sleep(ts = 100) {
  return new Promise((resolve) => setTimeout(resolve, ts))
}
