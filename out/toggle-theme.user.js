// ==UserScript==
// @name         Toggle Theme
// @namespace    0x-jerry
// @description  Very lightweight solution to toggle dark/light theme.
// @version      1.1.4
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/toggle-theme.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/toggle-theme.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\toggle-theme.user.ts
// @match        https://*/**
// @match        http://*/**
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
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
	const storagePrefix = "_0x_monkey:";
	const storage = {
		get(key, defaultValue) {
			const _key = storagePrefix + key;
			let v = defaultValue;
			try {
				const s = localStorage.getItem(_key);
				if (s) v = JSON.parse(s);
			} catch (error) {
				console.warn(`Parse storage ${_key} failed`, error);
			}
			return v;
		},
		set(key, value) {
			const _key = storagePrefix + key;
			const v = JSON.stringify(value);
			localStorage.setItem(_key, v);
		}
	};
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
//#region src/toggle-theme.user.ts
	const config = defineHeader({
		name: "Toggle Theme",
		version: "1.1.4",
		description: "Very lightweight solution to toggle dark/light theme.",
		matches: ["https://*/**", "http://*/**"],
		grants: ["GM_addStyle", "GM_registerMenuCommand"],
		runAt: "document-end"
	});
	run(async () => {
		const storageKey = "toggle-theme:enabled";
		let styleElement = null;
		GM_registerMenuCommand("Toggle Theme", () => {
			toggleTheme();
		});
		doEffect();
		function toggleTheme() {
			const enabled = storage.get(storageKey, false);
			storage.set(storageKey, !enabled);
			doEffect();
		}
		function doEffect() {
			const enabled = storage.get(storageKey, false);
			styleElement?.remove();
			styleElement = null;
			if (!enabled) return;
			styleElement = GM_addStyle(`
      html {
        filter: invert(1);
      }

      html img,
      html iframe,
      html canvas,
      html video,
      html svg {
        filter: invert(1);
      }
    `);
		}
	});

//#endregion
exports.config = config;
return exports;
})({});