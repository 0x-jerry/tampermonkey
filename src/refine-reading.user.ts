import { css, defineHeader, run, stringMatcher } from './utils'

defineHeader({
  name: 'Refine Reading',
  version: '1.0.3',
  description: 'Refine style of hetushu.com',
  matches: ['https://*.hetushu.com/*'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=hetushu.com',
  runAt: 'document-start',
  grants: ['GM_addStyle'],
})

run(() => {
  stringMatcher(location.href, [
    {
      test: /hetushu\.com/,
      handler: handleHetushu,
    },
  ])

  async function handleHetushu() {
    const _style = GM_addStyle(css`
      body {
        display: flex;
      }
      #left {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 1;
      }

      #left * {
        display: none !important;
      }

      #left .quit {
        display: block !important;
      }

      #right {
        position: fixed;
        right: 0;
        width: 100px;
      }
      #center {
        flex: 1;
      }
    `)
  }
})
