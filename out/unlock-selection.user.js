// ==UserScript==
// @name         Unlock Selection
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/x.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/x.user.js
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
//#region src/unlock-selection.user.ts
	run(async () => {
		injectStyle(`
    * {
      user-select: auto !important;
    }
  `);
	});

//#endregion
})();