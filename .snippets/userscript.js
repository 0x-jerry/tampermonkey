const initScript = `// ==UserScript==
// @name         Save the world
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/x.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/x.user.js
// @description  try to save the world!
// @author       x.jerry.wang@gmail.com
// @match        https://*.google.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run } from './utils'

run(async () => {
  // Your code here...
})
`

export default {
  Init: {
    prefix: 'GM_init',
    description: "Initialize GM script.",
    body: [initScript],
  },
}
