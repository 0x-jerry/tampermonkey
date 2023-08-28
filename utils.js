console.debug('Utils loaded!')

globalThis.$u = {
  sleep(ts = 100) {
    return new Promise((resolve) => setTimeout(resolve, ts))
  },
  /**
   *
   * @param {string} selector
   * @returns {Promise<HTMLElement>}
   */
  async waitElement(selector) {
    return $u.when(() => document.querySelector(selector))
  },

  /**
   *
   * @template T
   * @param {() => T } checker
   * @param {number} timeout  default is 10 * 1000 (10s).
   * @returns {Promise<T>}
   */
  async when(checker, timeout = 10 * 1000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const pass = await checker()

      if (pass) return pass

      await $u.sleep(100)
    }

    throw new Error('Timeout')
  },

  /**
   *
   * @typedef MatcherConfig
   * @prop {RegExp} test
   * @prop {() => any} handler
   *
   * @param {MatcherConfig[]} configs
   * @param {string} str
   */
  stringMatcher(str, configs) {
    const hit = configs.find((n) => n.test.test(str))

    return hit?.handler()
  },

  /**
   * @param {() => any} fn 
   */
  run(fn) {
    fn()
  }
}
