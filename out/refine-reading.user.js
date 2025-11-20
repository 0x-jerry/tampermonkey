// ==UserScript==
// @name         Refine Reading
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/refine-reading.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/refine-reading.user.js
// @description  Refine style of hetushu.com
// @author       x.jerry.wang@gmail.com
// @match        https://*.hetushu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hetushu.com
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function() {


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
			handler: injectStyle
		}]);
		async function injectStyle() {
			const $style = document.createElement("style");
			$style.innerHTML = String.raw`
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
    `;
			document.body.append($style);
		}
	});

//#endregion
})();