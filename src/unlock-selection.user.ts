import { css, defineHeader, injectStyle, run } from './utils'

export const config = defineHeader({
  name: 'Unlock Selection',
  version: '1.0.2',
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
