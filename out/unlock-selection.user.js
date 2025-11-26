// ==UserScript==
// @name         Unlock Selection
// @namespace    0x-jerry
// @description  Unlock text selection
// @version      1.0.1
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/unlock-selection.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/unlock-selection.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\unlock-selection.user.ts
// @match        https://*/*
// @match        http://*/*
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
//#region src/utils/helper.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}

//#endregion
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
	const config = defineHeader({
		name: "Unlock Selection",
		version: "1.0.1",
		description: "Unlock text selection",
		matches: ["https://*/*", "http://*/*"]
	});
	run(async () => {
		injectStyle(css`
    * {
      user-select: auto !important;
    }
  `);
	});

//#endregion
exports.config = config;
return exports;
})({});