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

  class MimicAgent {
    #playing = false

    get playing() {
      return this.#playing
    }

    /**
     * @type {import('./smmo.user.types').Action[]}
     */
    actions = []

    #handler = -1

    detectAction() {
      const actions = this.actions.filter((n) => n.check())
      if (!actions.length) return null

      const action = actions.reduce((pre, cur) => (cur.priority > pre.priority ? cur : pre))

      return action
    }

    async doze() {
      const thinkChanceList = [
        {
          chance: 5,
          data: { min: 200, max: 500 },
        },
        {
          chance: 40,
          data: { min: 500, max: 1000 },
        },
        {
          chance: 40,
          data: { min: 1000, max: 2000 },
        },
        {
          chance: 10,
          data: { min: 2000, max: 4000 },
        },
        {
          chance: 5,
          data: { min: 4000, max: 10000 },
        },
      ]

      const data = this.throwTheDice(thinkChanceList)

      await $u.sleepRandom(data.min, data.max)
    }

    /**
     *
     * @template T
     * @param {{chance: number, data: T}[]} chanceList
     */
    throwTheDice(chanceList) {
      let value = 0
      const chances = chanceList.map((n) => {
        value = +n.chance
        return value
      })

      const total = value
      const randomValue = $u.random(0, total)
      const idx = chances.findIndex((chanceLevel) => randomValue < chanceLevel)

      return chanceList[idx].data
    }

    start() {
      this.#playing = true

      clearTimeout(this.#handler)

      const checkGap = $u.random(300, 1000)

      this.#handler = window.setTimeout(async () => {
        const action = this.detectAction()
        if (action) {
          await this.doze()
          const ts = new Date().toLocaleTimeString()
          try {
            console.debug(ts, 'Execute action:', action.name)
            await action.action()
          } catch (error) {
            console.debug(ts, 'Something wrong when execute action:', action.name, error)
          }
        }

        this.start()
      }, checkGap)
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

  const agent = new MimicAgent()
  agent.actions = page.actions

  agent.start()

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
    if (agent.playing) {
      agent.stop()
      $enableBtn.textContent = 'Disabled'
    } else {
      agent.start()
      $enableBtn.textContent = 'Enabled'
    }
  }
})
