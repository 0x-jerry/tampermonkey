// ==UserScript==
// @name         No Redirect
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @description  Try to save the time, skip redirect in search result page, current only support google.
// @author       x.jerry.wang@gmail.com
// @match        https://*.google.com/*
// @match        https://*.bing.com/*
// @match        https://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
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
]

;(function () {
  'use strict'

  console.log('Un redirect loaded!')

  const handler = getHandler()

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

function handleZhihuLinks() {
  doWithSelectorAll('a', (el) => {
    const url = el.href
    if (!url) return

    const u = new URL(url)

    if (u.host !== 'link.zhihu.com') return

    const realUrl = u.searchParams.get('target')

    overrideLinkClick(el, realUrl)
  })
}

function handleBingSearchResult() {
  doWithSelectorAll('#b_results .b_title a', (el) => {
    const url = el.href
    if (!url) return

    const dataEl = el.parentElement.parentElement.querySelector('[data-sc-metadata]')
    if (!dataEl) return

    // {&quot;scenarios&quot;:&quot;6&quot;,&quot;url&quot;:&quot;https://learn.microsoft.com/zh-cn/rest/api/cognitiveservices-bingsearch/bing-web-api-v5-reference&quot;,&quot;agi5qv&quot;:&quot;agi5qv2022986592589413866&quot;}
    const str = dataEl.getAttribute('data-sc-metadata').replaceAll('&quot;', '"')

    const data = JSON.parse(str)

    const realUrl = data.url

    overrideLinkClick(el, realUrl)
  })
}

function handleGoogleSearchResult() {
  doWithSelectorAll('a', (el) => {
    const url = el.href

    if (!url) return

    const u = new URL(url)

    const realUrl = url.startsWith('http') ? url : u.searchParams.get('url')

    overrideLinkClick(el, realUrl)
  })
}

// ---------- utils ---------

/**
 *
 * @param {HTMLLinkElement} el
 * @param {string | undefined} realUrl
 */
function overrideLinkClick(el, realUrl) {
  if (!realUrl) return

  console.debug('match real url', realUrl)

  el.onclick = (e) => {
    e.preventDefault()

    window.open(realUrl, '_blank')
  }

  el.setAttribute('data-real-url', realUrl)
}

/**
 *
 * @param {string} selector
 * @param {(el: HTMLElement) => any} fn
 */
function doWithSelectorAll(selector, fn) {
  document.querySelectorAll(selector).forEach(async (el) => {
    try {
      await fn(el)
    } catch (error) {
      // ignore
      console.debug('error', error)
    }
  })
}
