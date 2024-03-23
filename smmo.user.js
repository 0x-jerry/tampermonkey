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

  class RandomInterval {
    min = 100
    max = 10 * 1000

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
    constructor(fn) {
      this.#fn = fn
    }

    #handler = -1

    start() {
      this.#playing = true

      clearTimeout(this.#handler)

      this.#handler = window.setTimeout(() => {
        try {
          this.#fn()
          this.start()
        } catch (error) {
          console.error(error)
          this.stop()
        }
      }, this.#getTimeout())
    }

    #getTimeout() {
      const range = this.max - this.min
      return this.min + Math.random() * range
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
   *
   * @param {number} priority
   * @param {string[]} btnTexts
   */
  function createAction(name, priority, btnTexts) {
    /**
     * @type { import('./smmo.user.types').Action}
     */
    const action = {
      name,
      priority,
      check() {
        return btnTexts.some(
          (content) => getButtonByContent(content) || getElByContent(content, 'a'),
        )
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

  const timer = new RandomInterval(() => {
    const availableActions = page.actions.filter((n) => n.check())

    if (!availableActions.length) return

    const action = availableActions.reduce(
      (prev, cur) => (cur.priority > prev.priority ? cur : prev),
      availableActions[0],
    )

    action.action()

    console.log('exec action:', action.name)
  })

  timer.max = 4000

  timer.start()
})
