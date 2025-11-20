// ==UserScript==
// @name         Un Login
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/un-login.user.js
// @description  Auto close login dialog at some site, support zhihu.
// @author       x.jerry.wang@gmail.com
// @match        https://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function() {


//#region src/utils/utils.ts
	function sleep(ts = 100) {
		return new Promise((resolve) => setTimeout(resolve, ts));
	}
	async function waitElement(selector) {
		return when(() => document.querySelector(selector));
	}
	/**
	*
	* @template T
	* @param {() => T } checker
	* @param {number} timeout  default is 10 * 1000 (10s).
	* @returns {Promise<T>}
	*/
	async function when(checker, timeout = 10 * 1e3) {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const pass = await checker();
			if (pass) return pass;
			await sleep(100);
		}
		throw new Error("Timeout");
	}
	/**
	* @param {MatcherConfig[]} configs
	* @param {string} str
	*/
	function stringMatcher(str, configs) {
		return configs.find((n) => n.test.test(str))?.handler();
	}
	/**
	* @param {() => any} fn
	*/
	async function run(fn) {
		try {
			await fn();
		} catch (error) {
			console.error("Running error", error);
		}
	}

//#endregion
//#region src/un-login.user.ts
	run(() => {
		stringMatcher(location.href, [{
			test: /zhihu\.com/,
			handler: handleZhihuLogin
		}]);
		async function handleZhihuLogin() {
			(await waitElement(".signFlowModal")).querySelector(".Modal-closeButton")?.click();
			console.debug("close login dialog successfully");
		}
	});

//#endregion
})();