// ==UserScript==
// @name         Save the world
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/yunpan1.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/yunpan1.user.js
// @description  try to save the world!
// @author       x.jerry.wang@gmail.com
// @match        https://*.yunpan1.cc/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yunpan1.cc
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

//#endregion
//#region src/yunpan1.user.ts
	run(async () => {
		const container = document.getElementById("secretCode")?.parentElement?.parentElement;
		if (container) container.style.display = "none";
	});

//#endregion
})();