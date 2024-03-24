// ==UserScript==
// @name         Simple MMO
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/smmo.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/smmo.user.js
// @description  try to save the simple mmo world!
// @author       x.jerry.wang@gmail.com
// @match        https://web.simple-mmo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=simple-mmo.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'

  class AwaitedInterval {
    timeout = 100

    #playing = false

    get playing() {
      return this.#playing
    }

    /**
     * @type {() => any}
     */
    #fn

    /**
     * @param {() => any} fn
     */
    constructor(fn, timeout = 100) {
      this.timeout = timeout
      this.#fn = fn
    }

    #handler = -1

    start() {
      this.#playing = true

      clearTimeout(this.#handler)

      this.#handler = window.setTimeout(async () => {
        try {
          await this.#fn()
          this.start()
        } catch (error) {
          console.error(error)
          this.stop()
        }
      }, this.timeout)
    }

    stop() {
      this.#playing = false
      clearTimeout(this.#handler)
    }
  }

  // -------

  const currentPage = new URL(location.href)

  /**
   *
   * @param {HTMLElement} el
   */
  function isVisible(el) {
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  /**
   *
   * @param {string} text
   * @param {string} type
   * @returns {HTMLElement | undefined}
   */
  const getElByContent = (text, type) => {
    const elements = Array.from(document.querySelectorAll(type))
    // @ts-ignore
    return elements.find((n) => isVisible(n) && n.textContent.trim() === text)
  }

  /**
   *
   * @param {string} text
   * @returns  {HTMLButtonElement | undefined}
   */
  // @ts-ignore
  const getButtonByContent = (text) => getElByContent(text, 'button')

  const actions = {
    verify: {
      name: 'Verify',
      priority: Infinity,
      check() {
        return !!getElByContent("I'm a person! Promise!", 'a')
      },
      action() {
        throw new Error('Detected verify action, stopped!')
      },
    },
    takeStep: {
      name: 'Take A Step',
      priority: 99,
      check() {
        return getButtonByContent('Take a step')?.disabled !== true
      },
      action() {
        return getButtonByContent('Take a step')?.click()
      },
    },
    craft: createAction('Craft', 999, ['Salvage', 'Catch', 'Grab', 'Attack', 'Mine']),

    gather: createAction('Gather', 99, ['Gather', 'Press here to gather']),
    endGather: createAction('End gather', 999, ['Press here to close']),

    attack: createAction('Attack', 99, ['Attack']),
    endAttack: createAction('End Attack', 999, ['End Battle']),
  }

  /**
   * @param {number} priority
   * @param {string[]} btnTexts
   * @param {string} name
   */
  function createAction(name, priority, btnTexts) {
    /**
     * @type { import('./smmo.user.types').Action}
     */
    const action = {
      name,
      priority,
      check() {
        return btnTexts.some((content) => {
          const btn = getButtonByContent(content)
          const link = getElByContent(content, 'a')

          return btn ? btn.disabled !== true : link
        })
      },
      action() {
        return btnTexts.some((content) => {
          const el = getButtonByContent(content) || getElByContent(content, 'a')
          el?.click()
          return el
        })
      },
    }

    return action
  }

  /**
   * @type {import('./smmo.user.types').Page}
   */
  const travelPage = {
    check() {
      return currentPage.pathname === '/travel'
    },
    actions: [actions.verify, actions.takeStep, actions.craft],
  }

  /**
   * @type {import('./smmo.user.types').Page}
   */
  const attackPage = {
    check() {
      return currentPage.pathname.startsWith('/npcs/attack/')
    },
    actions: [actions.verify, actions.attack, actions.endAttack],
  }

  /**
   * @type {import('./smmo.user.types').Page}
   */
  const craftItemPage = {
    check() {
      return currentPage.pathname.startsWith('/crafting/material/gather/')
    },
    actions: [actions.verify, actions.gather, actions.endGather],
  }

  const pages = [travelPage, attackPage, craftItemPage]

  const page = pages.find((n) => n.check())
  if (!page) {
    return
  }

  async function checkLoop() {
    const availableActions = page.actions.filter((n) => n.check())

    if (!availableActions.length) return

    const action = availableActions.reduce(
      (prev, cur) => (cur.priority > prev.priority ? cur : prev),
      availableActions[0],
    )

    await $u.sleepRandom(500, 1200)
    action.action()

    console.log('exec action:', action.name)
  }

  const timer = new AwaitedInterval(checkLoop)

  timer.start()

  // ---- ui
  const $c = document.createElement('div')
  $c.style.position = 'fixed'
  $c.style.top = '50%'
  $c.style.right = '0'
  $c.style.transform = 'translate(0, -50%)'
  $c.style.background = 'white'
  $c.style.border = '1px solid #eee'
  $c.style.padding = '20px'
  document.body.append($c)

  const $enableBtn = document.createElement('button')
  $c.append($enableBtn)
  $enableBtn.textContent = 'Enabled'
  $enableBtn.onclick = () => {
    if (timer.playing) {
      timer.stop()
      $enableBtn.textContent = 'Disabled'
    } else {
      timer.start()
      $enableBtn.textContent = 'Enabled'
    }
  }
})
