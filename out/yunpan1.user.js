// ==UserScript==
// @name         Save the world
// @namespace    0x-jerry
// @description  try to save the world!
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/yunpan1.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/yunpan1.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\yunpan1.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yunpan1.cc
// @match        https://*.yunpan1.cc/**
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
//#region src/yunpan1.user.ts
	const config = defineHeader({
		name: "Save the world",
		version: "1.0.0",
		description: "try to save the world!",
		matches: ["https://*.yunpan1.cc/**"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=yunpan1.cc"
	});
	run(async () => {
		const container = document.getElementById("secretCode")?.parentElement?.parentElement;
		if (container) container.style.display = "none";
	});

//#endregion
exports.config = config;
return exports;
})({});