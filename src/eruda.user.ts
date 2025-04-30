// ==UserScript==
// @name         Eruda devtool
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @description  Eruda devtool for mobile browser
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'

  // const script = document.createElement
  const script = $u.tag('script', { src: 'https://cdn.jsdelivr.net/npm/eruda' })
  document.body.appendChild(script)
  const eruda = await $u.when(() => (window as any).eruda, 10 * 1000)
  eruda.init();
})
