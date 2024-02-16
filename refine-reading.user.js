// ==UserScript==
// @name         Refine Reading
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/refine-reading.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/refine-reading.user.js
// @description  Refine style of hetushu.com
// @author       x.jerry.wang@gmail.com
// @match        https://*.hetushu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hetushu.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(() => {
  $u.stringMatcher(location.href, [
    {
      test: /hetushu\.com/,
      handler: injectStyle,
    },
  ])

  async function injectStyle() {
    const $style = document.createElement('style')
    const css = String.raw

    $style.innerHTML = css`
      body {
        display: flex;
      }
      #left {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 1;
      }

      #left * {
        display: none !important;
      }

      #left .quit {
        display: block !important;
      }

      #right {
        position: fixed;
        right: 0;
        width: 100px;
      }
      #center {
        flex: 1;
      }
    `
    document.body.append($style)
  }
})
