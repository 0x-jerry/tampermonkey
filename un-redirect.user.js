// ==UserScript==
// @name         No Redirect
// @namespace    http://tampermonkey.net/
// @version      1.2.2
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @description  Try to save the time, skip redirect in search result page, current only support google.
// @author       x.jerry.wang@gmail.com
// @match        https://*.google.com/*
// @match        https://*.bing.com/*
// @match        https://*.zhihu.com/*
// @match        https://blog.csdn.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=csdn.net
// @run-at       document-end
// @grant        none
// ==/UserScript==

/**
 * Define how to extract real url
 */
const configs = [
  {
    matcher: /google\.com/,
    handler: handleGoogleSearchResult,
  },
  {
    matcher: /bing\.com/,
    handler: handleBingSearchResult,
  },
  {
    matcher: /zhihu\.com/,
    handler: handleZhihuLinks,
  },
  {
    matcher: /csdn\.net/,
    handler: handleCsdnLinks,
  },
]

;(async function () {
  'use strict'

  console.log('Un redirect loaded!')

  const handler = getHandler()
  await sleep(100)

  handler?.()
})()

function getHandler() {
  const url = location.href

  for (const conf of configs) {
    if (conf.matcher.test(url)) {
      console.log('matched config', conf.matcher)
      return conf.handler
    }
  }
}

async function handleCsdnLinks() {
  captureRedirectLinks('A', (el) => {
    const url = el.href
    if (!url) return

    const u = new URL(url)

    // skip csdn it self
    if (u.host.endsWith('csdn.net')) return

    const realUrl = u.toString()

    return realUrl
  })
}

function handleZhihuLinks() {
  captureRedirectLinks('A', (el) => {
    const url = el.href
    if (!url) return

    const u = new URL(url)

    if (u.host !== 'link.zhihu.com') return

    const realUrl = u.searchParams.get('target')

    return realUrl
  })
}

function handleBingSearchResult() {
  captureRedirectLinks('A', (el) => {
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
        const matcher = /var u = "[^"]+"/m

        const resp = await fetch(url)

        // should match the next line url
        // var u = "https://www.youtube.com/watch?v=mHONNcZbwDY";
        const html = await resp.text()
        const _matchedUrl = html.match(matcher).at(0)

        return _matchedUrl?.slice('var u = "'.length, -1)
      },
    }
  })
}

function handleGoogleSearchResult() {
  captureRedirectLinks('A', (el) => {
    const url = el.href

    if (!url) return

    const u = new URL(url)

    const realUrl = url.startsWith('http') ? url : u.searchParams.get('url')

    return realUrl
  })
}

// ---------- utils ---------

/**
 *
 * @param {string | ((el: HTMLElement) => boolean) } filter filter with tagname or use a custom function
 * @param {(el: HTMLElement) => string | undefined | {matched: boolean, getUrl: () => Promise<string>}} getMatchResult
 */
function captureRedirectLinks(filter, getMatchResult) {
  const selectorFilter =
    typeof filter === 'string' ? (el) => el.tagName === filter.toUpperCase() : filter

  document.addEventListener('click', async (ev) => {
    const links = ev.composedPath().filter(selectorFilter)

    for (const link of links) {
      try {
        const result = getMatchResult(link)

        if (typeof result === 'object') {
          if (result?.matched) {
            ev.preventDefault()
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

          ev.preventDefault()
          window.open(result, '_blank')
          return
        }
      } catch (error) {
        // ignore
        console.debug('error', error)
      }
    }
  })
}

function sleep(ts = 100) {
  return new Promise((resolve) => setTimeout(resolve, ts))
}
