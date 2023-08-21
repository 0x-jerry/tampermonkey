// ==UserScript==
// @name         No Redirect
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to save the time!
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
