"use strict";
// ==UserScript==
// @name         Un Login
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @description  Auto close login dialog at some site, support zhihu.
// @author       x.jerry.wang@gmail.com
// @match        https://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
$u.run(() => {
    $u.stringMatcher(location.href, [
        {
            test: /zhihu\.com/,
            handler: handleZhihuLogin,
        },
    ]);
    async function handleZhihuLogin() {
        const el = await $u.waitElement('.signFlowModal');
        const btn = el.querySelector('.Modal-closeButton');
        btn?.click();
        console.debug('close login dialog successfully');
    }
});
