// ==UserScript==
// @name         ColaManga Quick Nav
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/colamanga.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/colamanga.user.js
// @description  Add convenient buttons to switch chapters
// @author       x.jerry.wang@gmail.com
// @match        https://www.colamanga.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=colamanga.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

import { run, when } from './utils'

run(async () => {

  await when(() => document.body)

  const container = document.createElement('div')
  container.innerHTML = `
    <button>上一话</button>
    <button>下一话</button>
  `

  container.style.position = 'fixed'
  container.style.top = '40%'
  container.style.right = '0'
  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.gap = '4px'

  const btn1 = container.children.item(0)! as HTMLElement
  btn1.style.fontSize = '18px'
  btn1.style.cursor = 'pointer'
  const btn2 = container.children.item(1)! as HTMLElement
  btn2.style.fontSize = '18px'
  btn2.style.cursor = 'pointer'

  btn1.addEventListener('click', async () => {
    await previousChapter()
  })

  btn2.addEventListener('click', async () => {
    await nextChapter()
  })

  document.body.append(container)

  window.addEventListener('keydown', async (e) => {
    switch (e.key) {
      case 'ArrowRight':
        await nextChapter()
        break
      case 'ArrowLeft':
        await previousChapter()
        break

      default:
        break
    }
  })

  async function nextChapter() {
    const els = Array.from(
      document.querySelectorAll('.mh_readend .read_page_link'),
    )

    ;(els.at(2) as HTMLLinkElement)?.click()
  }

  async function previousChapter() {
    const els = Array.from(
      document.querySelectorAll('.mh_readend .read_page_link'),
    )

    ;(els.at(0) as HTMLLinkElement)?.click()
  }
})
