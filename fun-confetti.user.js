// ==UserScript==
// @name         Confetti Skill
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/fun-confetti.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/fun-confetti.user.js
// @description  Use this `↑↑↓↓←→←→` sequence to trigger a confetti explosion.
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @require      ./utils.js
// @require      https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'
  const triggerSequences = '↑↑↓↓←→←→'

  const triggerLength = triggerSequences.length

  const codeMapper = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }

  let keySequence = []

  let clearSequenceHandler

  document.addEventListener('keydown', (ev) => {
    clearTimeout(clearSequenceHandler)

    clearSequenceHandler = setTimeout(() => {
      keySequence = []
    }, 500)

    keySequence.push(codeMapper[ev.code] || '-')

    keySequence = keySequence.slice(-triggerLength)

    if (keySequence.join('') === triggerSequences) {
      boom()
    }
  })

  function boom() {
    console.debug('Boom!!!')
    /**
     * @type {HTMLCanvasElement}
     */
    let canvas = document.querySelector('#confetti')

    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.id = 'confetti'
      canvas.style.position = 'fixed'

      // canvas.style.top = '50%'
      // canvas.style.left = '50%'
      // canvas.style.transform = 'translate(-50%, -50%)'

      canvas.style.top = '0'
      canvas.style.left = '0'

      canvas.style.width = '100vw'
      canvas.style.height = '100vh'

      canvas.style.zIndex = '9999999'
      canvas.style.pointerEvents = 'none'
      document.body.appendChild(canvas)
    }

    // @ts-ignore
    const confetti = window.confetti.create(canvas, {
      resize: true,
    })

    confetti({
      particleCount: 100,
      spread: 160,
    })
  }
})
