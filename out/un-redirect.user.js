// ==UserScript==
// @name         Un Redirect
// @namespace    http://tampermonkey.net/
// @version      1.3.2
// @updateURL    https://github.com/0x-jerry/tampermonkey/raw/main/out/un-redirect.user.js
// @downloadURL  https://github.com/0x-jerry/tampermonkey/raw/main/out/un-redirect.user.js
// @description  Skip redirect at some search result page, support google/bing/zhihu/csdn/sspai.
// @author       x.jerry.wang@gmail.com
// @match        https://www.google.com/*
// @match        https://*.bing.com/*
// @match        https://*.zhihu.com/*
// @match        https://sspai.com/*
// @match        https://blog.csdn.net/*
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @run-at       document-end
// @grant        none
// ==/UserScript==
(function() {


//#region src/utils/utils.ts
/**
	* @param {MatcherConfig[]} configs
	* @param {string} str
	*/
	function stringMatcher(str, configs) {
		return configs.find((n) => n.test.test(str))?.handler();
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
//#region src/un-redirect.user.ts
	run(async () => {
		console.debug("Un redirect loaded!");
		stringMatcher(location.href, [
			{
				test: /www\.google\.com/,
				handler: handleGoogleSearchResult
			},
			{
				test: /x\.com/,
				handler: handleTwitterLinks
			},
			{
				test: /bing\.com/,
				handler: handleBingSearchResult
			},
			{
				test: /zhihu\.com/,
				handler: handleZhihuLogin
			},
			{
				test: /csdn\.net/,
				handler: handleCsdnLinks
			},
			{
				test: /sspai\.com/,
				handler: handleSspaiLinks
			}
		]);
		function handleSspaiLinks() {
			captureRedirectLinks("A", (el) => {
				const url = el.href;
				if (!url) return;
				const u = new URL(url);
				if (!(u.host === "sspai.com" && u.pathname === "/link")) return;
				return u.searchParams.get("target");
			});
		}
		async function handleCsdnLinks() {
			captureRedirectLinks("A", (el) => {
				const url = el.href;
				if (!url) return;
				const u = new URL(url);
				if (u.host.endsWith("csdn.net")) return;
				return u.toString();
			});
		}
		function handleZhihuLogin() {
			captureRedirectLinks("A", (el) => {
				const url = el.href;
				if (!url) return;
				const u = new URL(url);
				if (u.host !== "link.zhihu.com") return;
				return u.searchParams.get("target");
			});
		}
		function handleBingSearchResult() {
			captureRedirectLinks("A", (el) => {
				const url = el.href;
				if (!url) return;
				const u = new URL(url);
				const shouldSkip = u.host.endsWith("bing.com") && u.pathname === "/ck/a";
				if (!shouldSkip) return;
				return {
					matched: shouldSkip,
					getUrl: async () => {
						try {
							const data = (el.parentElement?.nextElementSibling?.querySelector("div:nth-child(2)"))?.dataset.scMetadata;
							return JSON.parse(data).url;
						} catch (error) {}
						return ((await (await fetch(url)).text()).match(/var u = "[^"]+"/m)?.at(0))?.slice(9, -1);
					}
				};
			});
		}
		function handleTwitterLinks() {
			captureRedirectLinks("A", (el) => {
				const textContent = el.textContent?.trim()?.replace("…", "");
				if (textContent?.startsWith("http")) return textContent;
			});
		}
		function handleGoogleSearchResult() {
			if (document.getElementsByTagName("title").item(0)?.textContent?.trim().endsWith("- Google Search")) return;
			captureRedirectLinks("A", (el) => {
				const url = el.href;
				if (!url) return;
				const u = new URL(url);
				if (u.host === "colab.research.google.com" && u.pathname === "/corgiredirector") return u.searchParams.get("site");
				return url.startsWith("http") ? url : u.searchParams.get("url");
			});
		}
		/**
		*
		* @param filter filter with tagname or use a custom function
		* @param getMatchedResult
		*/
		function captureRedirectLinks(filter, getMatchedResult) {
			const selectorFilter = typeof filter === "string" ? (el) => el.tagName === filter.toUpperCase() : filter;
			document.addEventListener("click", async (ev) => {
				const links = ev.composedPath().filter(selectorFilter);
				for (const link of links) try {
					const result = getMatchedResult(link);
					if (!result) continue;
					if (typeof result === "object") {
						if (result?.matched) {
							preventDefault();
							const realUrl = await result.getUrl();
							if (!realUrl) continue;
							console.debug(`matched redirect link`, result, link);
							window.open(realUrl, "_blank");
							return;
						}
						continue;
					}
					if (result) {
						console.debug(`matched redirect link`, result, link);
						preventDefault();
						window.open(result, "_blank");
						return;
					}
				} catch (error) {
					console.debug("error", error);
				}
				function preventDefault() {
					ev.preventDefault();
					ev.stopPropagation();
				}
			}, { capture: true });
		}
	});

//#endregion
})();