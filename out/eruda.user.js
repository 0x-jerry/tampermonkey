"use strict";
// ==UserScript==
// @name         Eruda devtool
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/eruda.user.js
// @description  Eruda devtool for mobile browser
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @require      ./utils.js
// @require      ../libs/eruda-v3.4.1.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
$u.run(async () => {
    'use strict';
    const eruda = await $u.when(() => window.eruda, 10 * 1000);
    eruda.init();
});
