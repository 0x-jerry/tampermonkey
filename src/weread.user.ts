// ==UserScript==
// @name         WeRead Solarized Theme
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/weread.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/weread.user.js
// @description  Change the theme of WeRead
// @author       x.jerry.wang@gmail.com
// @match        https://weread.qq.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=weread.qq.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'

  $u.addStyle(`
    .readerTopBar,
    .readerChapterContent_container {
      background-color: #eee8d5 !important;
    }
    
    .readerCatalog,
    .readerAIChatPanel,
    .readerNotePanel,
    .font-panel-content,
    .readerControls_item,
    .readerChapterContent  {
      background-color: #fdf6e3 !important;
    }
  `)
})
