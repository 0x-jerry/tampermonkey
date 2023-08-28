const initScript = `// ==UserScript==
// @name         Name
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/un-login.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/un-login.user.js
// @description  try to save the world!
// @author       x.jerry.wang@gmail.com
// @match        https://*.google.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'

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
