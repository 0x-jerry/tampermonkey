// ==UserScript==
// @name         Refine Reading
// @namespace    0x-jerry
// @description  Refine style of hetushu.com
// @version      1.0.1
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/refine-reading.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/refine-reading.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\refine-reading.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hetushu.com
// @match        https://*.hetushu.com/*
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
	const config = defineHeader({
		name: "Refine Reading",
		version: "1.0.1",
		description: "Refine style of hetushu.com",
		matches: ["https://*.hetushu.com/*"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=hetushu.com",
		runAt: "document-end"
	});
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
exports.config = config;
return exports;
})({});