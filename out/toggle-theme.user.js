"use strict";
// ==UserScript==
// @name         Toggle Theme
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @description  Very lightweight solution to toggle dark/light theme. Open devtools, find `button[data-toggle-theme=1]`, then trigger it's click event.
// @author       x.jerry.wang@gmail.com
// @match        https://*/**
// @match        http://*/**
// @require      ./utils.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==
$u.run(async () => {
    'use strict';
    const toggleButton = document.createElement('button');
    toggleButton.style.display = 'none';
    toggleButton.setAttribute('data-toggle-theme', '1');
    document.body.append(toggleButton);
    const enabledKey = '__0x_jerry_tampermonkey_toggle_theme__';
    toggleButton.onclick = () => {
        const value = localStorage.getItem(enabledKey);
        const toggleValue = value === '1' ? '0' : '1';
        localStorage.setItem(enabledKey, toggleValue);
        doEffect();
    };
    doEffect();
    function doEffect() {
        const value = localStorage.getItem(enabledKey);
        if (value !== '1') {
            return;
        }
        // @ts-ignore
        GM_addStyle(`
      html {
        filter: invert(1);
      }

      html img,
      html svg {
        filter: invert(1);
      }
    `);
    }
    // Your code here...
});
