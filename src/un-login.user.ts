import { defineHeader, run, stringMatcher, waitElement } from './utils'

defineHeader({
  name: 'Un Login',
  version: '1.0.4',
  description: 'Auto close login dialog at some site.',
  matches: [
    //
    'https://*.zhihu.com/*',
    'https://*.yunpan1.*/**',
  ],
  runAt: 'document-end',
})

run(() => {
  stringMatcher(location.href, [
    {
      test: /zhihu\.com/,
      async handler() {
        const el = await waitElement('.signFlowModal')

        const btn = el.querySelector<HTMLButtonElement>('.Modal-closeButton')

        btn?.click()
      },
    },
    {
      test: /yunpan1\./,
      async handler() {
        const el = await waitElement('#secretCode')

        const container = el.parentElement?.parentElement

        if (container) {
          container.style.display = 'none'
        }
      },
    },
  ])
})
