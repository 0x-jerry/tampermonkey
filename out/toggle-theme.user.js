// ==UserScript==
// @name         Toggle Theme
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/toggle-theme.user.js
// @description  Very lightweight solution to toggle dark/light theme.
// @author       x.jerry.wang@gmail.com
// @match        https://*/**
// @match        http://*/**
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function() {


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
})();