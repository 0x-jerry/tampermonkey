// ==UserScript==
// @name         Quick Nav
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/happymh.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/happymh.user.js
// @description  Add convenient buttons to switch chapters
// @author       x.jerry.wang@gmail.com
// @match        https://m.happymh.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=m.happymh.com
// @require      ./utils.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

$u.run(async () => {
  'use strict'

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

  await $u.when(() => document.body)

  document.body.append(container)

  btn1.addEventListener('click', async () => {
    ;(await findButton('下一话'))?.click()
  })

  btn2.addEventListener('click', async () => {
    ;(await findButton('下一话'))?.click()
  })

  function findButton(text: string) {
    return $u.when(() =>
      Array.from(document.querySelectorAll('a')).find((el) => el.textContent?.trim() === text),
    )
  }
})
