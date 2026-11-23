// ==UserScript==
// @name         Netdisk Download
// @namespace    0x-jerry
// @description  Get direct download links from netdisk sites (Baidu, Aliyun, 139, 189, Xunlei, Guangya, Quark, UC, 123pan).
// @version      0.1.3
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/download.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/download.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/download.user.ts
// @match        *://pan.baidu.com/*
// @match        *://yun.baidu.com/*
// @match        *://openapi.baidu.com/*
// @match        *://www.aliyundrive.com/*
// @match        *://www.alipan.com/*
// @match        *://yun.139.com/*
// @match        *://caiyun.139.com/*
// @match        *://cloud.189.cn/*
// @match        *://pan.xunlei.com/*
// @match        *://www.guangyapan.com/*
// @match        *://pan.quark.cn/*
// @match        *://drive.uc.cn/*
// @match        *://*.123pan.com/*
// @match        *://*.123pan.cn/*
// @match        *://*.123684.com/*
// @match        *://*.123865.com/*
// @match        *://*.123952.com/*
// @match        *://*.123912.com/*
// @connect      *
// @connect      localhost
// @run-at       document-start
// @grant        unsafeWindow
// @grant        window.close
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function() {
	// src/utils/utils.ts
	function sleep(ts = 100) {
		return new Promise((resolve) => setTimeout(resolve, ts));
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
	// src/download/dom.ts
	function el(html) {
		const template = document.createElement("template");
		template.innerHTML = html.trim();
		return template.content.firstElementChild;
	}
	function addStyle(id, css) {
		const existing = document.getElementById(id);
		if (existing) {
			existing.textContent = css;
			return existing;
		}
		const style = document.createElement("style");
		style.id = id;
		style.textContent = css;
		(document.head || document.documentElement || document.body)?.append(style);
		return style;
	}
	function waitForKeyElements(selector, callback, once = true) {
		const processed = /* @__PURE__ */ new WeakSet();
		const run = () => {
			for (const element of document.querySelectorAll(selector)) {
				if (processed.has(element)) continue;
				if (callback(element)) {
					observer.disconnect();
					return;
				}
				if (once) processed.add(element);
			}
		};
		const observer = new MutationObserver(run);
		observer.observe(document.documentElement || document, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		});
		run();
		return () => observer.disconnect();
	}
	function iframeDownload(link) {
		const iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = link;
		document.body.append(iframe);
		setTimeout(() => iframe.remove(), 5e3);
	}
	// src/download/context.ts
	const context = {
		page: "",
		glinks: [],
		pugs: ""
	};
	// src/download/format.ts
	function isType(value) {
		return Object.prototype.toString.call(value).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
	}
	function getExtension(name) {
		if (typeof name !== "string" || name === "" || name.startsWith(".")) return "";
		const dot = name.lastIndexOf(".");
		if (dot <= 0) return "";
		const ext = name.slice(dot + 1);
		return ext !== "" && !/[^\w]/.test(ext) ? ext.toUpperCase() : "";
	}
	function sizeFormat(value = 0) {
		const base = 1024;
		const units = [
			"B",
			"KiB",
			"MiB",
			"GiB",
			"TiB",
			"PiB",
			"EiB",
			"ZiB",
			"YiB"
		];
		const names = [
			"字节",
			"千字节",
			"兆字节",
			"吉字节",
			"太字节",
			"拍字节",
			"艾字节",
			"泽字节",
			"尧字节"
		];
		const size = Number(value);
		if (!Number.isFinite(size) || size < 0) return "";
		if (size === 0) return "0B(字节)";
		const index = Math.min(Math.floor(Math.log(size) / Math.log(base)), units.length - 1);
		const n = size / base ** index;
		return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}${names[index]}(${units[index]})`;
	}
	function fixFilename(name) {
		return String(name).replace(/[!?&|`"'*\/:<>\\]/g, "_");
	}
	// src/download/framework.ts
	function findReact(dom, traverseUp = 0) {
		if (!dom) return null;
		const key = Object.keys(dom).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
		if (!key) return null;
		const domFiber = dom[key];
		if (domFiber == null) return null;
		if (domFiber._currentElement) {
			let compFiber = domFiber._currentElement._owner;
			for (let i = 0; i < traverseUp; i++) compFiber = compFiber._currentElement._owner;
			return compFiber._instance;
		}
		const getCompFiber = (fiber) => {
			let parentFiber = fiber.return;
			while (isType(parentFiber?.type) === "string") parentFiber = parentFiber.return;
			return parentFiber;
		};
		let compFiber = getCompFiber(domFiber);
		for (let i = 0; i < traverseUp; i++) compFiber = getCompFiber(compFiber);
		return compFiber?.stateNode || compFiber;
	}
	function getVueComponents(rootElement) {
		if (!rootElement) return [];
		const app = (rootElement.__vue_app__ ? rootElement : rootElement.querySelector?.("[data-v-app]"))?.__vue_app__;
		if (app) {
			const rootVNode = app._container?._vnode || app._vnode;
			const rootComponent = rootVNode?.component || app._instance;
			const out = [];
			const seen = /* @__PURE__ */ new Set();
			const walk = (vnode) => {
				if (!vnode || typeof vnode !== "object" || seen.has(vnode)) return;
				seen.add(vnode);
				if (vnode.component) {
					out.push(vnode.component);
					walk(vnode.component.subTree);
				}
				if (Array.isArray(vnode.children)) vnode.children.forEach(walk);
				if (vnode.suspense) walk(vnode.suspense);
				if (Array.isArray(vnode.dynamicChildren)) vnode.dynamicChildren.forEach(walk);
			};
			if (rootComponent) {
				out.push(rootComponent);
				walk(rootComponent.subTree);
			} else if (rootVNode) walk(rootVNode);
			return out;
		}
		const rootVm = rootElement.__vue__;
		if (rootVm) {
			const out = [];
			const walk = (vm) => {
				if (!vm) return;
				out.push(vm);
				(vm.$children || []).forEach(walk);
			};
			walk(rootVm);
			return out;
		}
		return [];
	}
	function findVueComponent(names, rootElement, multiple = false) {
		const matched = getVueComponents(rootElement).filter((component) => {
			const type = component.type;
			const name = type && (type.name || type.__name) || component.$options && component.$options.name || "";
			return Array.isArray(names) ? names.includes(name) : name === names;
		});
		return multiple ? matched : matched[0];
	}
	// src/download/request.ts
	function standCookies(input, type = "cookie") {
		const cookies = {};
		if (!input) return cookies;
		const lines = Array.isArray(input) ? input : [input];
		const isSetCookie = type.includes("set-cookie");
		const blocks = lines.flatMap((line) => line.split(","));
		for (const block of blocks) {
			const parts = block.split(";");
			if (isSetCookie) {
				const mainPair = parts[0].trim();
				if (!mainPair.includes("=")) continue;
				const [key, ...valueParts] = mainPair.split("=");
				const trimmedKey = key.trim();
				if (/^(path|domain|expires|max-age|samesite|secure|httponly)$/i.test(trimmedKey)) continue;
				cookies[trimmedKey] = valueParts.join("=").trim();
			} else for (const part of parts) {
				if (!part.includes("=")) continue;
				const [key, ...valueParts] = part.split("=");
				cookies[key.trim()] = valueParts.join("=").trim();
			}
		}
		return cookies;
	}
	function standHeaders(headers = {}, withServer = true, withOrigin = true, withCookie = false) {
		const pairs = [];
		if (typeof headers === "string") for (const line of headers.split(/[\r\n]+/)) {
			if (!line.includes(":")) continue;
			const [key, ...valueParts] = line.split(":");
			pairs.push([key, valueParts.join(":")]);
		}
		else if (headers) for (const key in headers) {
			const value = headers[key];
			pairs.push([key, typeof value === "object" && value !== null && !Array.isArray(value) ? JSON.stringify(value) : value]);
		}
		const normalized = {};
		for (const [key, value] of pairs) {
			const normalizedKey = key.trim().toLowerCase().split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-");
			const normalizedValue = typeof value === "string" ? value.trim() : value;
			if (normalized[normalizedKey]) normalized[normalizedKey] = [].concat(normalized[normalizedKey], normalizedValue);
			else normalized[normalizedKey] = normalizedValue;
		}
		if (withCookie) {
			for (const key in normalized) if (key.toLowerCase().includes("cookie")) normalized[key] = standCookies(normalized[key], key.toLowerCase());
		}
		if (!withServer) return normalized;
		return {
			Accept: "*/*",
			"User-Agent": navigator.userAgent,
			...withOrigin ? {
				Origin: location.origin,
				Referer: `${location.origin}/`
			} : {},
			...normalized
		};
	}
	function toRequestHeaders(headers) {
		const result = {};
		for (const key in headers) {
			const value = headers[key];
			if (value === void 0 || value === null || value === "") continue;
			if (Array.isArray(value)) result[key] = key.toLowerCase().includes("cookie") ? value.join("; ") : value.join(", ");
			else result[key] = String(value);
		}
		return result;
	}
	function parseResponse(response, type) {
		if (type === "json") {
			if (response.response && typeof response.response === "object") return response.response;
			try {
				return JSON.parse(response.responseText);
			} catch {
				return response.responseText;
			}
		}
		if (type === "blob" || type === "arraybuffer") return response.response;
		return response.responseText;
	}
	function attachResponseHeaders(response) {
		const raw = response.responseHeaders || (typeof response.getAllResponseHeaders === "function" ? response.getAllResponseHeaders() : "") || "";
		response.responseHeaders = standHeaders(typeof raw === "string" ? raw.trim() : "", false, false, true);
		return response;
	}
	function request(options) {
		const fn = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null;
		if (!fn) throw new Error("GM_xmlhttpRequest is unavailable");
		return fn({
			withCredentials: true,
			...options
		});
	}
	function requestPromise(options) {
		let handle;
		const promise = new Promise((resolve, reject) => {
			handle = request({
				...options,
				onload: (response) => resolve(attachResponseHeaders(response)),
				onerror: (error) => reject(/* @__PURE__ */ new Error(`请求失败: ${JSON.stringify(error)}`)),
				ontimeout: () => reject(/* @__PURE__ */ new Error("请求超时"))
			});
		});
		promise.abort = () => handle?.abort?.();
		return promise;
	}
	async function get(url, headers, type = "json", withOrigin = true) {
		return parseResponse(await requestPromise({
			method: "GET",
			url,
			headers: toRequestHeaders(standHeaders(headers, true, withOrigin)),
			responseType: type,
			anonymous: false
		}), type);
	}
	async function post(url, data, headers, type = "json", withOrigin = true, full = false) {
		let body;
		let contentType;
		if (isType(data) === "object" || isType(data) === "array") {
			body = JSON.stringify(data);
			contentType = "application/json";
		} else if (isType(data) === "urlsearchparams") {
			body = String(data);
			contentType = "application/x-www-form-urlencoded";
		} else body = data === void 0 || data === null ? void 0 : String(data);
		const normalized = standHeaders(headers, true, withOrigin);
		normalized.Accept = "*/*,application/json;charset=utf-8";
		if (contentType && !Object.keys(normalized).some((key) => key.toLowerCase() === "content-type")) normalized["Content-Type"] = contentType;
		const response = await requestPromise({
			method: "POST",
			url,
			headers: toRequestHeaders(normalized),
			data: body,
			responseType: type,
			anonymous: false
		});
		return full ? response : parseResponse(response, type);
	}
	async function head(url, headers, usingGET = false) {
		const response = await requestPromise({
			method: usingGET ? "GET" : "HEAD",
			url,
			headers: toRequestHeaders(standHeaders(headers)),
			anonymous: false
		});
		if (!usingGET && (response.status < 200 || response.status >= 400)) {
			const nextHeaders = typeof headers === "object" && headers ? { ...headers } : {};
			return head(response.finalUrl || url, {
				...nextHeaders,
				Range: "bytes=0-0"
			}, true);
		}
		return response;
	}
	async function getFinal(url, headers = {}, usingGET = false, returnURL = true) {
		const response = await head(url, headers, usingGET);
		if (!response.finalUrl) throw response;
		if (response.status === 204 && response.statusText === "IDM") throw response;
		if (response.status >= 300 && response.status < 400) return getFinal(response.finalUrl, headers, usingGET, returnURL);
		return returnURL ? response.finalUrl : response;
	}
	// src/download/serialize.ts
	function clone(value) {
		try {
			return structuredClone(value);
		} catch {
			if (value === null || value === void 0 || typeof value !== "object") return value;
			if (value instanceof Date) return new Date(value);
			if (Array.isArray(value)) return value.map((item) => clone(item));
			const result = {};
			for (const key in value) if (Object.prototype.hasOwnProperty.call(value, key)) result[key] = clone(value[key]);
			return result;
		}
	}
	function encodeBase(str) {
		try {
			str = encodeURIComponent(str);
		} catch {}
		try {
			str = unescape(str);
		} catch {}
		try {
			str = btoa(str);
		} catch {}
		return str;
	}
	function decodeBase(str) {
		try {
			str = decodeURIComponent(str);
		} catch {}
		try {
			str = atob(str);
		} catch {}
		try {
			str = escape(str);
		} catch {}
		try {
			str = decodeURIComponent(str);
		} catch {}
		return str;
	}
	function stringify(obj) {
		let str = "";
		for (const key in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
			const value = obj[key];
			if (Array.isArray(value)) for (const item of value) str += `${encodeURIComponent(key)}=${encodeURIComponent(item)}&`;
			else str += `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}&`;
		}
		return str.slice(0, -1);
	}
	// src/download/store.ts
	const prefix = "netdisk-download:";
	const gmStore = {
		get(key, fallback) {
			try {
				return GM_getValue(prefix + key, fallback);
			} catch {
				return fallback;
			}
		},
		set(key, value) {
			GM_setValue(prefix + key, value);
		},
		del(key) {
			GM_deleteValue(prefix + key);
		}
	};
	const localStore = {
		get(key, fallback) {
			const raw = localStorage.getItem(key);
			if (raw === null) return fallback;
			try {
				return JSON.parse(raw);
			} catch {
				return raw;
			}
		},
		set(key, value) {
			const raw = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
			localStorage.setItem(key, raw);
		},
		del(key) {
			localStorage.removeItem(key);
		}
	};
	// src/download/clipboard.ts
	async function setClipboard(text) {
		text = String(text);
		if (typeof GM_setClipboard === "function") try {
			GM_setClipboard(text, "text");
			return true;
		} catch {}
		if (navigator.clipboard?.writeText) try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {}
		try {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.left = "-9999px";
			textarea.style.top = "0";
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			const ok = document.execCommand("copy");
			textarea.remove();
			if (ok) return true;
		} catch {}
		return false;
	}
	// src/download/ui/modal.ts
	let modal = null;
	let loadingEl = null;
	function plain(text) {
		return String(text ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
	}
	function showModal(options) {
		closeModal();
		modal = el(`<div class="nd-overlay netdisk-download">
    <div class="nd-modal">
      <div class="nd-modal-header">
        <h3 class="nd-modal-title"></h3>
        <button class="nd-close" type="button" aria-label="关闭">×</button>
      </div>
      <div class="nd-modal-body"></div>
    </div>
  </div>`);
		modal.querySelector(".nd-modal-title").textContent = options.title;
		const body = modal.querySelector(".nd-modal-body");
		if (typeof options.body === "string") body.innerHTML = options.body;
		else body.append(options.body);
		modal.querySelector(".nd-close").addEventListener("click", closeModal);
		modal.addEventListener("click", (event) => {
			event.stopPropagation();
			if (event.target === modal) closeModal();
		});
		document.body.append(modal);
		return modal;
	}
	function closeModal() {
		modal?.remove();
		modal = null;
	}
	const loading = {
		open(title = "获取中") {
			if (loadingEl) {
				loading.title(title);
				return;
			}
			loadingEl = el(`<div class="nd-overlay nd-loading-overlay netdisk-download">
      <div class="nd-loading">
        <div class="nd-spinner"></div>
        <div class="nd-loading-title"></div>
        <div class="nd-loading-text"></div>
      </div>
    </div>`);
			loading.title(title);
			loading.update("请稍候...");
			document.body.append(loadingEl);
		},
		title(text) {
			const node = loadingEl?.querySelector(".nd-loading-title");
			if (node) node.textContent = plain(text);
		},
		update(text) {
			const node = loadingEl?.querySelector(".nd-loading-text");
			if (node) node.textContent = plain(text);
		},
		close() {
			loadingEl?.remove();
			loadingEl = null;
		}
	};
	function toast(text, type = "info") {
		const node = el(`<div class="nd-toast netdisk-download nd-toast-${type}"></div>`);
		node.textContent = plain(text);
		document.body.append(node);
		setTimeout(() => node.remove(), 4e3);
	}
	// src/download/download/convert.ts
	function headerParts(headers) {
		const normalized = standHeaders(headers, true, false);
		const parts = [];
		for (const [key, value] of Object.entries(normalized)) {
			if (value === void 0 || value === null) continue;
			const safe = String(value).replace(/"/g, "\\\"");
			parts.push(`--header="${key}: ${safe}"`);
		}
		return parts.length ? ` ${parts.join(" ")}` : "";
	}
	function toAria2(link, filename, headers) {
		return `aria2c "${link}" --out "${fixFilename(filename)}"${headerParts(headers)}`;
	}
	// src/download/download/send-to/queue.ts
	function createQueue() {
		let tail = Promise.resolve();
		return (task) => {
			const next = tail.catch(() => {}).then(task);
			tail = next;
			return next;
		};
	}
	// src/download/download/send-to/aria2.ts
	const queue$2 = createQueue();
	const defaultAria2Rpc = {
		domain: "http://localhost",
		port: "16800",
		path: "/jsonrpc",
		token: "",
		dir: "",
		default: true
	};
	const aria2Adapter = { send({ link, filename, headers }) {
		return queue$2(async () => {
			const normalized = standHeaders(headers);
			const headerParts = Object.entries(normalized).map(([key, value]) => `${key}: ${value}`);
			const rpc = getDefaultRpc("aria2");
			const url = `${rpc.domain}:${rpc.port}${rpc.path}`;
			const dir = rpc.dir !== null && rpc.dir !== "" ? rpc.dir : void 0;
			const data = {
				id: Date.now(),
				jsonrpc: "2.0",
				method: "aria2.addUri",
				params: [[link], {
					...dir ? { dir } : {},
					...normalized["User-Agent"] ? { "user-agent": normalized["User-Agent"] } : {},
					referer: normalized.Referer || `${location.origin}/`,
					out: filename,
					header: headerParts
				}]
			};
			if (rpc.token) data.params.unshift(`token:${rpc.token}`);
			return (await post(url, data, {
				Accept: "application/json",
				"Content-Type": "application/json;charset=UTF-8"
			}, "json", false))?.result ? "success" : "fail";
		});
	} };
	// src/download/download/send-to/idm.ts
	const queue$1 = createQueue();
	let seq = 1;
	function encodeField(key, value) {
		if (value === void 0 || value === null) return "";
		const str = String(value);
		const length = new Blob([str]).size;
		return `${key}=${length}${length > 0 ? `:${str}` : ""}`;
	}
	const idmAdapter = { send({ link, filename, filesize = 0, headers }) {
		return queue$1(async () => {
			const rpc = getIdmClient();
			const normalized = standHeaders(headers);
			const time = Date.now();
			const url = `http://127.0.0.1:1001/client/${rpc}?seq=${seq}`;
			const headersText = Object.entries(normalized).map(([key, value]) => `${key}: ${value}`).join("\n") + "\n";
			const fields = [
				encodeField(4, getExtension(filename)),
				encodeField(6, link),
				encodeField(7, location.origin),
				encodeField(11, headersText),
				encodeField(100, filename),
				encodeField(122, 4)
			];
			const data = `MSG#${seq}#13#1#10241:${seq + 1e3}:0:${time}:0:1:2:${filesize}:0,${fields.join(",")};`;
			const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 15e3));
			const response = await Promise.race([post(url, data, {}, "text", false), timeout]);
			if (response && response.endsWith(`${seq}:3;`)) {
				seq++;
				return "success";
			}
			return "fail";
		});
	} };
	// src/download/settings.ts
	const rpcKeys = {
		aria2: "setting_aria2_rpc",
		abdm: "setting_abdm_rpc"
	};
	function rpcDefault(kind) {
		return kind === "aria2" ? defaultAria2Rpc : defaultAbdmRpc;
	}
	function normalizeRpcList(raw, fallback) {
		let list = raw;
		if (typeof raw === "string") try {
			list = JSON.parse(raw);
		} catch {
			list = null;
		}
		if (Array.isArray(list)) {
			const items = list.filter((item) => !!item && typeof item === "object");
			if (items.length) return items;
		} else if (list && typeof list === "object") return [list];
		return [{ ...fallback }];
	}
	function getRpcList(kind) {
		return normalizeRpcList(gmStore.get(rpcKeys[kind], [rpcDefault(kind)]), rpcDefault(kind));
	}
	function saveRpcList(kind, list) {
		gmStore.set(rpcKeys[kind], list);
	}
	function getDefaultRpc(kind) {
		const list = getRpcList(kind);
		return list.find((item) => item.default) || list[0] || { ...rpcDefault(kind) };
	}
	function getIdmClient() {
		const value = gmStore.get("setting_idm_rpc", "1");
		return String(value || "1");
	}
	function setIdmClient(value) {
		gmStore.set("setting_idm_rpc", value);
	}
	// src/download/download/send-to/abdm.ts
	const queue = createQueue();
	const defaultAbdmRpc = {
		domain: "http://localhost",
		port: "15151",
		path: "",
		key: "",
		default: true
	};
	// src/download/download/send-to/index.ts
	const adapters = {
		idm: idmAdapter,
		aria2: aria2Adapter,
		abdm: { send({ link, filename, headers }) {
			return queue(async () => {
				const normalized = toRequestHeaders(standHeaders(headers));
				const rpc = getDefaultRpc("abdm");
				const url = `${rpc.domain}:${rpc.port}/add`;
				const item = {
					link,
					headers: normalized,
					suggestedName: filename
				};
				if (normalized.Referer) item.downloadPage = normalized.Referer;
				const response = await post(url, [item], {
					"Content-Type": "application/json;charset=UTF-8",
					"X-Api-Key": rpc.key || ""
				}, "text", false);
				return String(response).trim() === "OK" ? "success" : "fail";
			});
		} }
	};
	function sendTo(target, request) {
		return adapters[target].send(request);
	}
	// src/download/download/index.ts
	const methodLabels = {
		api: "API 下载",
		aria2: "Aria2 下载",
		abdm: "ABDM 下载"
	};
	async function startDownload(provider, mode) {
		context.page = provider.detectPage();
		loading.open("获取中");
		try {
			const result = await provider.getLink();
			loading.close();
			renderDownloads(result, mode);
		} catch (error) {
			loading.close();
			toast(errorText(error), "error");
			console.error("[netdisk-download]", error);
		}
	}
	function errorText(error) {
		if (error instanceof Error) return error.message || String(error);
		if (typeof error === "string") return error;
		try {
			return JSON.stringify(error);
		} catch {
			return String(error);
		}
	}
	function renderDownloads(result, mode) {
		const body = document.createElement("div");
		const list = document.createElement("div");
		body.append(list);
		const allLinks = [];
		result.files.forEach((file, index) => {
			if (result.get.dir(file)) return;
			const name = result.get.name(file);
			const size = result.get.size(file);
			const link = result.get.link(file);
			const item = el(`<div class="nd-item" data-index="${index}"></div>`);
			const title = el(`<div class="nd-name"></div>`);
			title.append(document.createTextNode(name));
			const sizeNode = el(`<span class="nd-size"></span>`);
			sizeNode.textContent = sizeFormat(size);
			title.append(sizeNode);
			item.append(title);
			if (!link || !link.includes("http")) {
				const message = el(`<div class="nd-message"></div>`);
				message.textContent = link || "获取下载地址失败，刷新网页后再试试吧~";
				item.append(message);
				list.append(item);
				return;
			}
			allLinks.push(link);
			const actions = el(`<div class="nd-actions"></div>`);
			const addButton = (label, action, className = "") => {
				const button = el(`<button type="button" class="nd-btn ${className}"></button>`);
				button.textContent = label;
				button.dataset.action = action;
				actions.append(button);
			};
			if (mode === "api") {
				addButton("直接下载", "download", "nd-primary");
				addButton("复制地址", "copy-link");
				addButton("复制名称", "copy-name");
				addButton("推送至 IDM", "send-idm");
			} else if (mode === "aria2") {
				const command = toAria2(link, name, result.headers);
				addButton("推送至 Aria2", "send-aria2");
				addButton("复制命令", "copy-aria2");
				const code = el(`<pre class="nd-code"></pre>`);
				code.textContent = command;
				item.append(code);
			} else if (mode === "abdm") addButton("推送至 ABDM", "send-abdm");
			item.append(actions);
			list.append(item);
		});
		const footer = el(`<div class="nd-footer"></div>`);
		const copyAll = el(`<button type="button" class="nd-btn"></button>`);
		copyAll.textContent = "复制全部地址";
		copyAll.dataset.action = "copy-all";
		footer.append(copyAll);
		body.append(footer);
		showModal({
			title: methodLabels[mode],
			body
		}).addEventListener("click", async (event) => {
			const target = event.target.closest("[data-action]");
			if (!target) return;
			const action = target.dataset.action;
			const item = target.closest(".nd-item");
			const index = Number(item?.dataset.index ?? -1);
			const file = result.files[index];
			const link = file ? result.get.link(file) : "";
			const name = file ? result.get.name(file) : "";
			const size = file ? result.get.size(file) : 0;
			switch (action) {
				case "download":
					if (link) iframeDownload(link);
					break;
				case "copy-link":
					if (link) await copyWithFeedback(target, link);
					break;
				case "copy-name":
					if (name) await copyWithFeedback(target, name);
					break;
				case "copy-aria2":
					if (link) await copyWithFeedback(target, toAria2(link, name, result.headers));
					break;
				case "copy-all":
					if (allLinks.length) await copyWithFeedback(target, allLinks.join("\r\n"));
					break;
				case "send-idm":
				case "send-aria2":
				case "send-abdm": {
					const sender = action.slice(5);
					if (link) await sendWithFeedback(target, () => sendTo(sender, {
						link,
						filename: name,
						filesize: size,
						headers: result.headers
					}));
					break;
				}
			}
		});
	}
	async function copyWithFeedback(button, text) {
		const original = button.textContent || "";
		const ok = await setClipboard(text);
		button.textContent = ok ? "复制成功" : "复制失败";
		button.classList.add(ok ? "nd-success" : "nd-danger");
		setTimeout(() => {
			button.textContent = original;
			button.classList.remove("nd-success", "nd-danger");
		}, 1500);
	}
	async function sendWithFeedback(button, action) {
		if (button.dataset.busy) return;
		const original = button.textContent || "";
		button.dataset.busy = "1";
		button.textContent = "发送中...";
		try {
			const ok = await action() === "success";
			button.textContent = ok ? "发送成功" : "发送失败";
			button.classList.add(ok ? "nd-success" : "nd-danger");
			toast(ok ? "发送成功" : "发送失败，请检查下载器配置", ok ? "success" : "error");
		} catch (error) {
			button.textContent = "发送失败";
			button.classList.add("nd-danger");
			toast(plain(errorText(error)), "error");
		} finally {
			setTimeout(() => {
				button.textContent = original;
				button.classList.remove("nd-success", "nd-danger");
				delete button.dataset.busy;
			}, 1800);
		}
	}
	// src/download/ui/settings.ts
	const rpcFields = {
		aria2: [
			{
				key: "domain",
				label: "地址",
				placeholder: "http://localhost"
			},
			{
				key: "port",
				label: "端口",
				placeholder: "6800"
			},
			{
				key: "path",
				label: "路径",
				placeholder: "/jsonrpc"
			},
			{
				key: "token",
				label: "Token",
				placeholder: "可选"
			},
			{
				key: "dir",
				label: "下载目录",
				placeholder: "可选，留空使用默认目录"
			}
		],
		abdm: [
			{
				key: "domain",
				label: "地址",
				placeholder: "http://localhost"
			},
			{
				key: "port",
				label: "端口",
				placeholder: "15151"
			},
			{
				key: "key",
				label: "API Key",
				placeholder: "可选"
			}
		]
	};
	const rpcTitles = {
		aria2: "Aria2 RPC",
		abdm: "ABDM RPC"
	};
	const rpcDefaults = {
		aria2: defaultAria2Rpc,
		abdm: defaultAbdmRpc
	};
	function textInput(value, placeholder = "") {
		const input = el("<input class=\"nd-input\" type=\"text\">");
		input.value = value === void 0 || value === null ? "" : String(value);
		input.placeholder = placeholder;
		return input;
	}
	function labeled(label, input) {
		const field = el("<label class=\"nd-field\"></label>");
		const text = el("<span></span>");
		text.textContent = label;
		field.append(text, input);
		return field;
	}
	function createRpcRow(kind, config) {
		const row = el("<div class=\"nd-rpc\"></div>");
		const head = el("<div class=\"nd-rpc-head\"></div>");
		const defaultLabel = el("<label class=\"nd-radio\"></label>");
		const radio = document.createElement("input");
		radio.type = "radio";
		radio.name = `nd-default-${kind}`;
		radio.checked = !!config.default;
		defaultLabel.append(radio, document.createTextNode("默认"));
		const remove = el("<button type=\"button\" class=\"nd-btn nd-danger\">删除</button>");
		remove.dataset.remove = "1";
		head.append(defaultLabel, remove);
		const grid = el("<div class=\"nd-grid\"></div>");
		for (const field of rpcFields[kind]) {
			const input = textInput(config[field.key], field.placeholder);
			input.dataset.key = field.key;
			grid.append(labeled(field.label, input));
		}
		row.append(head, grid);
		return row;
	}
	function createRpcSection(kind) {
		const section = el("<section class=\"nd-section\"></section>");
		const head = el("<div class=\"nd-section-head\"></div>");
		const title = el("<h4></h4>");
		title.textContent = rpcTitles[kind];
		const add = el("<button type=\"button\" class=\"nd-btn\">添加</button>");
		head.append(title, add);
		const list = el("<div class=\"nd-rpc-list\"></div>");
		list.dataset.kind = kind;
		const configs = getRpcList(kind);
		if (!configs.some((config) => config.default)) configs[0].default = true;
		configs.forEach((config) => list.append(createRpcRow(kind, config)));
		add.addEventListener("click", () => {
			list.append(createRpcRow(kind, {
				...rpcDefaults[kind],
				default: false
			}));
		});
		list.addEventListener("click", (event) => {
			const button = event.target.closest("[data-remove]");
			if (!button) return;
			if (list.querySelectorAll(".nd-rpc").length <= 1) {
				toast("至少保留一个 RPC 配置", "info");
				return;
			}
			const row = button.closest(".nd-rpc");
			const wasDefault = !!row.querySelector("input[type=radio]")?.checked;
			row.remove();
			if (wasDefault) {
				const next = list.querySelector("input[type=radio]");
				if (next) next.checked = true;
			}
		});
		section.append(head, list);
		return {
			section,
			list
		};
	}
	function readRpcList(kind, list) {
		const configs = [];
		for (const row of list.querySelectorAll(".nd-rpc")) {
			const config = { path: "" };
			for (const field of rpcFields[kind]) {
				const input = row.querySelector(`[data-key="${field.key}"]`);
				config[field.key] = input?.value.trim() || "";
			}
			config.default = !!row.querySelector("input[type=radio]")?.checked;
			configs.push(config);
		}
		if (configs.length === 0) throw new Error("请至少添加一个 RPC 配置");
		configs.forEach((config, index) => {
			const name = `${rpcTitles[kind]} 第 ${index + 1} 项`;
			const port = Number(config.port);
			if (!config.domain) throw new Error(`${name}：请填写地址`);
			if (!/^\d+$/.test(config.port) || port < 1 || port > 65535) throw new Error(`${name}：端口应为 1-65535`);
			if (kind === "aria2" && !config.path) throw new Error(`${name}：请填写路径`);
			if (!/^https?:\/\//i.test(config.domain)) config.domain = `http://${config.domain}`;
			config.domain = config.domain.replace(/\/+$/, "");
			if (config.path && !config.path.startsWith("/")) config.path = `/${config.path}`;
		});
		if (!configs.some((config) => config.default)) configs[0].default = true;
		return configs;
	}
	function openSettings() {
		const body = el("<div class=\"nd-settings\"></div>");
		const general = el("<section class=\"nd-section\"></section>");
		const generalTitle = el("<h4>通用</h4>");
		const idm = textInput(getIdmClient(), "1");
		const grid = el("<div class=\"nd-grid\"></div>");
		grid.append(labeled("IDM 客户端编号", idm));
		general.append(generalTitle, grid);
		const aria2 = createRpcSection("aria2");
		const abdm = createRpcSection("abdm");
		const footer = el("<div class=\"nd-settings-footer\"></div>");
		const errorNode = el("<div class=\"nd-settings-error\"></div>");
		const cancel = el("<button type=\"button\" class=\"nd-btn\">取消</button>");
		const save = el("<button type=\"button\" class=\"nd-btn nd-primary\">保存</button>");
		footer.append(errorNode, cancel, save);
		body.append(general, aria2.section, abdm.section, footer);
		showModal({
			title: "下载设置",
			body
		});
		cancel.addEventListener("click", closeModal);
		save.addEventListener("click", () => {
			try {
				const aria2List = readRpcList("aria2", aria2.list);
				const abdmList = readRpcList("abdm", abdm.list);
				saveRpcList("aria2", aria2List);
				saveRpcList("abdm", abdmList);
				setIdmClient(idm.value.trim() || "1");
				closeModal();
				toast("设置已保存", "success");
			} catch (error) {
				errorNode.textContent = error instanceof Error ? error.message : String(error);
			}
		});
	}
	// src/download/ui/button.ts
	function createButton(onSelect) {
		ensureGlobalCloseListener();
		const wrap = el(`<div class="nd-button-wrap netdisk-download">
    <button class="nd-trigger" type="button">下载助手</button>
    <ul class="nd-menu"></ul>
  </div>`);
		const menu = wrap.querySelector(".nd-menu");
		for (const mode of Object.keys(methodLabels)) {
			const item = el(`<li class="nd-menu-item"></li>`);
			item.dataset.mode = mode;
			item.textContent = methodLabels[mode];
			menu.append(item);
		}
		const separator = el(`<li class="nd-menu-sep"></li>`);
		const settings = el(`<li class="nd-menu-item"></li>`);
		settings.dataset.settings = "1";
		settings.textContent = "设置";
		menu.append(separator, settings);
		wrap.querySelector(".nd-trigger").addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			wrap.classList.toggle("open");
		});
		menu.addEventListener("click", (event) => {
			const target = event.target.closest("[data-mode], [data-settings]");
			if (!target) return;
			wrap.classList.remove("open");
			if (target.dataset.settings) openSettings();
			else onSelect(target.dataset.mode);
		});
		return wrap;
	}
	let globalCloseBound = false;
	function ensureGlobalCloseListener() {
		if (globalCloseBound) return;
		globalCloseBound = true;
		document.addEventListener("click", (event) => {
			for (const wrap of document.querySelectorAll(".nd-button-wrap.open")) if (!wrap.contains(event.target)) wrap.classList.remove("open");
		});
	}
	function mountProviderButton(provider, mounts) {
		for (const selector of mounts) waitForKeyElements(selector, (element) => {
			if (document.querySelector(".nd-button-wrap")) return;
			if (element.querySelector(":scope > .nd-button-wrap")) return;
			element.prepend(createButton((mode) => startDownload(provider, mode)));
		}, false);
	}
	// src/download/providers/123pan.ts
	const mount$7 = {
		home: ".home-operator .home-operator-button-group",
		share: ".content .content-header-container-wrap .rightInfo, .single-file-sharing-container-content-file-operate"
	};
	const api$6 = {
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 123pan/3.2.3 Chrome/108.0.5359.215 Electron/22.3.27 Safari/537.36 WebView/1.0",
		os: "123pan/v323(Windows10.0.26200)",
		version: "323",
		secCh: "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\"",
		getLink: "https://api.123pan.cn/api/v2/file/download_info",
		getShareLink: "https://api.123pan.cn/api/v2/share/download/info"
	};
	function getToken$4() {
		loading.title("令牌获取中");
		loading.update("正在获取令牌~");
		return localStore.get("authorToken", "");
	}
	function getUUID() {
		loading.title("用户标识获取中");
		loading.update("正在获取用户标识~");
		return localStore.get("LoginUuid", "");
	}
	async function getFileUrl$4(item, index, token, uuid, shareKey) {
		const headers = {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json; charset=UTF-8",
			Authorization: `Bearer ${token}`,
			"User-Agent": api$6.ua,
			"Sec-Ch-Ua": api$6.secCh,
			Platform: "web",
			Platform_os: api$6.os,
			"App-Version": api$6.version,
			LoginUuid: uuid || "",
			Devicename: "",
			"Mac-Addr": ""
		};
		const response = shareKey ? await post(api$6.getShareLink, {
			ShareKey: shareKey,
			FileID: item.FileId,
			S3keyFlag: item.S3KeyFlag,
			Size: item.Size,
			Etag: item.Etag
		}, headers) : await post(api$6.getLink, {
			driveId: 0,
			etag: item.Etag,
			fileId: item.FileId,
			s3keyFlag: item.S3KeyFlag,
			type: item.Type,
			fileName: item.FileName,
			size: item.Size
		}, headers);
		if (response?.data?.dispatchList?.length > 0 && response?.data?.downloadPath) {
			let url = `${response.data.dispatchList[0].prefix || ""}${response.data.downloadPath}`;
			try {
				const params = new URL(url).searchParams.get("params");
				if (params) url = decodeBase(params);
			} catch {}
			return {
				index,
				downloadUrl: url
			};
		}
		if (response?.code) {
			if (response.code == 5112) throw new Error("提示：<br/>请先登录网盘后再获取地址~");
			if (response.code == 5113) return {
				index,
				downloadUrl: "获取下载地址失败，本月免费流量不足，请开通网盘会员~"
			};
		}
		return {
			index,
			downloadUrl: `获取下载地址失败，${response?.message ? `服务器说：${response.message}。` : "刷新后再试试吧~"}`
		};
	}
	function getSelectedList$8() {
		try {
			const selected = [];
			const props = findReact(document.querySelector(".ant-table-wrapper, .tiled-list, .file-list, .single-file-sharing-container-content, .custom-table-wrapper, [class^=\"mfy_h-table-module__shell__\"]"))?.pendingProps;
			if (!props) return selected;
			const fileList = props.dataSource || props.loadedFileList || props.files || [];
			const selectedKeys = props.rowSelection?.selectedRowKeys || [];
			for (const file of fileList) if (file?.checked === true || selectedKeys.includes(file.FileId)) selected.push(file);
			if (props.file?.S3KeyFlag) selected.push(props.file);
			return selected;
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[123 云盘] 获取已勾选文件列表失败");
		}
	}
	function detectPage$7() {
		const path = location.pathname;
		if (/^\/$/.test(path)) return "home";
		if (/^\/(s|123pan)\//.test(path)) return "share";
		return "";
	}
	async function getLink$8() {
		let selects = getSelectedList$8();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => item.Type !== 0)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		const page = contextPage$5();
		const token = getToken$4();
		const uuid = getUUID();
		const shareKey = page === "share" ? location.pathname.split("/").filter(Boolean)[1] : void 0;
		const batchSize = 15;
		let processed = 0;
		selects = selects.filter((item) => item.Type === 0);
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		for (let i = 0; i < selects.length; i += batchSize) {
			const queue = selects.slice(i, i + batchSize).map((item, localIndex) => {
				return getFileUrl$4(item, i + localIndex, token, uuid, shareKey).then((value) => {
					processed++;
					loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
					return value;
				});
			});
			(await Promise.all(queue)).forEach((value) => {
				selects[value.index].DownloadUrl = value.downloadUrl;
			});
			await sleep(1e3);
		}
		return {
			files: selects,
			get: {
				dir: (file) => file.Type !== 0,
				name: (file) => file.FileName,
				size: (file) => file.Size,
				link: (file) => file.DownloadUrl || file.DownloadURL
			},
			headers: {}
		};
	}
	function contextPage$5() {
		return detectPage$7();
	}
	const pan123 = {
		detectPage: detectPage$7,
		addButton() {
			mountProviderButton(this, [mount$7.home, mount$7.share]);
		},
		getLink: getLink$8
	};
	// src/download/providers/aliyun.ts
	const mount$6 = {
		home: "[class^=\"header--\"]>[class^=\"actions--\"]",
		list: "[class^=\"node-list-table-view--\"]",
		grid: "[class^=\"node-list-grid-view--\"]",
		switch: "[class^=\"switch-wrapper--\"]"
	};
	function apiBase() {
		return location.host.replace("www", "api");
	}
	function getSelectedList$7() {
		try {
			const list = [];
			const props = findReact(document.querySelector(mount$6.list), 1)?.pendingProps;
			if (!props) return list;
			const fileList = props.dataSource || [];
			const selectedKeys = String(props.selectedKeys || "").split(",");
			for (const file of fileList) if (selectedKeys.includes(file.fileId)) list.push(file);
			return clone(list);
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[阿里云盘] 获取已勾选文件列表失败");
		}
	}
	async function getFilesUrl$1(items, token) {
		items = items.filter((item) => item.type === "file");
		const batchSize = 3;
		let processed = 0;
		const pending = items.filter((item) => {
			const index = context.glinks.findIndex((cache) => cache.id == item.fileId);
			if (index === -1) return true;
			const cached = context.glinks[index];
			if (cached.expires > Date.now()) {
				Object.assign(item, cached.data);
				processed++;
				return false;
			}
			context.glinks.splice(index, 1);
			return true;
		});
		for (let i = 0; i < pending.length; i += batchSize) {
			const batch = pending.slice(i, i + batchSize);
			await Promise.all(batch.map(async (item) => {
				const response = await post(`https://${apiBase()}/v2/file/get_download_url`, {
					drive_id: item.driveId,
					file_id: item.fileId
				}, {
					Authorization: token,
					"X-Canary": "client=windows,app=adrive,version=v6.0.0"
				});
				if (!response || !response.url || response.code) {
					if (response?.code === "AccessTokenInvalid") throw new Error("提示：<br/>访问令牌过期了，请刷新后重试~");
					if (response?.code) batch.forEach((entry) => {
						entry.downloadUrl = `获取下载地址失败，服务器说：${response.code}`;
					});
					else throw new Error("提示：<br/>获取下载地址失败，刷新网页后再试试吧~");
				}
				Object.assign(item, response);
				context.glinks.push({
					id: item.fileId,
					expires: Date.now() + 3e5,
					data: response
				});
				processed++;
				loading.update(`已获取 ${processed} / ${pending.length} 个地址`);
			}));
			if (i + batchSize < pending.length) await sleep(1e3);
		}
		return clone(items);
	}
	function detectPage$6() {
		const path = location.pathname;
		if (/^\/drive/.test(path)) return "home";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function getLink$7() {
		if (document.querySelector(mount$6.grid)) {
			if (confirm("请先切换到列表视图后再获取下载地址，是否立即切换？")) {
				document.querySelector(mount$6.switch)?.click();
				toast("已切换为列表视图，请再获取一次下载地址~", "success");
			}
			throw new Error("请切换到列表视图后再试~");
		}
		let selects = getSelectedList$7();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => item.type !== "file")) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		if (context.page !== "home") throw new Error("提示：<br/>请在我的网盘页面使用下载助手~");
		selects = selects.filter((item) => item.type === "file");
		const tokenInfo = localStore.get("token");
		if (!tokenInfo?.access_token) throw new Error("提示：<br/>请先登录网盘~");
		const token = `${tokenInfo.token_type} ${tokenInfo.access_token}`;
		selects = await getFilesUrl$1(selects, token);
		return {
			files: selects,
			get: {
				dir: (file) => file.type === "folder",
				name: (file) => file.name,
				size: (file) => file.size,
				link: (file) => file.downloadUrl || file.url
			},
			headers: {}
		};
	}
	const aliyun = {
		detectPage: detectPage$6,
		addButton() {
			mountProviderButton(this, [mount$6.home]);
		},
		getLink: getLink$7
	};
	// src/download/providers/baidu.ts
	const baiduApi = {
		getAccessToken: "https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&scope=basic,netdisk&client_id=omiOnr2tYnN9vSyDErcVFWpPU2mZA7YO&redirect_uri=oob&confirm_login=0",
		getLink: "https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1",
		getFiles: "https://pan.baidu.com/rest/2.0/xpan/file?method=list&showempty=1",
		getShareLink: "https://pan.baidu.com/api/sharedownload?channel=chunlei&clienttype=0&web=1&app_id=250528",
		getShareSign: "https://pan.baidu.com/share/tplconfig?fields=sign,timestamp&channel=chunlei&web=1&app_id=250528&clienttype=0&view_mode=1",
		ua: "pan.baidu.com"
	};
	async function getToken$3() {
		loading.title("令牌获取中");
		loading.update("正在获取授权状态~");
		const authorize = await getFinal(baiduApi.getAccessToken, {
			Origin: "",
			Referer: ""
		}, true);
		let accessToken = "";
		if (authorize.includes("authorize")) {
			loading.update("正在获取授权页面~");
			const html = await get(baiduApi.getAccessToken, {}, "text", false);
			const bdstoken = html.match(/name="bdstoken"\s+value="([^"]+)"/)?.[1];
			const clientId = html.match(/name="client_id"\s+value="([^"]+)"/)?.[1];
			loading.update("正在自动确认授权~");
			await post(baiduApi.getAccessToken, stringify({
				grant_permissions_arr: "netdisk",
				bdstoken,
				client_id: clientId,
				response_type: "token",
				display: "page",
				grant_permissions: "basic,netdisk"
			}), {
				Origin: "",
				Referer: "",
				"Content-Type": "application/x-www-form-urlencoded"
			});
			accessToken = (await getFinal(baiduApi.getAccessToken, {
				Origin: "",
				Referer: ""
			}, true)).match(/access_token=([^&]+)/)?.[1] || "";
		} else if (authorize.includes("access_token=")) accessToken = authorize.match(/access_token=([^&]+)/)?.[1] || "";
		if (!accessToken) return "";
		loading.update("授权成功，令牌已缓存~");
		gmStore.set("baidu_access_token", accessToken);
		return accessToken;
	}
	function getShareData() {
		const url = new URL(location.href);
		const win = unsafeWindow;
		const locals = win?.locals?.dump?.();
		const surl = (url.pathname.split("/").pop() || "").replace(/^1(.{22})$/, "$1");
		const pwd = localStorage.getItem(`${surl}_pwd`) || localStorage.getItem(`1${surl}_pwd`) || url.searchParams.get("pwd");
		return {
			share: {
				id: locals?.shareid?.value,
				url: surl,
				pwd,
				uk: locals?.share_uk?.value
			},
			baidu: {
				id: document.cookie.split("BAIDUID=")?.[1]?.split(";")?.[0],
				token: locals?.bdstoken?.value
			},
			jsToken: win?.jsToken,
			sekey: win?.currentSekey || win?.cache?.list?.config?.params?.sekey,
			sign: "",
			timestamp: ""
		};
	}
	async function getFilesUrl(items, token) {
		items = items.filter((item) => !item.isdir);
		const batchSize = 50;
		let processed = 0;
		const pending = items.filter((item) => {
			const index = context.glinks.findIndex((cache) => cache.id == item.fs_id);
			if (index === -1) return true;
			const cached = context.glinks[index];
			if (cached.expires > Date.now()) {
				Object.assign(item, cached.data);
				processed++;
				return false;
			}
			context.glinks.splice(index, 1);
			return true;
		});
		for (let i = 0; i < pending.length; i += batchSize) {
			const batch = pending.slice(i, i + batchSize);
			const url = new URL(baiduApi.getLink);
			url.searchParams.set("fsids", JSON.stringify(batch.map((item) => item.fs_id)));
			url.searchParams.set("access_token", token);
			const response = await get(url.toString(), { "User-Agent": baiduApi.ua });
			if (!response || response.errno !== 0 || !response.list) {
				if (response?.errno === 112) throw new Error("提示：<br/>页面已过期，请刷新后重试~");
				if (response?.errno === 9019) {
					gmStore.del("baidu_access_token");
					throw new Error("提示：<br/>访问令牌已过期，再获取一次吧~");
				}
				if (response?.errno || response?.errmsg) batch.forEach((item) => {
					item.dlink = `获取下载地址失败，服务器说：${response.errno || ""} ${response.errmsg || ""}`.trim();
				});
				else throw new Error("提示：<br/>获取下载地址失败，刷新网页后再试试吧~");
			}
			batch.forEach((item) => {
				const matched = response?.list?.find?.((entry) => entry.fs_id == item.fs_id);
				if (!matched) return;
				Object.assign(item, matched);
				context.glinks.push({
					id: item.fs_id,
					expires: Date.now() + 144e5,
					data: matched
				});
			});
			processed += response.list?.length || 0;
			loading.update(`已获取 ${processed} / ${items.length} 个地址`);
			if (i + batchSize < pending.length) await sleep(1e3);
		}
		return clone(items);
	}
	async function getShareFilesUrl(items, shareData) {
		items = items.filter((item) => !item.isdir);
		let processed = 0;
		const pending = items.filter((item) => {
			const index = context.glinks.findIndex((cache) => cache.id == item.fs_id);
			if (index === -1) return true;
			const cached = context.glinks[index];
			if (cached.expires > Date.now()) {
				Object.assign(item, cached.data);
				processed++;
				return false;
			}
			context.glinks.splice(index, 1);
			return true;
		});
		for (const item of pending) {
			const url = new URL(baiduApi.getShareLink);
			url.searchParams.set("sign", shareData.sign);
			url.searchParams.set("timestamp", shareData.timestamp);
			url.searchParams.set("bdstoken", shareData.baidu.token);
			url.searchParams.set("logid", encodeBase(shareData.baidu.id));
			url.searchParams.set("jsToken", shareData.jsToken);
			const data = new URLSearchParams({
				encrypt: "0",
				product: "share",
				uk: String(shareData.share.uk),
				primaryid: String(shareData.share.id),
				fid_list: JSON.stringify([item.fs_id])
			});
			if (shareData.sekey) data.set("extra", JSON.stringify({ sekey: shareData.sekey }));
			const response = await post(url.toString(), data);
			if (!response || response.errno !== 0 || !response.list) {
				if (response?.errno === 112) throw new Error("提示：<br/>页面已过期，请刷新后重试~");
				if (response?.errno === 9019) {
					gmStore.del("baidu_access_token");
					throw new Error("提示：<br/>访问令牌已过期，再获取一次吧~");
				}
				if (response?.errno || response?.errmsg) item.dlink = `获取下载地址失败，服务器说：${response.errno || ""} ${response.errmsg || ""}`.trim();
				else throw new Error("提示：<br/>获取下载地址失败，刷新网页后再试试吧~");
			}
			if (Array.isArray(response.list)) Object.assign(item, response.list[0]);
			if (typeof response.list === "string") item.dlink = "获取下载地址失败，服务器说：此文件大小超过可获取限制，需要保存到网盘后于网盘中下载。";
			context.glinks.push({
				id: item.fs_id,
				expires: Date.now() + 144e5,
				data: Array.isArray(response.list) ? response.list[0] : {}
			});
			processed++;
			loading.update(`已获取 ${processed} / ${items.length} 个地址`);
			if (processed < pending.length) await sleep(1e3);
		}
		return clone(items);
	}
	async function getFilesList(dirs, accessToken, processed = 0) {
		let count = 0;
		async function walk(targets) {
			let files = [];
			for (const dir of targets) {
				loading.title("文件获取中");
				const response = await get(`${baiduApi.getFiles}&dir=${encodeURIComponent(dir.path)}&access_token=${accessToken}`.toString(), { "User-Agent": baiduApi.ua });
				count++;
				if (response.list?.length && (response.errno === 0 || response.errmsg === "succ")) {
					const subFiles = response.list.filter((file) => !file.isdir);
					processed += subFiles.length;
					loading.update(`已获取 ${processed} 个文件~\n${dir.path}`);
					files = files.concat(subFiles);
					const subDirs = response.list.filter((file) => file.isdir);
					if (subDirs.length) files = files.concat(await walk(subDirs));
				}
				if (count >= 50) {
					loading.update(`已获取 ${processed} 个文件~\n休息 3 秒...`);
					await sleep(3e3);
					count = 0;
				}
			}
			return files;
		}
		return walk(dirs);
	}
	function getSelectedList$6() {
		try {
			let list = [];
			const fileList = document.querySelector(".file-list");
			if (fileList?.__vue__?.allFileList?.[0]) list = fileList.__vue__.allFileList.filter((item) => !!item.selected);
			const core = document.querySelector(".wp-s-core-pan");
			if (core?.__vue__?.selectedList?.[0]) list = core.__vue__.selectedList;
			const ctx = unsafeWindow.require?.("system-core:context/context.js");
			if (ctx?.instanceForSystem?.list?.getSelected?.()?.[0]) list = ctx.instanceForSystem.list.getSelected();
			const share = getShareSelectedList();
			if (share?.[0]) list = share;
			return clone(list);
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[百度网盘] 获取已勾选文件列表失败");
		}
	}
	function getShareSelectedList() {
		try {
			const toArray = (value) => {
				if (value && typeof value === "object" && "value" in value) value = value.value;
				return value ? Array.from(value) : [];
			};
			const root = document.querySelector("#app");
			const listView = findVueComponent("ListView", root);
			if (listView) {
				const { files, isSelected } = listView.props;
				return toArray(files).filter((file) => {
					try {
						return isSelected(file) || isSelected(String(file.fs_id)) || isSelected(file.fs_id);
					} catch {
						return false;
					}
				});
			}
			const ctx = findVueComponent("ShareHeader", root)?.props?.context;
			if (ctx?.pageKind === "single") {
				const file = toArray(ctx.files)[0];
				if (file) return [file];
			}
			const preview = findVueComponent([
				"DocViewer",
				"FileInfoPreview",
				"PicturePreview",
				"AudioPreview",
				"VideoPreview"
			], root);
			if (preview?.props?.file) return [preview.props.file];
			return [];
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[百度网盘][分享] 获取已勾选文件列表失败");
		}
	}
	function detectPage$5() {
		const path = location.pathname;
		if (/^\/disk\/home/.test(path)) return "home";
		if (/^\/disk\/main/.test(path)) return "main";
		if (/^\/youth\/pan\/main/.test(path)) return "youth";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function getLink$6() {
		let token = gmStore.get("baidu_access_token", "");
		if (!token) token = await getToken$3().catch((error) => {
			console.warn("[netdisk-download] get baidu token failed", error);
			return "";
		});
		if (!token) {
			gmStore.del("baidu_access_token");
			toast("请在新标签页中完成授权后，重新点击下载助手~", "info");
			GM_openInTab(baiduApi.getAccessToken, {
				active: true,
				insert: true,
				setParent: true
			});
			throw new Error("提示：<br/>请在新标签页授权后再获取一次~");
		}
		const selects = getSelectedList$6();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		let files = selects.filter((file) => !file.isdir);
		const dirs = selects.filter((file) => file.isdir);
		if (context.page === "home" || context.page === "main") {
			if (dirs.length) files = files.concat(await getFilesList(dirs, token, files.length));
			if (!files.length) throw new Error("提示：<br/>文件夹是空的哦~");
			loading.update("正在获取文件对应的下载地址~");
			files = await getFilesUrl(files, token);
		} else if (context.page === "share") {
			if (files.every((file) => file.isdir === 1)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
			const shareData = getShareData();
			const sign = await get(`${baiduApi.getShareSign}&surl=1${shareData.share.url}&bdstoken=${shareData.baidu.token}&logid=${encodeBase(shareData.baidu.id)}`);
			if (sign?.data?.sign && sign?.data?.timestamp) {
				shareData.sign = sign.data.sign;
				shareData.timestamp = sign.data.timestamp;
			}
			files = await getShareFilesUrl(files, shareData);
		} else throw new Error("提示：<br/>页面错误~");
		return {
			files,
			get: {
				dir: (file) => file.isdir === 1,
				name: (file) => file.server_filename || file.filename,
				size: (file) => file.size,
				link: (file) => {
					if (!file.dlink || !file.dlink.startsWith("http")) return file.dlink;
					const url = new URL(file.dlink);
					url.searchParams.set("access_token", token);
					return url.href;
				}
			},
			headers: { "User-Agent": baiduApi.ua }
		};
	}
	const baidu = {
		detectPage: detectPage$5,
		addButton() {
			const mount = {
				home: ".frame-main>div>div>div>div:has(.g-dropdown-button.g-new-create)",
				main: ".wp-s-agile-tool-bar__header",
				share: ".module-share-top-bar .x-button-box .g-dropdown-button.tools-more",
				share_v2: ".module-share-bottom-bar.share-bottom-btns > .bar > .x-button-box"
			};
			mountProviderButton(this, [
				mount.home,
				mount.main,
				mount.share,
				mount.share_v2
			]);
		},
		getLink: getLink$6
	};
	// src/download/providers/baidu-authorize.ts
	const allowedClientIds = [
		new URL(baiduApi.getAccessToken).searchParams.get("client_id"),
		"L6g70tBRRIXLsY0Z3HwKqlRE",
		"NqOMXF6XGhGRIGemsQ9nG0Na",
		"fSds3K4w43rw37tOqlQmTa2kDwaczK4U",
		"TFwtw8uwHxpdkvVqVKdIlx1XqXUnr1zG",
		"9dgBV9yesuBVOXaxls7aVHbLBLqU8yyg",
		"l9DdBOG4RYroMscmzK5OChdaGelgd92M",
		"Kyr013gHQBf2immy3fQt1jZ3nZVpiGAm",
		"iYCeC9g08h5vuP9UqvPHKKSVrKFXGa1v",
		"omiOnr2tYnN9vSyDErcVFWpPU2mZA7YO",
		"QHOuRXiepJBMjtk0esLhrPoNlQyYd0mF",
		"IlLqBbU3GjQ0t46TRwFateTprHWl39zF",
		"iG6ghsi9r0RR0jTFCrlvTjX9",
		"YgMAXXnP0Lziw0LPVbc6E4zm"
	];
	function authorize() {
		const url = new URL(location.href);
		if (/openapi\.baidu\.com\/oauth\/2\.0\/authorize/.test(location.href)) {
			const clientId = url.searchParams.get("client_id") || "";
			if (!allowedClientIds.includes(clientId)) return;
			if (!url.searchParams.get("response_type")?.includes("token")) return;
			if (!url.searchParams.get("scope")?.includes("netdisk")) return;
			waitForKeyElements("button#auth-allow", (element) => {
				element.click();
			}, true);
			return;
		}
		if (/openapi\.baidu\.com\/oauth\/2\.0\/login_success/.test(location.href)) {
			const timer = setInterval(() => {
				if (!location.href.includes("access_token")) return;
				clearInterval(timer);
				const token = location.href.match(/access_token=(.*?)&/)?.[1];
				if (!token) return;
				gmStore.set("baidu_access_token", token);
				toast("百度网盘授权成功，5 秒后自动关闭~", "success");
				setTimeout(() => window.close(), 5e3);
			}, 200);
		}
	}
	const baiduAuthorize = {
		detectPage() {
			return "";
		},
		addButton() {
			authorize();
		},
		async getLink() {
			throw new Error("当前页面无需获取下载地址~");
		}
	};
	// src/download/providers/guangya.ts
	const mount$5 = {
		home: "#root #app div > div:has(> .ant-btn.ant-btn-primary.ant-btn-color-primary .ant-btn-icon > .swangpan-icon-upload):has(> .ant-btn.ant-btn-default.ant-btn-color-default .ant-btn-icon > .swangpan-icon-addfolder)",
		share: "#root #app div > div:has(> .ant-btn.ant-btn-lg .ant-btn-icon > .swangpan-icon-download)"
	};
	const api$5 = {
		getLink: "https://api.guangyapan.com/nd.bizuserres.s/v1/get_res_download_url",
		getShareLink: "https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_download_url",
		getShareToken: "https://api.guangyapan.com/nd.bizuserres.s/v1/get_share_access_token"
	};
	const shareCode = { value: "" };
	function getToken$2() {
		loading.title("令牌获取中");
		loading.update("正在获取状态~");
		let credentials = {};
		let captcha = {};
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key) continue;
			if (/^credentials_/.test(key)) credentials = localStore.get(key) || {};
			if (/^captcha_[\w]{16}/.test(key)) captcha = localStore.get(key) || {};
		}
		const rawDeviceId = String(localStore.get("deviceid", ""));
		const deviceid = /(\w{32})/.exec(rawDeviceId.split(",")[0])?.[0] || "";
		return {
			credentials,
			captcha,
			deviceid
		};
	}
	async function getShareToken(token) {
		const url = new URL(location.href);
		const shareId = url.pathname.match(/\/s\/([^/?#]+)/)?.[1] || "";
		const input = document.querySelector("input.ant-input[type=text]");
		const code = url.searchParams.get("code") || shareCode.value || input?.value.trim() || "";
		const response = await post(api$5.getShareToken, {
			shareId,
			code
		}, {
			Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
			"Content-Type": "application/json",
			"X-Captcha-Token": token.captcha.captcha_token,
			"X-Device-Id": token.deviceid
		});
		if (response?.data?.accessToken) return response.data.accessToken;
		throw new Error(`提示：<br/>获取分享令牌失败，${response?.msg ? `服务器说：${response.msg}。` : "刷新后再试试吧~"}`);
	}
	async function getFileUrl$3(item, index, token, shareToken) {
		if (item.downloadUrl) return {
			index,
			downloadUrl: item.downloadUrl
		};
		const headers = {
			Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
			"Content-Type": "application/json",
			"X-Captcha-Token": token.captcha.captcha_token,
			"X-Device-Id": token.deviceid
		};
		const response = shareToken ? await post(api$5.getShareLink, {
			fileId: item.fileId,
			accessToken: shareToken
		}, headers) : await post(api$5.getLink, { fileId: item.fileId }, headers);
		if (response?.data?.signedURL || response?.data?.downloadUrl) return {
			index,
			downloadUrl: response.data.signedURL ?? response.data.downloadUrl
		};
		if (response?.code != null) {
			if (response.code == 9) return {
				index,
				downloadUrl: "获取下载地址失败，页面验证过期，请刷新后重试~"
			};
			if (response.code == 103) return {
				index,
				downloadUrl: "获取下载地址失败，后端响应超时，请重试~"
			};
			if (response.code == 207) return {
				index,
				downloadUrl: "获取下载地址失败，分享者未打开免登录下载~"
			};
			if (response.code == 254) return {
				index,
				downloadUrl: "获取下载地址失败，非会员下载大小超限~"
			};
			return {
				index,
				downloadUrl: `获取下载地址失败，${response.msg || response.code}`
			};
		}
		return {
			index,
			downloadUrl: `获取下载地址失败，${response?.msg ? `服务器说：${response.msg}。` : "刷新后再试试吧~"}`
		};
	}
	async function getSelectedList$5() {
		try {
			const props = findReact(document.querySelector(".swangpan-file-list__root[data-ui=\"file-list\"]"))?.pendingProps;
			if (!props) return [];
			return (props.model.items || []).filter((item) => item.selected).map((item) => item.record);
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[光鸭云盘] 获取已勾选文件列表失败");
		}
	}
	function detectPage$4() {
		const path = location.pathname;
		if (/^\/$/.test(path)) return "home";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function getLink$5() {
		const selects = await getSelectedList$5();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => item.resType == 2)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		const token = getToken$2();
		const shareToken = contextPage$4() === "share" ? await getShareToken(token) : void 0;
		const batchSize = 15;
		let processed = 0;
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		for (let i = 0; i < selects.length; i += batchSize) {
			const queue = selects.slice(i, i + batchSize).map((item, localIndex) => {
				return getFileUrl$3(item, i + localIndex, token, shareToken).then((value) => {
					processed++;
					loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
					return value;
				});
			});
			(await Promise.all(queue)).forEach((value) => {
				selects[value.index].downloadUrl = value.downloadUrl;
			});
			await sleep(1e3);
		}
		return {
			files: selects,
			get: {
				dir: (file) => file.resType == 2,
				name: (file) => file.fileName,
				size: (file) => file.fileSize,
				link: (file) => file.downloadUrl
			},
			headers: {}
		};
	}
	function contextPage$4() {
		return detectPage$4();
	}
	const guangya = {
		detectPage: detectPage$4,
		addButton() {
			mountProviderButton(this, [mount$5.home, mount$5.share]);
			if (detectPage$4() === "share") waitForKeyElements("input.ant-input[type=text]", (element) => {
				if (element.dataset.codeBound) return;
				element.dataset.codeBound = "1";
				element.addEventListener("input", () => {
					const value = element.value.trim();
					if (value) shareCode.value = value;
				});
			}, false);
		},
		getLink: getLink$5
	};
	// src/download/md5.ts
	const S = [
		7,
		12,
		17,
		22,
		7,
		12,
		17,
		22,
		7,
		12,
		17,
		22,
		7,
		12,
		17,
		22,
		5,
		9,
		14,
		20,
		5,
		9,
		14,
		20,
		5,
		9,
		14,
		20,
		5,
		9,
		14,
		20,
		4,
		11,
		16,
		23,
		4,
		11,
		16,
		23,
		4,
		11,
		16,
		23,
		4,
		11,
		16,
		23,
		6,
		10,
		15,
		21,
		6,
		10,
		15,
		21,
		6,
		10,
		15,
		21,
		6,
		10,
		15,
		21
	];
	const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));
	function add32(a, b) {
		return a + b & 0xffffffff;
	}
	function rotl(value, shift) {
		return value << shift | value >>> 32 - shift;
	}
	function toBytes(input) {
		const utf8 = unescape(encodeURIComponent(input));
		const bytes = [];
		for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
		return bytes;
	}
	function md5(input) {
		const bytes = toBytes(input);
		const bitLength = bytes.length * 8;
		bytes.push(128);
		while (bytes.length % 64 !== 56) bytes.push(0);
		const low = bitLength >>> 0;
		const high = Math.floor(bitLength / 2 ** 32);
		for (let i = 0; i < 4; i++) bytes.push(low >>> i * 8 & 255);
		for (let i = 0; i < 4; i++) bytes.push(high >>> i * 8 & 255);
		let a = 0x67452301;
		let b = 0xefcdab89;
		let c = 0x98badcfe;
		let d = 271733878;
		for (let offset = 0; offset < bytes.length; offset += 64) {
			const x = [];
			for (let i = 0; i < 16; i++) {
				const j = offset + i * 4;
				x[i] = bytes[j] | bytes[j + 1] << 8 | bytes[j + 2] << 16 | bytes[j + 3] << 24;
			}
			let aa = a;
			let bb = b;
			let cc = c;
			let dd = d;
			for (let i = 0; i < 64; i++) {
				let f;
				let g;
				if (i < 16) {
					f = bb & cc | ~bb & dd;
					g = i;
				} else if (i < 32) {
					f = dd & bb | ~dd & cc;
					g = (5 * i + 1) % 16;
				} else if (i < 48) {
					f = bb ^ cc ^ dd;
					g = (3 * i + 5) % 16;
				} else {
					f = cc ^ (bb | ~dd);
					g = 7 * i % 16;
				}
				const oldD = dd;
				dd = cc;
				cc = bb;
				bb = add32(bb, rotl(add32(add32(add32(aa, f), K[i]), x[g]), S[i]));
				aa = oldD;
			}
			a = add32(a, aa);
			b = add32(b, bb);
			c = add32(c, cc);
			d = add32(d, dd);
		}
		return [
			a,
			b,
			c,
			d
		].map((n) => {
			let out = "";
			for (let i = 0; i < 4; i++) out += (n >>> i * 8 & 255).toString(16).padStart(2, "0");
			return out;
		}).join("");
	}
	// src/download/providers/mcloud.ts
	const mount$4 = { home: ".top_button" };
	const api$4 = { getLink: "https://personal-kd-njs.yun.139.com/hcy/file/getDownloadUrl" };
	function randomString(length = 16) {
		const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
		let result = "";
		for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * 48));
		return result;
	}
	function utf8ToBinary(str) {
		const fromCharCode = String.fromCharCode;
		return str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, (char) => {
			if (char.length < 2) {
				const code = char.charCodeAt(0);
				return code < 128 ? char : code < 2048 ? fromCharCode(192 | code >>> 6) + fromCharCode(128 | 63 & code) : fromCharCode(224 | code >>> 12 & 15) + fromCharCode(128 | code >>> 6 & 63) + fromCharCode(128 | 63 & code);
			}
			const code = 65536 + 1024 * (char.charCodeAt(0) - 55296) + (char.charCodeAt(1) - 56320);
			return fromCharCode(240 | code >>> 18 & 7) + fromCharCode(128 | code >>> 12 & 63) + fromCharCode(128 | code >>> 6 & 63) + fromCharCode(128 | 63 & code);
		});
	}
	function sign(body, time, key) {
		let text = "";
		if (body) {
			text = JSON.stringify(body).replace(/\s*/g, "");
			text = encodeURIComponent(text);
			text = text.split("").sort().join("");
		}
		return md5(md5(encodeBase(utf8ToBinary(text))) + md5(`${time}:${key}`)).toUpperCase();
	}
	function getCookie(name) {
		const cname = `${name}=`;
		for (const part of document.cookie.split(";")) {
			const cookie = part.trim();
			if (cookie.indexOf(cname) === 0) return cookie.substring(cname.length);
		}
		return "";
	}
	async function getFileUrl$2(item, index) {
		if (item.downloadUrl) return {
			index,
			downloadUrl: item.downloadUrl
		};
		if (contextPage$3() === "home") {
			const body = { fileId: item.contentID };
			const time = new Date(Date.now() + 288e5).toJSON().substr(0, 19).replace("T", " ");
			const key = randomString(16);
			const signature = sign(body, time, key);
			const response = await post(api$4.getLink, body, {
				Authorization: getCookie("authorization"),
				Caller: "web",
				"Content-Type": "application/json;charset=UTF-8",
				"CMS-DEVICE": "default",
				"Mcloud-Channel": "1000101",
				"Mcloud-Client": "10701",
				"Mcloud-Sign": `${time},${key},${signature}`,
				"Mcloud-Version": "7.14.2",
				"X-DeviceInfo": "||9|7.17.0|edge||||windows 10||zh-CN|||",
				"X-Huawei-ChannelSrc": "10000034",
				"X-Inner-Ntwk": "2",
				"X-M4C-Caller": "PC",
				"X-M4C-Src": "10002",
				"X-SvcType": "1",
				"X-Yun-Api-Version": "v1",
				"X-Yun-App-Channel": "10000034",
				"X-Yun-Channel-Source": "10000034",
				"X-Yun-Client-Info": "||9|7.17.0|edge||||windows 10||zh-CN|||||",
				"X-Yun-Module-Type": "100",
				"X-Yun-Svc-Type": "1",
				"X-Yun-Url-Type": "3"
			});
			if (response?.success) return {
				index,
				downloadUrl: response.data.url
			};
			return {
				index,
				downloadUrl: "获取下载地址失败，服务器未返回有效数据，刷新后再试试吧~"
			};
		}
		throw new Error("提示：<br/>请在我的云盘页面使用下载助手~");
	}
	function contextPage$3() {
		const path = location.pathname;
		if (/^\/w/.test(path)) return "home";
		if (/^\/link|shareweb/.test(path)) return "share";
		return "";
	}
	function getSelectedList$4() {
		try {
			const selects = document.querySelector(".main_file_list")?.__vue__?.selectList?.map?.((value) => value.item);
			if (selects?.length) return selects;
			const vueDom = document.querySelector(".home-page")?.__vue__;
			const fileList = vueDom._computedWatchers.fileList.value;
			const dirList = vueDom._computedWatchers.dirList.value;
			const selectedFile = vueDom.selectedFile;
			const selectedDir = vueDom.selectedDir;
			return [...fileList.filter((_, index) => selectedFile.includes(index)), ...dirList.filter((_, index) => selectedDir.includes(index))];
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[中国移动云盘] 获取已勾选文件列表失败");
		}
	}
	async function getLink$4() {
		let selects = getSelectedList$4();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => !item.contentID && !item.contentName)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		if (contextPage$3() !== "home") throw new Error("提示：<br/>请在我的云盘页面使用下载助手~");
		selects = selects.filter((item) => item.contentID && item.contentName && item.contentSuffix);
		const batchSize = 15;
		let processed = 0;
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		for (let i = 0; i < selects.length; i += batchSize) {
			const queue = selects.slice(i, i + batchSize).map((item, localIndex) => {
				return getFileUrl$2(item, i + localIndex).then((value) => {
					processed++;
					loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
					return value;
				});
			});
			(await Promise.all(queue)).forEach((value) => {
				selects[value.index].downloadUrl = value.downloadUrl;
			});
			await sleep(1e3);
		}
		return {
			files: selects,
			get: {
				dir: (file) => file.dirEtag || file.caName,
				name: (file) => file.contentName || file.coName,
				size: (file) => file.contentSize || file.coSize,
				link: (file) => file.downloadUrl
			},
			headers: {}
		};
	}
	const mcloud = {
		detectPage: contextPage$3,
		addButton() {
			mountProviderButton(this, [mount$4.home]);
		},
		getLink: getLink$4
	};
	// src/download/providers/quark.ts
	const mount$3 = {
		home: ".btn-operate .btn-main",
		share: ".share-btns"
	};
	const api$3 = {
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 QuarkPC/6.9.7.761 QuarkCloudDrivePC/6.9.7.761 quark-cloud-drive/2.5.40",
		getLink: "https://drive-pc.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761",
		getSocialToken: "https://drive-social-api.quark.cn/1/clouddrive/chat/conv/file/acquire_dl_token?pr=ucpro&fr=pc&sys=win32&ve=6.9.7.761&fr=win&la=zh-CN&ch=pckk%40product_guanwan"
	};
	async function getSocialToken() {
		const now = Date.now();
		const cached = gmStore.get("quark_social_token");
		if (cached?.token && cached?.expired_timestamp > now + 6e4) return cached.token;
		const time = Math.floor(now / 1e3);
		const response = await post(api$3.getSocialToken, {
			conversation_id: `300000${time}`,
			conversation_type: 3,
			msg_id: `${time}000`
		}, {
			"Content-Type": "application/json",
			Cookie: String(document.cookie),
			"User-Agent": api$3.ua
		});
		if (!response || response.code !== 0 || !response.data?.token) {
			if (response?.code == 31001) throw new Error("提示：<br/>请先登录网盘~");
			throw new Error(`提示：<br/>获取令牌失败~ ${response?.code || ""} ${response?.message || ""}`.trim());
		}
		gmStore.set("quark_social_token", response.data);
		return response.data.token;
	}
	function getSelectedList$3() {
		try {
			const list = [];
			const props = findReact(document.getElementsByClassName("file-list")[0])?.props;
			if (!props) return list;
			const stoken = props.stoken || "";
			const fileList = props.list || [];
			const selectedKeys = props.selectedRowKeys || [];
			for (const file of fileList) if (selectedKeys.includes(file.fid)) list.push({
				...file,
				stoken
			});
			return list;
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[夸克网盘] 获取已勾选文件列表失败");
		}
	}
	function detectPage$3() {
		const path = location.pathname;
		if (/^\/list/.test(path)) return "home";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function getHomeFiles(selects) {
		const data = [];
		const batchSize = 15;
		let processed = 0;
		selects = selects.filter((item) => item.file === true);
		for (let i = 0; i < selects.length; i += batchSize) {
			const batch = selects.slice(i, i + batchSize);
			const fids = batch.map((item) => item.fid);
			const token = await getSocialToken();
			const response = await post(api$3.getLink, {
				fids,
				speedup_session: "",
				token
			}, {
				"Content-Type": "application/json",
				Cookie: String(document.cookie),
				"User-Agent": api$3.ua
			});
			if (!response || response.code !== 0 || !response.data) {
				if (response?.code == 31001) throw new Error("提示：<br/>请先登录网盘~");
				if (response?.code == 23018) {
					const fid = response.message?.match(/\[([a-f0-9]{32})\]/)?.[1];
					const item = batch.find((entry) => entry.fid === fid);
					throw new Error(`提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ""}`);
				}
				gmStore.del("quark_social_token");
				throw new Error(`提示：<br/>获取地址失败~ ${response?.code || ""} ${response?.message || ""}`.trim());
			}
			data.push(...response.data);
			processed += batch.length;
			loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
			await sleep(1e3);
		}
		return data;
	}
	async function getShareFiles(selects) {
		const win = unsafeWindow;
		const pwdId = win.factStat?.ut?.baseParams?.pwd_id || win.factStat?.wa?.customStatParams?.pwd_id || location.pathname.match(/^\/(?:s|share)\/([a-zA-Z0-9]+)/)?.[1];
		if (!pwdId) throw new Error("错误：<br/>无法提取分享 ID~");
		context.pugs = context.pugs || standCookies(document.cookie, "cookie").__pugs || "";
		const cookie = `__pugs=${context.pugs}`;
		const data = [];
		const batchSize = 15;
		let processed = 0;
		selects = selects.filter((item) => item.file === true);
		for (let i = 0; i < selects.length; i += batchSize) {
			const batch = selects.slice(i, i + batchSize);
			const fids = batch.map((item) => item.fid);
			const fidsToken = batch.map((item) => item.share_fid_token);
			const token = await getSocialToken().catch(() => "");
			const response = await post(api$3.getLink, {
				fids,
				fids_token: fidsToken,
				pwd_id: pwdId,
				stoken: batch[0].stoken,
				speedup_session: "",
				token
			}, {
				"Content-Type": "application/json",
				Cookie: cookie,
				"User-Agent": api$3.ua
			}, "json", true, true);
			if (!context.pugs && response?.responseHeaders?.["Set-Cookie"]?.__pugs) context.pugs = response.responseHeaders["Set-Cookie"].__pugs;
			const result = response?.response ?? (() => {
				try {
					return JSON.parse(response?.responseText || "{}");
				} catch {
					return {};
				}
			})();
			if (!result || result.code !== 0 || !result.data) {
				if (result?.code == 31001) throw new Error("提示：<br/>请先登录网盘~");
				if (result?.code == 23018) {
					const fid = result.message?.match(/\[([a-f0-9]{32})\]/)?.[1];
					const item = batch.find((entry) => entry.fid === fid);
					throw new Error(`提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ""}`);
				}
				throw new Error(`提示：<br/>获取地址失败~ ${result?.code || ""} ${result?.message || ""}`.trim());
			}
			data.push(...result.data);
			processed += batch.length;
			loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
			await sleep(1e3);
		}
		return data;
	}
	async function getLink$3() {
		const selects = getSelectedList$3();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => !item.file)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		const page = contextPage$2();
		const data = page === "home" ? await getHomeFiles(selects) : page === "share" ? await getShareFiles(selects) : null;
		if (!data) throw new Error("提示：<br/>页面错误~");
		return {
			files: data,
			get: {
				dir: (file) => file.file === false,
				name: (file) => file.file_name,
				size: (file) => file.size,
				link: (file) => file.download_url
			},
			headers: {
				"User-Agent": api$3.ua,
				...page === "share" && context.pugs ? { Cookie: `__pugs=${context.pugs}` } : { Cookie: String(document.cookie) }
			}
		};
	}
	function contextPage$2() {
		return detectPage$3();
	}
	const quark = {
		detectPage: detectPage$3,
		addButton() {
			mountProviderButton(this, [mount$3.home, mount$3.share]);
		},
		getLink: getLink$3
	};
	// src/download/providers/tcloud.ts
	const mount$2 = {
		home: "[class*=\"FileHead_file-head-left\"]",
		share: ".nav-opea"
	};
	const api$2 = {
		getAccessToken: "https://api.cloud.189.cn/open/oauth2/ssoH5.action",
		getLink: "https://api.cloud.189.cn/open/file/getFileDownloadUrl.action"
	};
	async function getToken$1() {
		loading.title("令牌获取中");
		loading.update("正在获取状态~");
		const accessToken = (await getFinal(api$2.getAccessToken, void 0, true)).match(/accessToken=(\w+)/)?.[1];
		if (!accessToken) return void 0;
		localStore.set("accessToken", accessToken);
		loading.update("获取成功，令牌已缓存~");
		return accessToken;
	}
	async function getFileUrl$1(item, index, token) {
		if (item.downloadUrl) return {
			index,
			downloadUrl: item.downloadUrl
		};
		const time = Date.now();
		let url = `${api$2.getLink}?fileId=${item.fileId}`;
		let signText = `AccessToken=${token}&Timestamp=${time}`;
		if (item.shareId) {
			url += `&dt=1&shareId=${item.shareId}`;
			signText += "&dt=1";
		}
		signText += `&fileId=${item.fileId}`;
		if (item.shareId) signText += `&shareId=${item.shareId}`;
		const response = await get(url, {
			Accept: "application/json;charset=UTF-8",
			"Sign-Type": 1,
			Accesstoken: token,
			Timestamp: time,
			Signature: md5(signText)
		});
		if (response?.res_code == 0) return {
			index,
			downloadUrl: response.fileDownloadUrl
		};
		if (response?.errorcode === "InvalidSessionKey") return {
			index,
			downloadUrl: "提示：<br/>请先登录网盘~"
		};
		if (response?.res_code === "ShareNotFoundFlatDir") return {
			index,
			downloadUrl: "提示：<br/>请转存文件后前往我的网盘中下载~"
		};
		return {
			index,
			downloadUrl: `获取下载地址失败，刷新后再试试吧~${response?.res_code || ""}`
		};
	}
	function getSelectedList$2() {
		try {
			const selected = document.querySelector(".c-file-list")?.__vue__?.selectedList;
			if (selected?.length) return selected;
			const detail = document.querySelector(".info-detail")?.__vue__?.fileDetail;
			if (detail) return [detail];
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[天翼云盘] 获取已勾选文件列表失败");
		}
		return [];
	}
	function detectPage$2() {
		const path = location.pathname;
		if (/^\/web\/main/.test(path)) return "home";
		if (/^\/web\/share/.test(path)) return "share";
		return "";
	}
	async function getLink$2() {
		let selects = getSelectedList$2();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => item.isFolder)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		selects = selects.filter((item) => !item.isFolder);
		loading.title("令牌获取中");
		loading.update("正在获取状态~");
		let token = localStore.get("accessToken", "");
		if (!token) token = await getToken$1() || "";
		if (!token) throw new Error("提示：<br/>请先登录网盘~");
		const batchSize = 15;
		let processed = 0;
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		for (let i = 0; i < selects.length; i += batchSize) {
			const queue = selects.slice(i, i + batchSize).map((item, localIndex) => {
				return getFileUrl$1(item, i + localIndex, token).then((value) => {
					processed++;
					loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
					return value;
				});
			});
			(await Promise.all(queue)).forEach((value) => {
				selects[value.index].downloadUrl = value.downloadUrl;
			});
			await sleep(1e3);
		}
		return {
			files: selects,
			get: {
				dir: (file) => file.isFolder,
				name: (file) => file.fileName,
				size: (file) => file.size,
				link: (file) => file.downloadUrl
			},
			headers: {}
		};
	}
	const tcloud = {
		detectPage: detectPage$2,
		addButton() {
			mountProviderButton(this, [mount$2.home, mount$2.share]);
		},
		getLink: getLink$2
	};
	// src/download/providers/uc.ts
	const mount$1 = {
		home: ".btn-operate .btn-main",
		share: ".file-info-share-buttom"
	};
	const api$1 = {
		ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/1.8.8 Chrome/100.0.4896.160 Electron/18.3.5.16-b62cf9c50d Safari/537.36 Channel/ucpan_other_ch",
		secCh: "\"Not=A?Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
		getLink: "https://pc-api.uc.cn/1/clouddrive/file/download?pr=UCBrowser&fr=pc&sys=win32&ve=1.8.8"
	};
	function getSelectedList$1() {
		try {
			const list = [];
			const props = findReact(document.getElementsByClassName("file-list")[0])?.props;
			if (!props) return list;
			const stoken = props.stoken || "";
			const fileList = props.list || [];
			const selectedKeys = props.selectedRowKeys || [];
			for (const file of fileList) if (selectedKeys.includes(file.fid)) list.push({
				...file,
				stoken
			});
			return list;
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[UC 网盘] 获取已勾选文件列表失败");
		}
	}
	function detectPage$1() {
		const path = location.pathname;
		if (/^\/list/.test(path)) return "home";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function fetchFiles(selects) {
		const data = [];
		const batchSize = 15;
		let processed = 0;
		selects = selects.filter((item) => item.file === true);
		const page = contextPage$1();
		let pwdId = "";
		if (page === "share") {
			const win = unsafeWindow;
			pwdId = win.factStat?.ut?.baseParams?.pwd_id || win.factStat?.wa?.customStatParams?.pwd_id || location.pathname.match(/^\/(?:s|share)\/([a-zA-Z0-9]+)/)?.[1] || "";
			if (!pwdId) throw new Error("错误：<br/>无法提取分享 ID~");
		}
		for (let i = 0; i < selects.length; i += batchSize) {
			const batch = selects.slice(i, i + batchSize);
			const body = { fids: batch.map((item) => item.fid) };
			if (page === "share") {
				body.fids_token = batch.map((item) => item.share_fid_token);
				body.pwd_id = pwdId;
				body.stoken = batch[0].stoken;
			}
			const response = await post(api$1.getLink, body, {
				"Content-Type": "application/json",
				Cookie: String(document.cookie),
				"User-Agent": api$1.ua,
				"Sec-Ch-Ua": api$1.secCh
			});
			if (!response || response.code !== 0 || !response.data) {
				if (response?.code == 31001) throw new Error("提示：<br/>请先登录网盘~");
				if (response?.code == 23018) {
					const fid = response.message?.match(/\[([a-f0-9]{32})\]/)?.[1];
					const item = batch.find((entry) => entry.fid === fid);
					throw new Error(`提示：<br/>超出游客可获取大小限制，请登录后获取~${item?.file_name ? `<br/>文件：${item.file_name}` : ""}`);
				}
				throw new Error(`提示：<br/>获取地址失败~ ${response?.code || ""} ${response?.message || ""}`.trim());
			}
			data.push(...response.data);
			processed += batch.length;
			loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
			await sleep(1e3);
		}
		return data;
	}
	async function getLink$1() {
		const selects = getSelectedList$1();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => !item.file)) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		return {
			files: await fetchFiles(selects),
			get: {
				dir: (file) => file.file === false,
				name: (file) => file.file_name,
				size: (file) => file.size,
				link: (file) => file.download_url
			},
			headers: {
				"User-Agent": api$1.ua,
				"Sec-Ch-Ua": api$1.secCh
			}
		};
	}
	function contextPage$1() {
		return detectPage$1();
	}
	const uc = {
		detectPage: detectPage$1,
		addButton() {
			mountProviderButton(this, [mount$1.home, mount$1.share]);
		},
		getLink: getLink$1
	};
	// src/download/providers/xunlei.ts
	const mount = { home: "[class*=\"FileMenu__menus--\"], [class*=\"FileMenu__menu--\"]" };
	const api = {
		getLink: "https://api-pan.xunlei.com/drive/v1/files/",
		getCaptchaToken: "https://xluser-ssl.xunlei.com/v1/shield/captcha/init",
		getAccessToken: "https://xluser-ssl.xunlei.com/v1/auth/token"
	};
	const salts = [
		"o6b11ImBwJA1KSNMTALjL0xMkMjTP",
		"oVHCQaox9N6+R91GY63sbxci9K9ymFl",
		"XReS2zbwYB/+vUnYDwZ",
		"O56ssQHYiK5enUTKaV",
		"sGKNxaX7aUzpjJ2n+/2f1I0",
		"1oyQWde2s4zvz",
		"ziq13Yyc6HUXr3477c20PJfwBjg7ux",
		"xKMXTJmlEqamEpkWfp6WeP1qZezdCA",
		"rUA",
		"XVIzRTbY7MGdUXn0+qLjw",
		"aGrpbD3EUDGo0wmvaKPDGxVRaNVN6",
		"ieQk/"
	];
	const tokenLock = { lock: Promise.resolve() };
	function captchaSign(clientId, version, host, deviceId, timestamp) {
		let hash = `${clientId}${version}${host}${deviceId}${timestamp}`;
		for (const salt of salts) hash = md5(hash + salt);
		return `1.${hash}`;
	}
	function getToken(force = false, withLoading = true) {
		tokenLock.lock = tokenLock.lock.catch(() => {}).then(async () => {
			if (withLoading) {
				loading.title("令牌获取中");
				loading.update("获取状态中~");
			}
			let creds = {};
			let captcha = {};
			let userId = "";
			let clientId = "";
			let credsKey = "";
			let captchaKey = "";
			const clientVersion = "1.92.62";
			const timestamp = Date.now();
			const rawDeviceId = localStore.get("deviceid", "");
			const deviceId = /(\w{32})/.exec(String(rawDeviceId).split(",")[0])?.[0] || "";
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (!key) continue;
				const value = localStore.get(key);
				if (key.startsWith("credentials_")) {
					creds = value || {};
					userId = creds?.user_id || "";
					clientId = key.split("_")[1];
					credsKey = key;
					captchaKey = `captcha_${clientId}`;
				} else if (key.startsWith("captcha_") && !clientId) {
					captcha = value || {};
					clientId = key.split("_")[1];
					captchaKey = key;
					credsKey = `credentials_${clientId}`;
				}
			}
			if (!clientId || !deviceId) throw new Error("错误：<br/>请先登录网盘后再获取文件呢~");
			const credsExpiresAt = creds?.expires_at ? new Date(creds.expires_at).getTime() : 0;
			if (force || !creds?.access_token || Date.now() >= credsExpiresAt - 6e4) {
				if (!creds?.refresh_token) throw new Error("错误：<br/>登录凭证已过期，请重新登录网盘~");
				if (withLoading) loading.update("登录凭证过期，正在获取新凭证~");
				const response = await post(api.getAccessToken, {
					client_id: clientId,
					grant_type: "refresh_token",
					refresh_token: creds.refresh_token
				}, {
					"Content-Type": "application/json",
					"x-action": "401",
					"x-client-id": clientId,
					"x-device-id": rawDeviceId,
					"x-device-sign": deviceId,
					"x-protocol-version": "301",
					"x-sdk-version": "3.4.20"
				});
				if (!response?.access_token) throw new Error(`错误：<br/>身份凭证刷新失败：${response?.error_description || response?.error || "未知错误"}`);
				creds = {
					...creds,
					...response,
					expires_at: new Date(timestamp + (response.expires_in || 43200) * 1e3).toISOString()
				};
				userId = creds.user_id || userId;
				localStore.set(credsKey, creds);
			}
			const captchaExpiresAt = captcha?.expires_at ? new Date(captcha.expires_at).getTime() : 0;
			if (force || !captcha?.token || Date.now() >= captchaExpiresAt - 6e4) {
				if (withLoading) loading.update("验证令牌过期，正在获取新令牌~");
				const response = await post(api.getCaptchaToken, {
					client_id: clientId,
					action: "get:/drive/v1/about",
					device_id: deviceId,
					meta: {
						username: "",
						phone_number: "",
						email: "",
						package_name: location.host,
						client_version: clientVersion,
						captcha_sign: captchaSign(clientId, clientVersion, location.host, deviceId, timestamp.toString()),
						timestamp: timestamp.toString(),
						user_id: userId
					}
				}, { "Content-Type": "application/json" });
				if (!response?.captcha_token) throw new Error(`错误：<br/>验证令牌刷新失败：${response?.error_description || response?.error || "未知错误"}`);
				captcha = {
					token: response.captcha_token,
					expires_at: new Date(timestamp + response.expires_in * 1e3).toString()
				};
				localStore.set(captchaKey, captcha);
			}
			if (!creds?.access_token || !captcha?.token) throw new Error("错误：<br/>获取令牌失败，请重新登录网盘~");
			return {
				credentials: creds,
				captcha,
				device_id: deviceId
			};
		});
		return tokenLock.lock;
	}
	async function getFileUrl(item, index, isRetry = false) {
		if (item.downloadUrl) return {
			index,
			downloadUrl: item.downloadUrl
		};
		const token = await getToken(false, false);
		const response = await get(`${api.getLink}${item.id}`, {
			Authorization: `${token.credentials?.token_type} ${token.credentials?.access_token}`,
			"Content-Type": "application/json",
			"X-Captcha-Token": token.captcha.token,
			"X-Device-Id": token.device_id
		});
		if (response?.web_content_link) return {
			index,
			downloadUrl: response.web_content_link
		};
		if (response?.error_code == 9) {
			if (!isRetry) {
				await getToken(true, false);
				return getFileUrl(item, index, true);
			}
			return {
				index,
				downloadUrl: "获取下载地址失败，页面验证令牌过期，请重新获取~"
			};
		}
		return {
			index,
			downloadUrl: `获取下载地址失败，${response?.error_description ? `服务器说：${response.error_description}` : "刷新后再试试吧~"}`
		};
	}
	function getSelectedList() {
		try {
			const list = [];
			for (const dom of document.querySelectorAll("[class*=\"SourceListItem__item--\"]")) {
				const vue = dom.__vue__;
				if (vue?.selected?.includes?.(vue.info.id)) list.push(vue.info);
			}
			return list;
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "[迅雷云盘] 获取已勾选文件列表失败");
		}
	}
	function detectPage() {
		const path = location.pathname;
		if (/^\/$/.test(path)) return "home";
		if (/^\/(s|share)\//.test(path)) return "share";
		return "";
	}
	async function getLink() {
		const selects = getSelectedList();
		if (selects.length === 0) throw new Error("提示：<br/>请先勾选要下载的文件哦~");
		if (selects.every((item) => item.kind !== "drive#file")) throw new Error("提示：<br/>请打开文件夹后再勾选文件~");
		if (contextPage() !== "home") throw new Error("提示：<br/>请在我的云盘页面使用下载助手~");
		const batchSize = 15;
		let processed = 0;
		loading.title("地址获取中");
		loading.update("正在获取文件对应的下载地址~");
		for (let i = 0; i < selects.length; i += batchSize) {
			const queue = selects.slice(i, i + batchSize).map((item, localIndex) => {
				return getFileUrl(item, i + localIndex).then((value) => {
					processed++;
					loading.update(`已获取 ${processed} / ${selects.length} 个地址~`);
					return value;
				});
			});
			(await Promise.all(queue)).forEach((value) => {
				selects[value.index].downloadUrl = value.downloadUrl;
			});
			await sleep(1e3);
		}
		return {
			files: selects,
			get: {
				dir: (file) => file.kind === "drive#folder",
				name: (file) => file.name,
				size: (file) => file.size,
				link: (file) => file.downloadUrl
			},
			headers: {}
		};
	}
	function contextPage() {
		return detectPage();
	}
	const xunlei = {
		detectPage,
		addButton() {
			mountProviderButton(this, [mount.home]);
		},
		getLink
	};
	// src/download/providers/index.ts
	function resolveProvider() {
		const host = location.host;
		const href = location.href;
		let provider = null;
		if (/(pan|yun)\.baidu\.com/.test(host)) provider = baidu;
		else if (/openapi\.baidu\.com\/oauth/.test(href)) provider = baiduAuthorize;
		else if (/www\.(aliyundrive|alipan)\.com/.test(host)) provider = aliyun;
		else if (/(yun|caiyun)\.139\.com/.test(host)) provider = mcloud;
		else if (/cloud\.189\.cn/.test(host)) provider = tcloud;
		else if (/pan\.xunlei\.com/.test(host)) provider = xunlei;
		else if (/www\.guangyapan\.com/.test(host)) provider = guangya;
		else if (/pan\.quark\.cn/.test(host)) provider = quark;
		else if (/drive\.uc\.cn/.test(host)) provider = uc;
		else if (/(www|login|yun|user|share)\.(123(pan|684|865|952|912)\.com|123pan\.cn)$/.test(host)) provider = pan123;
		if (provider) context.page = provider.detectPage();
		return provider;
	}
	// src/download/ui/style.ts
	const STYLE = `
.netdisk-download {
  --nd-primary: #574ab8;
  --nd-bg: #fff;
  --nd-fg: #1f2328;
  --nd-muted: #6b7280;
  --nd-border: #e5e7eb;
  --nd-danger: #cc3235;
  --nd-success: #2f9e44;
  color-scheme: light dark;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nd-button-wrap {
  position: relative;
  display: inline-block;
  margin: 0 8px;
  font-size: 14px;
}

.nd-trigger {
  border: 0;
  border-radius: 6px;
  background: var(--nd-primary);
  color: #fff;
  cursor: pointer;
  padding: 7px 14px;
  line-height: 1.2;
}

.nd-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10000;
  display: none;
  min-width: 150px;
  margin: 0;
  padding: 4px;
  list-style: none;
  border: 1px solid var(--nd-border);
  border-radius: 8px;
  background: var(--nd-bg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.nd-button-wrap.open .nd-menu {
  display: block;
}

.nd-menu-item {
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--nd-fg);
  cursor: pointer;
  white-space: nowrap;
}

.nd-menu-item:hover {
  background: rgba(87, 74, 184, 0.1);
}

.nd-menu-sep {
  height: 1px;
  margin: 4px 2px;
  background: var(--nd-border);
}

.nd-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  color: var(--nd-fg);
}

.nd-modal {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: min(80vh, 720px);
  border-radius: 12px;
  background: var(--nd-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.nd-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--nd-border);
}

.nd-modal-title {
  flex: 1;
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.nd-close {
  border: 0;
  background: transparent;
  color: var(--nd-muted);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.nd-modal-body {
  flex: 1;
  padding: 8px 20px;
  overflow: auto;
}

.nd-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--nd-border);
}

.nd-item:last-child {
  border-bottom: 0;
}

.nd-name {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-weight: 600;
  word-break: break-all;
}

.nd-size {
  flex: none;
  color: var(--nd-muted);
  font-size: 12px;
  font-weight: 400;
}

.nd-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.nd-btn {
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  background: var(--nd-bg);
  color: var(--nd-fg);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 13px;
}

.nd-btn:hover {
  border-color: var(--nd-primary);
  color: var(--nd-primary);
}

.nd-btn.nd-primary {
  border-color: var(--nd-primary);
  background: var(--nd-primary);
  color: #fff;
}

.nd-btn.nd-danger {
  border-color: var(--nd-danger);
  background: var(--nd-danger);
  color: #fff;
}

.nd-btn.nd-success {
  border-color: var(--nd-success);
  background: var(--nd-success);
  color: #fff;
}

.nd-code {
  margin: 10px 0 0;
  padding: 10px;
  border-radius: 8px;
  background: #f6f8fa;
  color: #24292f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.nd-message {
  margin-top: 8px;
  color: var(--nd-danger);
  font-size: 13px;
  word-break: break-all;
}

.nd-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nd-settings {
  display: flex;
  flex-direction: column;
}

.nd-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--nd-border);
}

.nd-section:last-of-type {
  border-bottom: 0;
}

.nd-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.nd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.nd-section-head h4 {
  margin: 0;
}

.nd-rpc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nd-rpc {
  padding: 10px;
  border: 1px solid var(--nd-border);
  border-radius: 8px;
}

.nd-rpc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.nd-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.nd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 12px;
}

.nd-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--nd-muted);
  font-size: 12px;
}

.nd-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  background: var(--nd-bg);
  color: var(--nd-fg);
  font: inherit;
  font-size: 13px;
}

.nd-input:focus {
  border-color: var(--nd-primary);
  outline: 2px solid rgba(87, 74, 184, 0.35);
  outline-offset: 1px;
}

.nd-settings-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0 4px;
}

.nd-settings-error {
  flex: 1;
  color: var(--nd-danger);
  font-size: 13px;
}

.nd-loading-overlay {
  background: rgba(0, 0, 0, 0.35);
}

.nd-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 260px;
  padding: 28px;
  border-radius: 12px;
  background: var(--nd-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.nd-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--nd-border);
  border-top-color: var(--nd-primary);
  border-radius: 50%;
  animation: nd-spin 0.8s linear infinite;
}

.nd-loading-title {
  font-size: 16px;
  font-weight: 600;
}

.nd-loading-text {
  color: var(--nd-muted);
  font-size: 13px;
  white-space: pre-wrap;
}

.nd-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100001;
  max-width: min(420px, calc(100vw - 40px));
  padding: 12px 16px;
  border-radius: 8px;
  background: #1f2328;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.nd-toast-error {
  background: var(--nd-danger);
}

.nd-toast-success {
  background: var(--nd-success);
}

@keyframes nd-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-color-scheme: dark) {
  .netdisk-download {
    --nd-bg: #1f2328;
    --nd-fg: #e6edf3;
    --nd-muted: #9ca3af;
    --nd-border: #3d444d;
  }

  .nd-code {
    background: #161b22;
    color: #e6edf3;
  }

  .nd-menu-item:hover {
    background: rgba(87, 74, 184, 0.25);
  }
}
`;
	// src/download/main.ts
	function main() {
		try {
			if (typeof unsafeWindow === "undefined") window.unsafeWindow = window;
		} catch {}
		const provider = resolveProvider();
		if (!provider) return;
		addStyle("netdisk-download-style", STYLE);
		provider.addButton();
		GM_registerMenuCommand("下载设置", openSettings);
		console.info(`[netdisk-download] ${location.host}${location.pathname} · ${provider.detectPage() || "unknown"}`);
	}
	// src/download.user.ts
	run(main);
})();
