// ==UserScript==
// @name         Unlock Selection
// @namespace    0x-jerry
// @description  Unlock text selection
// @version      1.0.7
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/unlock-selection.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/unlock-selection.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/unlock-selection.user.ts
// @match        https://*/*
// @match        http://*/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==
(function() {


//#region src/utils/helper.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}

//#endregion
//#region node_modules/.pnpm/@0x-jerry+utils@6.0.0/node_modules/@0x-jerry/utils/dist/chunk-DY2X3BVF.js
	var CLS_CHECK_STR = "class ";
	function isCls(target) {
		return String(target).slice(0, CLS_CHECK_STR.length) === CLS_CHECK_STR;
	}
	function isFn(target) {
		return typeof target === "function" && !isCls(target);
	}

//#endregion
//#region node_modules/.pnpm/@0x-jerry+utils@6.0.0/node_modules/@0x-jerry/utils/dist/index.js
	var isWeb = !!globalThis.window && !!globalThis.document;
	var isNode = !!globalThis.process?.versions?.node;
	function toValue(valueOrFn) {
		return isFn(valueOrFn) ? valueOrFn() : valueOrFn;
	}
	var AsyncFunction = (async () => {}).constructor;

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
//#region src/unlock-selection.user.ts
	run(async () => {
		const storageKey = "unlock-selection:enabled";
		let styleElement = null;
		const getMenuName = () => `Unlock Selection: ${storage.get(storageKey, false)}`;
		registerMenuCommand(getMenuName, () => {
			if (storage.get(storageKey, false)) styleElement = GM_addStyle(css`
        * {
          user-select: auto !important;
        }
      `);
			else {
				styleElement?.remove();
				styleElement = null;
			}
		});
	});

//#endregion
})();