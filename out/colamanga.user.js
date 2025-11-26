// ==UserScript==
// @name         ColaManga Quick Nav
// @namespace    0x-jerry
// @description  Add convenient buttons to switch chapters
// @version      1.0.1
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/colamanga.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/main/out/colamanga.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src\colamanga.user.ts
// @icon         https://www.google.com/s2/favicons?sz=64&domain=colamanga.com
// @match        https://www.colamanga.com/*
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
//#region src/colamanga.user.ts
	const config = defineHeader({
		name: "ColaManga Quick Nav",
		version: "1.0.1",
		description: "Add convenient buttons to switch chapters",
		matches: ["https://www.colamanga.com/*"],
		runAt: "document-end",
		icon: "https://www.google.com/s2/favicons?sz=64&domain=colamanga.com"
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
			await previousChapter();
		});
		btn2.addEventListener("click", async () => {
			await nextChapter();
		});
		document.body.append(container);
		window.addEventListener("keydown", async (e) => {
			switch (e.key) {
				case "ArrowRight":
					await nextChapter();
					break;
				case "ArrowLeft":
					await previousChapter();
					break;
				default: break;
			}
		});
		async function nextChapter() {
			Array.from(document.querySelectorAll(".mh_readend .read_page_link")).at(2)?.click();
		}
		async function previousChapter() {
			Array.from(document.querySelectorAll(".mh_readend .read_page_link")).at(0)?.click();
		}
	});

//#endregion
exports.config = config;
return exports;
})({});