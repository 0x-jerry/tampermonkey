// ==UserScript==
// @name         Un Login
// @namespace    0x-jerry
// @description  Auto close login dialog at some site, support zhihu.
// @version      1.0.2
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/un-login.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/un-login.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\un-login.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zhihu.com
// @match        https://*.zhihu.com/*
// @run-at       document-end
// ==/UserScript==
(function(exports) {


//#region src/utils/config.ts
/**
	* Define tamper monkey headers, only used by build process
	* @param config
	* @returns
	*/
	function defineHeader(config$1) {
		return config$1;
	}

//#endregion
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
	const config = defineHeader({
		name: "Un Login",
		version: "1.0.2",
		description: "Auto close login dialog at some site, support zhihu.",
		matches: ["https://*.zhihu.com/*"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=zhihu.com",
		runAt: "document-end"
	});
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
exports.config = config;
return exports;
})({});