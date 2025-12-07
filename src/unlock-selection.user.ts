import { css, defineHeader, run } from './utils'

defineHeader({
  name: 'Unlock Selection',
  version: '1.0.5',
  description: 'Unlock text selection',
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document-start',
  grants: ['GM_addStyle'],
})

run(async () => {
  GM_addStyle(css`
    * {
      user-select: auto !important;
    }
  `)
})
