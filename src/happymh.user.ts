import { defineHeader, run, when } from './utils'

export const config = defineHeader({
  name: 'Happymh Quick Nav',
  version: '1.0.5',
  description: 'Add convenient buttons to switch chapters',
  matches: ['https://m.happymh.com/*'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=m.happymh.com',
  runAt: 'document-end',
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
    previousChapter()
  })

  btn2.addEventListener('click', async () => {
    nextChapter()
  })

  document.body.append(container)

  window.addEventListener('keydown', async (e) => {
    switch (e.key) {
      case 'ArrowRight':
        nextChapter()
        break
      case 'ArrowLeft':
        previousChapter()
        break

      default:
        break
    }
  })

  async function nextChapter() {
    ;(await findButton('下一话'))?.click()
  }

  async function previousChapter() {
    ;(await findButton('上一话'))?.click()
  }

  function findButton(text: string) {
    return when(() =>
      Array.from(document.querySelectorAll('button')).find(
        (el) => el.textContent?.trim() === text,
      ),
    )
  }
})
