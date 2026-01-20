// ==UserScript==
// @name         Refine Reading
// @namespace    0x-jerry
// @description  Refine style of hetushu.com
// @version      1.0.5
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/refine-reading.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/refine-reading.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/refine-reading.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hetushu.com
// @match        https://*.hetushu.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function() {


//#region src/utils/helper.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}

//#endregion
//#region node_modules/.pnpm/@0x-jerry+utils@6.0.0/node_modules/@0x-jerry/utils/dist/index.js
	var isWeb = !!globalThis.window && !!globalThis.document;
	var isNode = !!globalThis.process?.versions?.node;
	var AsyncFunction = (async () => {}).constructor;

//#endregion
//#region src/utils/utils.ts
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
//#region src/refine-reading.user.ts
	run(() => {
		stringMatcher(location.href, [{
			test: /hetushu\.com/,
			handler: handleHetushu
		}]);
		async function handleHetushu() {
			GM_addStyle(css`
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
    `);
		}
	});

//#endregion
})();