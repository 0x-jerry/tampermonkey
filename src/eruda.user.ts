// ==UserScript==
// @name         Eruda devtool
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @description  Eruda devtool for mobile browser
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run } from './utils'

run(async () => {

  const eruda = (await import('eruda')).default

  eruda.init({
    useShadowDom: true,
    tool: ['console', 'elements', 'info'],
  })
})
