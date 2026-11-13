// ==UserScript==
// @name         Toggle Theme
// @namespace    0x-jerry
// @description  Very lightweight solution to toggle dark/light theme.
// @version      1.1.9
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/toggle-theme.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/toggle-theme.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/toggle-theme.user.ts
// @match        https://*/**
// @match        http://*/**
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==
(function() {
	//#region node_modules/@0x-jerry/utils/dist/parse-BFwJv0FB.mjs
	const CLS_CHECK_STR = "class ";
	/**
	* check target if is a Class or not.
	*
	* @param target
	* @returns
	*/
	function isCls(target) {
		return String(target).slice(0, 6) === CLS_CHECK_STR;
	}
	/**
	* return true when {@link target} is a function, but not a class.
	*/
	function isFn(target) {
		return typeof target === "function" && !isCls(target);
	}
	function toValue(valueOrFn) {
		return isFn(valueOrFn) ? valueOrFn() : valueOrFn;
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
	/**
	*
	* @requires GM_registerMenuCommand
	* @requires GM_unregisterMenuCommand
	*/
	function registerMenuCommand(name, onClick, optionsOrAccessKey) {
		let menuCommandId = GM_registerMenuCommand(toValue(name), (evt) => {
			onClick(evt);
			update();
		}, optionsOrAccessKey);
		function update() {
			GM_unregisterMenuCommand(menuCommandId);
			menuCommandId = GM_registerMenuCommand(toValue(name), onClick, optionsOrAccessKey);
		}
	}
	//#endregion
	//#region src/toggle-theme.user.ts
	run(async () => {
		const storageKey = "toggle-theme:enabled";
		let styleElement = null;
		const getMenuName = () => `Toggle Theme: ${storage.get(storageKey, false)}`;
		registerMenuCommand(getMenuName, toggleTheme);
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
