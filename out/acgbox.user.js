// ==UserScript==
// @name         No redirect
// @namespace    0x-jerry
// @description  No redirect
// @version      1.0.1
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/acgbox.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/acgbox.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\acgbox.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=acgbox.link
// @match        https://www.acgbox.link/*
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
//#region src/acgbox.user.ts
	const config = defineHeader({
		name: "No redirect",
		version: "1.0.1",
		description: "No redirect",
		matches: ["https://www.acgbox.link/*"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=acgbox.link",
		runAt: "document-end"
	});
	run(async () => {
		document.querySelectorAll("a[data-url]").forEach((anchor) => {
			anchor.addEventListener("click", (evt) => {
				const url = anchor.dataset.url;
				if (!url) return;
				evt.preventDefault();
				window.open(url, "_blank");
			});
		});
	});

//#endregion
exports.config = config;
return exports;
})({});