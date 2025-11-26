// ==UserScript==
// @name         Happymh Quick Nav
// @namespace    0x-jerry
// @description  Add convenient buttons to switch chapters
// @version      1.0.5
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/happymh.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/happymh.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\happymh.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=m.happymh.com
// @match        https://m.happymh.com/*
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
	function sleep(ts = 100) {
		return new Promise((resolve) => setTimeout(resolve, ts));
	}
	/**
	*
	* @template T
	* @param {() => T } checker
	* @param {number} timeout  default is 10 * 1000 (10s).
	* @returns {Promise<T>}
	*/
	async function when(checker, timeout = 10 * 1e3) {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const pass = await checker();
			if (pass) return pass;
			await sleep(100);
		}
		throw new Error("Timeout");
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
//#region src/happymh.user.ts
	const config = defineHeader({
		name: "Happymh Quick Nav",
		version: "1.0.5",
		description: "Add convenient buttons to switch chapters",
		matches: ["https://m.happymh.com/*"],
		icon: "https://www.google.com/s2/favicons?sz=64&domain=m.happymh.com",
		runAt: "document-end"
	});
	run(async () => {
		await when(() => document.body);
		const container = document.createElement("div");
		container.innerHTML = `
    <button>上一话</button>
    <button>下一话</button>
  `;
		container.style.position = "fixed";
		container.style.top = "40%";
		container.style.right = "0";
		container.style.display = "flex";
		container.style.flexDirection = "column";
		container.style.gap = "4px";
		const btn1 = container.children.item(0);
		btn1.style.fontSize = "18px";
		btn1.style.cursor = "pointer";
		const btn2 = container.children.item(1);
		btn2.style.fontSize = "18px";
		btn2.style.cursor = "pointer";
		btn1.addEventListener("click", async () => {
			previousChapter();
		});
		btn2.addEventListener("click", async () => {
			nextChapter();
		});
		document.body.append(container);
		window.addEventListener("keydown", async (e) => {
			switch (e.key) {
				case "ArrowRight":
					nextChapter();
					break;
				case "ArrowLeft":
					previousChapter();
					break;
				default: break;
			}
		});
		async function nextChapter() {
			(await findButton("下一话"))?.click();
		}
		async function previousChapter() {
			(await findButton("上一话"))?.click();
		}
		function findButton(text) {
			return when(() => Array.from(document.querySelectorAll("button")).find((el) => el.textContent?.trim() === text));
		}
	});

//#endregion
exports.config = config;
return exports;
})({});