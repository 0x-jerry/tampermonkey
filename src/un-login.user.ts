import { defineHeader, run, stringMatcher, waitElement } from './utils'

export const config = defineHeader({
  name: 'Un Login',
  version: '1.0.2',
  description: 'Auto close login dialog at some site, support zhihu.',
  matches: ['https://*.zhihu.com/*'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=zhihu.com',
  runAt: 'document-end',
})

run(() => {
  stringMatcher(location.href, [
    {
      test: /zhihu\.com/,
      handler: handleZhihuLogin,
    },
  ])

  async function handleZhihuLogin() {
    const el = await waitElement('.signFlowModal')

    const btn = el.querySelector<HTMLButtonElement>('.Modal-closeButton')

    btn?.click()

    console.debug('close login dialog successfully')
  }
})
