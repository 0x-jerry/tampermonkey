// ==UserScript==
// @name         Toggle Theme
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @description  Very lightweight solution to toggle dark/light theme.
// @author       x.jerry.wang@gmail.com
// @match        https://*/**
// @match        http://*/**
// @require      ./utils.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

$u.run(async () => {
  'use strict'

  doEffect()

  function doEffect() {
    // @ts-ignore
    GM_addStyle(`
      html {
        filter: invert(1);
      }

      html img,
      html canvas,
      html svg {
        filter: invert(1);
      }
    `)
  }

  // Your code here...
})
