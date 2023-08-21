const initScript = `// ==UserScript==
// @name         Name
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to save the world!
// @author       Me
// @match        https://*.google.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  // Your code here...
})()
`

export default {
  Init: {
    prefix: 'GM_init',
    description: "Initialize GM script.",
    body: [initScript],
  },
}
