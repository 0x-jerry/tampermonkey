// ==UserScript==
// @name         Unlock Selection
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/unlock-selection.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/unlock-selection.user.js
// @description  Unlock text selection
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @match        http://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { injectStyle, run } from './utils'

run(async () => {
  injectStyle(`
    * {
      user-select: auto !important;
    }
  `)
})
