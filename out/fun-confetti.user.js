"use strict";
// ==UserScript==
// @name         Confetti Skill
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/fun-confetti.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/fun-confetti.user.js
// @description  Use this `↑↑↓↓←→←→` sequence to trigger a confetti explosion.
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @require      ./utils.js
// @require      https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js
// @run-at       document-end
// @grant        none
// ==/UserScript==
$u.run(async () => {
    'use strict';
    const triggerSequences = '↑↑↓↓←→←→';
    const triggerLength = triggerSequences.length;
    const codeMapper = {
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
    };
    let keySequence = [];
    let clearSequenceHandler;
    document.addEventListener('keydown', (ev) => {
        clearTimeout(clearSequenceHandler);
        clearSequenceHandler = setTimeout(() => {
            keySequence = [];
        }, 500);
        keySequence.push(codeMapper[ev.code] || '-');
        keySequence = keySequence.slice(-triggerLength);
        if (keySequence.join('') === triggerSequences) {
            boom();
        }
    });
    function boom() {
        console.debug('Boom!!!');
        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }
        // @ts-ignore
        confetti({
            angle: randomInRange(55, 125),
            spread: randomInRange(50, 70),
            particleCount: randomInRange(50, 100),
            origin: { y: 0.6 },
        });
    }
});
