import { defineHeader, run } from './utils'

export const config = defineHeader({
  name: 'No redirect',
  version: '1.0.1',
  description: 'No redirect',
  matches: ['https://www.acgbox.link/*'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=acgbox.link',
  runAt: 'document-end',
})

run(async () => {
  document
    .querySelectorAll<HTMLAnchorElement>('a[data-url]')
    .forEach((anchor) => {
      anchor.addEventListener('click', (evt) => {
        const url = anchor.dataset.url
        if (!url) {
          return
        }
        evt.preventDefault()
        window.open(url, '_blank')
      })
    })
})
