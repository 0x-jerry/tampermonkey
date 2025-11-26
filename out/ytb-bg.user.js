// ==UserScript==
// @name         Youtube Background
// @namespace    0x-jerry
// @description  Youtube background player, port from [Youtube-Background](https://github.com/alkisqwe/Youtube-Background)
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/ytb-bg.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/ytb-bg.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\ytb-bg.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @match        https://*.youtube.com/*
// @match        https://*.youtube-nocookie.com/*
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
//#region src/ytb-bg.user.ts
	const config = defineHeader({
		name: "Youtube Background",
		version: "1.0.0",
		description: "Youtube background player, port from [Youtube-Background](https://github.com/alkisqwe/Youtube-Background)",
		matches: ["https://*.youtube.com/*", "https://*.youtube-nocookie.com/*"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=youtube.com"
	});
	run(async () => {
		const IS_YOUTUBE = window.location.hostname.search(/(?:^|.+\.)youtube\.com/) > -1 || window.location.hostname.search(/(?:^|.+\.)youtube-nocookie\.com/) > -1;
		const IS_MOBILE_YOUTUBE = window.location.hostname === "m.youtube.com";
		const IS_DESKTOP_YOUTUBE = IS_YOUTUBE && !IS_MOBILE_YOUTUBE;
		const IS_VIMEO = window.location.hostname.search(/(?:^|.+\.)vimeo\.com/) > -1;
		if (window.navigator.userAgent.indexOf("Android") > -1 || !IS_DESKTOP_YOUTUBE) Object.defineProperties(document, {
			hidden: { value: false },
			visibilityState: { value: "visible" }
		});
		window.addEventListener("visibilitychange", (evt) => evt.stopImmediatePropagation(), true);
		if (IS_VIMEO) window.addEventListener("fullscreenchange", (evt) => evt.stopImmediatePropagation(), true);
		if (IS_YOUTUBE) loop(pressKey, 60 * 1e3, 10 * 1e3);
		function pressKey() {
			const key = 18;
			sendKeyEvent("keydown", key);
			sendKeyEvent("keyup", key);
		}
		function sendKeyEvent(aEvent, aKey) {
			document.dispatchEvent(new KeyboardEvent(aEvent, {
				bubbles: true,
				cancelable: true,
				keyCode: aKey,
				which: aKey
			}));
		}
		function loop(aCallback, aDelay, aJitter) {
			const jitter = getRandomInt(-aJitter / 2, aJitter / 2);
			const delay = Math.max(aDelay + jitter, 0);
			window.setTimeout(() => {
				aCallback();
				loop(aCallback, aDelay, aJitter);
			}, delay);
		}
		function getRandomInt(aMin, aMax) {
			const min = Math.ceil(aMin);
			const max = Math.floor(aMax);
			return Math.floor(Math.random() * (max - min)) + min;
		}
	});

//#endregion
exports.config = config;
return exports;
})({});