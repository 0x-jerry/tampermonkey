// ==UserScript==
// @name         Simple MMO
// @namespace    0x-jerry
// @description  Try to save the simple mmo world!
// @version      1.0.4
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/smmo.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/smmo.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/smmo.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=simple-mmo.com
// @match        https://web.simple-mmo.com/*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==
(function() {


//#region node_modules/.pnpm/@0x-jerry+utils@6.0.0/node_modules/@0x-jerry/utils/dist/index.js
	var isWeb = !!globalThis.window && !!globalThis.document;
	var isNode = !!globalThis.process?.versions?.node;
	var AsyncFunction = (async () => {}).constructor;

//#endregion
//#region src/utils/utils.ts
	var Xorshift = class {
		x = 1;
		y = 0;
		z = 0;
		w = 0;
		constructor(seed = Date.now()) {
			this.x = seed;
			this.y = 362436069;
			this.z = 521288629;
			this.w = 88675121;
		}
		next() {
			const t = this.x ^ this.x << 11;
			this.x = this.y;
			this.y = this.z;
			this.z = this.w;
			this.w = this.w ^ this.w >> 19 ^ (t ^ t >> 8);
			return this.w / 2 ** 31;
		}
	};
	function Random(seed = Date.now()) {
		const x = new Xorshift(seed);
		return (min = 0, max = 1) => {
			const r = x.next();
			return min + (max - min) * r;
		};
	}
	const random = /* @__PURE__ */ Random();
	function sleep(ts = 100) {
		return new Promise((resolve) => setTimeout(resolve, ts));
	}
	function sleepRandom(min = 100, max = 1e3) {
		return sleep(random(min, max));
	}
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
//#region src/smmo.user.ts
	run(async () => {
		GM_addStyle(`
    .agent-action {
      border: 1px solid red;
    }
  `);
		class MimicAgent {
			#playing = false;
			get playing() {
				return this.#playing;
			}
			actions = [];
			#handler = -1;
			detectAction() {
				const actions$1 = this.actions.filter((action) => action.check());
				if (!actions$1.length) return null;
				return actions$1.reduce((prev, cur) => cur.priority > prev.priority ? cur : prev);
			}
			async doze() {
				const data = this.throwDice([
					{
						chance: 60,
						data: {
							min: 800,
							max: 2e3
						}
					},
					{
						chance: 30,
						data: {
							min: 2e3,
							max: 4e3
						}
					},
					{
						chance: 10,
						data: {
							min: 4e3,
							max: 6e3
						}
					}
				]);
				await sleepRandom(data.min, data.max);
			}
			/**
			*
			* @template T
			* @param {{chance: number, data: T}[]} chanceList
			*/
			throwDice(chanceList) {
				let value = 0;
				const chances = chanceList.map((n) => {
					value = +n.chance;
					return value;
				});
				const randomValue = random(0, value);
				return chanceList[chances.findIndex((chanceLevel) => randomValue < chanceLevel)].data;
			}
			continue() {
				clearTimeout(this.#handler);
				if (!this.playing) return;
				const checkGap = random(300, 1e3);
				this.#handler = window.setTimeout(async () => {
					const action = this.detectAction();
					if (action) {
						this.highlight(action.check());
						await this.doze();
						const ts = (/* @__PURE__ */ new Date()).toLocaleTimeString();
						try {
							console.debug(ts, "Execute action:", action.name);
							action.action();
						} catch (error) {
							console.debug(ts, "Something wrong when execute action:", action.name, error);
						}
					}
					this.continue();
				}, checkGap);
			}
			#enabledStateKey = "agent:enabled";
			init() {
				if (localStorage.getItem(this.#enabledStateKey)) this.start();
			}
			start() {
				localStorage.setItem(this.#enabledStateKey, "true");
				this.#playing = true;
				this.continue();
			}
			#actionEl;
			highlight(el) {
				const cls = "agent-action";
				if (this.#actionEl) this.#actionEl?.classList.remove(cls);
				this.#actionEl = el;
				this.#actionEl?.classList.add(cls);
			}
			stop() {
				localStorage.removeItem(this.#enabledStateKey);
				this.#playing = false;
				clearTimeout(this.#handler);
			}
		}
		const currentPage = new URL(location.href);
		function isVisible(el) {
			const rect = el.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0 && _checkVisibility();
			function _checkVisibility() {
				let p = el;
				while (p) {
					if (p.style.opacity === "0") return false;
					if (p.style.display === "none") return false;
					p = p.parentElement;
				}
				return true;
			}
		}
		function getElByContent(text, type) {
			return Array.from(document.querySelectorAll(type)).find((el) => isVisible(el) && el.textContent?.trim() === text);
		}
		function getButtonByContent(text) {
			return getElByContent(text, "button");
		}
		const actions = {
			verify: {
				name: "Verify",
				priority: Infinity,
				check() {
					return getElByContent("I'm a person! Promise!", "a");
				},
				action() {
					throw new Error("Detected verify action, stopped!");
				}
			},
			takeStep: createAction("Step", 99, ["Take a step"]),
			craft: createAction("Craft", 999, [
				"Salvage",
				"Catch",
				"Grab",
				"Attack",
				"Mine",
				"Chop"
			]),
			gather: createAction("Gather", 99, ["Gather", "Press here to gather"]),
			endGather: createAction("End gather", 999, ["Press here to close"]),
			attack: createAction("Attack", 99, ["Attack"]),
			endAttack: createAction("End Attack", 999, ["End Battle"])
		};
		function createAction(name, priority, btnTexts) {
			function getActionEl() {
				for (const content of btnTexts) {
					let el;
					const btn = getButtonByContent(content);
					if (btn && btn) el = btn.disabled ? null : btn;
					else el = getElByContent(content, "a");
					if (el) return el;
				}
			}
			return {
				name,
				priority,
				check() {
					return getActionEl();
				},
				action() {
					const el = getActionEl();
					if (!el) return;
					const rect = el?.getBoundingClientRect();
					const fakeEvent = new MouseEvent("click", {
						clientX: Math.round(random(rect.x, rect.x + rect.width)),
						clientY: Math.round(random(rect.y, rect.y + rect.height))
					});
					el?.dispatchEvent(fakeEvent);
				}
			};
		}
		const page = [
			{
				check() {
					return currentPage.pathname === "/travel";
				},
				actions: [
					actions.verify,
					actions.takeStep,
					actions.craft
				]
			},
			{
				check() {
					return currentPage.pathname.startsWith("/npcs/attack/");
				},
				actions: [
					actions.verify,
					actions.attack,
					actions.endAttack
				]
			},
			{
				check() {
					return currentPage.pathname.startsWith("/crafting/material/gather/");
				},
				actions: [
					actions.verify,
					actions.gather,
					actions.endGather
				]
			}
		].find((n) => n.check());
		if (!page) return;
		const agent = new MimicAgent();
		agent.actions = page.actions;
		agent.init();
		const $c = document.createElement("div");
		$c.style.position = "fixed";
		$c.style.top = "50%";
		$c.style.right = "0";
		$c.style.transform = "translate(0, -50%)";
		$c.style.background = "white";
		$c.style.border = "1px solid #eee";
		$c.style.padding = "20px";
		document.body.append($c);
		const $enableBtn = document.createElement("button");
		$c.append($enableBtn);
		const updateBtnText = () => {
			$enableBtn.textContent = agent.playing ? "Enabled" : "Disabled";
		};
		updateBtnText();
		$enableBtn.onclick = () => {
			if (agent.playing) agent.stop();
			else agent.start();
			updateBtnText();
		};
	});

//#endregion
})();