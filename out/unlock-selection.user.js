// ==UserScript==
// @name         Unlock Selection
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/unlock-selection.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/unlock-selection.user.js
// @description  Unlock text selection
// @author       x.jerry.wang@gmail.com
// @match        https://*/*
// @match        http://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function() {


//#region src/utils/utils.ts
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
	function injectStyle(style) {
		const $style = document.createElement("style");
		$style.innerText = style;
		document.head.appendChild($style);
		return $style;
	}

//#endregion
//#region src/utils/index.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}

//#endregion
//#region src/unlock-selection.user.ts
	run(async () => {
		injectStyle(css`
    * {
      user-select: auto !important;
    }
  `);
	});

//#endregion
})();