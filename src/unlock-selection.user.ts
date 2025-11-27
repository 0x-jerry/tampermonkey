import { css, defineHeader, injectStyle, run } from './utils'

defineHeader({
  name: 'Unlock Selection',
  version: '1.0.3',
  description: 'Unlock text selection',
  matches: ['https://*/*', 'http://*/*'],
})

run(async () => {
  injectStyle(css`
    * {
      user-select: auto !important;
    }
  `)
})
