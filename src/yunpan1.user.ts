import { defineHeader, run } from './utils'

export const config = defineHeader({
  name: 'Save the world',
  version: '1.0.0',
  description: 'try to save the world!',
  matches: ['https://*.yunpan1.cc/**'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=yunpan1.cc',
})

run(async () => {
  const el = document.getElementById('secretCode')
  const container = el?.parentElement?.parentElement

  if (container) {
    container.style.display = 'none'
  }
})
