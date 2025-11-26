import { defineHeader, run, when } from './utils'

export const config = defineHeader({
  name: 'ColaManga Quick Nav',
  version: '1.0.0',
  description: 'Add convenient buttons to switch chapters',
  matches: ['https://www.colamanga.com/*'],
  runAt: 'document-end',
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=colamanga.com',
})

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
