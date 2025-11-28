import { css, defineHeader, run } from './utils'

defineHeader({
  name: 'Unlock Selection',
  version: '1.0.4',
  description: 'Unlock text selection',
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document-start'
})

run(async () => {
  GM_addStyle(css`
    * {
      user-select: auto !important;
    }
  `)
})
