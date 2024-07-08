"use strict";
// ==UserScript==
// @name         Save the world
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/yunpan1.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/yunpan1.user.js
// @description  try to save the world!
// @author       x.jerry.wang@gmail.com
// @match        https://*.yunpan1.cc/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yunpan1.cc
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
$u.run(async () => {
    'use strict';
    const el = document.getElementById('secretCode');
    const container = el?.parentElement?.parentElement;
    if (container) {
        container.style.display = 'none';
    }
});
