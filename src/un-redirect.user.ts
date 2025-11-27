import { defineHeader, run, stringMatcher } from './utils'

defineHeader({
  name: 'Un Redirect',
  version: '1.3.4',
  description: 'Skip redirect at some search result page.',
  matches: [
    'https://www.google.com/*',
    'https://*.bing.com/*',
    'https://*.zhihu.com/*',
    'https://sspai.com/*',
    'https://blog.csdn.net/*',
    'https://x.com/*',
    'https://www.acgbox.link/*'
  ],
  icon: 'https://www.google.com/s2/favicons?sz=64&domain=google.com',
})

run(async () => {

  stringMatcher(location.href, [
    {
      test: /www\.google\.com/,
      handler: handleGoogleSearchResult,
    },
    {
      test: /x\.com/,
      handler: handleTwitterLinks,
    },
    {
      test: /bing\.com/,
      handler: handleBingSearchResult,
    },
    {
      test: /zhihu\.com/,
      handler: handleZhihuLogin,
    },
    {
      test: /csdn\.net/,
      handler: handleCsdnLinks,
    },
    {
      test: /sspai\.com/,
      handler: handleSspaiLinks,
    },
    {
      test: /acgbox\.link/,
      handler: handleAcgboxLinks,
    },
  ])

  function handleAcgboxLinks() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
        const realUrl = el.dataset.url
        if (!realUrl) {
          return
        }

      return realUrl
    })
  }

  function handleSspaiLinks() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      // https://sspai.com/link?target=https%3A%2F%2Fshop.fairphone.com%2Ffairphone-5
      const url = el.href
      if (!url) return

      const u = new URL(url)

      const matched = u.host === 'sspai.com' && u.pathname === '/link'
      if (!matched) return

      const realUrl = u.searchParams.get('target')

      return realUrl
    })
  }

  async function handleCsdnLinks() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      const url = el.href
      if (!url) return

      const u = new URL(url)

      // skip csdn it self
      if (u.host.endsWith('csdn.net')) return

      const realUrl = u.toString()

      return realUrl
    })
  }

  function handleZhihuLogin() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      const url = el.href
      if (!url) return

      const u = new URL(url)

      if (u.host !== 'link.zhihu.com') return

      const realUrl = u.searchParams.get('target')

      return realUrl
    })
  }

  function handleBingSearchResult() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      // https://www.bing.com/ck/a?!&&p=f3a402544cfb2e9aJmltdHM9MTY5MjgzNTIwMCZpZ3VpZD0wN2EwMTc0Yi0wMGRkLTYxYjctMzBhZC0wNDE5MDFiYjYwYjgmaW5zaWQ9NTU0OQ&ptn=3&hsh=3&fclid=07a0174b-00dd-61b7-30ad-041901bb60b8&psq=hello&u=a1aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g_dj1tSE9OTmNaYndEWQ&ntb=1
      const url = el.href
      if (!url) return

      const u = new URL(url)

      const shouldSkip = u.host.endsWith('bing.com') && u.pathname === '/ck/a'

      if (!shouldSkip) {
        return
      }

      return {
        matched: shouldSkip,
        getUrl: async () => {
          try {
            const div = el.parentElement?.nextElementSibling?.querySelector(
              'div:nth-child(2)',
            ) as HTMLElement | null
            const data = div?.dataset.scMetadata as string
            return JSON.parse(data).url
          } catch (error) {
            // ignore
          }

          const matcher = /var u = "[^"]+"/m

          const resp = await fetch(url)

          // should match the next line url
          // var u = "https://www.youtube.com/watch?v=mHONNcZbwDY";
          const html = await resp.text()
          const _matchedUrl = html.match(matcher)?.at(0)

          return _matchedUrl?.slice('var u = "'.length, -1)
        },
      }
    })
  }

  function handleTwitterLinks() {
    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      const textContent = el.textContent?.trim()?.replace('…', '')
      if (textContent?.startsWith('http')) {
        return textContent
      }
    })
  }

  function handleGoogleSearchResult() {
    if (
      document
        .getElementsByTagName('title')
        .item(0)
        ?.textContent?.trim()
        .endsWith('- Google Search')
    ) {
      return
    }

    captureRedirectLinks<HTMLLinkElement>('A', (el) => {
      const url = el.href

      if (!url) return

      const u = new URL(url)

      // https://colab.research.google.com/corgiredirector?site=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FAutomatic_differentiation
      if (
        u.host === 'colab.research.google.com' &&
        u.pathname === '/corgiredirector'
      ) {
        return u.searchParams.get('site')
      }

      const realUrl = url.startsWith('http') ? url : u.searchParams.get('url')

      return realUrl
    })
  }

  // ---------- utils ---------

  type FilterFn<T> = (el: T) => boolean

  /**
   *
   * @param filter filter with tagname or use a custom function
   * @param getMatchedResult
   */
  function captureRedirectLinks<T extends HTMLElement>(
    filter: string | FilterFn<T>,
    getMatchedResult: (
      el: T,
    ) =>
      | string
      | undefined
      | null
      | { matched: boolean; getUrl: () => Promise<string> },
  ) {
    const selectorFilter =
      typeof filter === 'string'
        ? (el: HTMLElement) => el.tagName === filter.toUpperCase()
        : filter

    document.addEventListener(
      'click',
      async (ev) => {
        // @ts-expect-error
        const links: HTMLElement[] = ev.composedPath().filter(selectorFilter)

        for (const link of links) {
          try {
            const result = getMatchedResult(link as T)

            if (!result) continue

            if (typeof result === 'object') {
              if (result?.matched) {
                preventDefault()
                const realUrl = await result.getUrl()
                if (!realUrl) continue

                console.debug(`matched redirect link`, result, link)
                window.open(realUrl, '_blank')
                return
              }

              continue
            }

            if (result) {
              console.debug(`matched redirect link`, result, link)

              preventDefault()
              window.open(result, '_blank')
              return
            }
          } catch (error) {
            console.debug('error', error)
          }
        }

        function preventDefault() {
          ev.preventDefault()
          ev.stopPropagation()
        }
      },
      {
        capture: true,
      },
    )
  }
})
