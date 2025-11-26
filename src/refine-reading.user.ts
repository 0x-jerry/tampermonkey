import { defineHeader, run, stringMatcher } from './utils'

export const config = defineHeader({
  name: 'Refine Reading',
  version: '1.0.0',
  description: 'Refine style of hetushu.com',
  matches: ['https://*.hetushu.com/*'],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=hetushu.com',
  runAt: 'document-end',
})

run(() => {
  stringMatcher(location.href, [
    {
      test: /hetushu\.com/,
      handler: injectStyle,
    },
  ])

  async function injectStyle() {
    const $style = document.createElement('style')
    const css = String.raw

    $style.innerHTML = css`
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
    `
    document.body.append($style)
  }
})
