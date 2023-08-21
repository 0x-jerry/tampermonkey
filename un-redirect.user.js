// ==UserScript==
// @name         No Redirect
// @namespace    http://tampermonkey.net/
// @version      0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/un-redirect.user.js
// @description  Try to save the time, skip redirect in search result page, current only support google.
// @author       x.jerry.wang@gmail.com
// @match        https://*.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

/**
 * Define how to extract real url
 */
const configs = [
  {
    // Extract real url from query "url"
    query: 'url',
  },
]

;(function () {
  'use strict'

  handleRedirectLinks()

  function handleRedirectLinks() {
    document.querySelectorAll('a').forEach((el) => {
      try {
        const url = el.href
        if (!url) return

        const u = new URL(url)

        const realUrl = getRealUrl(u)

        if (!realUrl) return

        console.debug('match real url', realUrl)

        el.onclick = (e) => {
          e.preventDefault()

          window.open(realUrl, '_blank')
        }

        el.setAttribute('data-raw-url', url)
        el.href = realUrl
      } catch (error) {
        // ignore
        console.debug(error)
      }
    })
  }

  /**
   *
   * @param {URL} url
   */
  function getRealUrl(url) {
    for (const conf of configs) {
      const matched = url.searchParams.get(conf.query)
      if (matched) {
        return matched
      }
    }
  }
})()
