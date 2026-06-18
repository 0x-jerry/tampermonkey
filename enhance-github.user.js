// ==UserScript==
// @name         Enhance GitHub
// @namespace    0x-jerry
// @description  Enhance GitHub with useful features like displaying repository size
// @version      1.0.4
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/enhance-github.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/enhance-github.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/enhance-github.user.ts
// @match        https://github.com/*/*
// @run-at       document-idle
// @grant        GM.xmlHttpRequest
// ==/UserScript==
(function() {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	//#region src/utils/helper.ts
	function html(template, ...substitutions) {
		const doc = document.createDocumentFragment();
		const div = document.createElement("div");
		div.innerHTML = String.raw(template, ...substitutions);
		doc.append(...div.childNodes);
		return doc;
	}
	//#endregion
	//#region src/utils/utils.ts
	function sleep(ts = 100) {
		return new Promise((resolve) => setTimeout(resolve, ts));
	}
	async function waitElement(selector) {
		return when(() => document.querySelector(selector));
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
	//#region src/utils/request.ts
	function parseRawHeadersString(rawHeadersString) {
		const headers = new Headers();
		if (!rawHeadersString) return headers;
		const lines = rawHeadersString.trim().split(/[\r\n]+/);
		for (const line of lines) {
			const separatorIdx = line.indexOf(":");
			const key = (line.slice(0, separatorIdx) || "").trim().toLowerCase();
			const value = (line.slice(separatorIdx + 1) || "").trim();
			if (key) headers.append(key, value);
		}
		return headers;
	}
	//#endregion
	//#region src/assets/icons-svg.ts
	const dataIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 32 32'%3E%3C!-- Icon from Carbon by IBM - undefined --%3E%3Cpath fill='currentColor' d='M16 3C10.702 3 5 4.252 5 7v18c0 2.748 5.702 4 11 4s11-1.252 11-4V7c0-2.748-5.702-4-11-4m0 2c5.798 0 8.795 1.434 8.997 2c-.202.566-3.2 2-8.997 2c-5.841 0-8.84-1.456-9-1.982v-.005C7.16 6.456 10.159 5 16 5M7 9.428C9.128 10.495 12.643 11 16 11s6.872-.505 9-1.572v3.56c-.16.556-3.159 2.012-9 2.012c-5.85 0-8.85-1.46-9-2zm0 6C9.128 16.495 12.643 17 16 17s6.872-.505 9-1.572v3.56c-.16.556-3.159 2.012-9 2.012c-5.85 0-8.85-1.46-9-2zM16 27c-5.85 0-8.85-1.46-9-2v-3.572C9.128 22.495 12.643 23 16 23s6.872-.505 9-1.572v3.56c-.16.556-3.159 2.012-9 2.012'/%3E%3C/svg%3E`;
	const sendIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 32 32'%3E%3C!-- Icon from Carbon by IBM - undefined --%3E%3Cpath fill='currentColor' d='M27.71 4.29a1 1 0 0 0-1.05-.23l-22 8a1 1 0 0 0 0 1.87l9.6 3.84l3.84 9.6a1 1 0 0 0 .9.63a1 1 0 0 0 .92-.66l8-22a1 1 0 0 0-.21-1.05M19 24.2l-2.79-7L21 12.41L19.59 11l-4.83 4.83L7.8 13l17.53-6.33Z'/%3E%3C/svg%3E`;
	//#endregion
	//#region src/enhance-github.user.ts
	var import_dayjs_min = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		(function(t, e) {
			"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
		})(exports, (function() {
			"use strict";
			var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = {
				name: "en",
				weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
				months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
				ordinal: function(t) {
					var e = [
						"th",
						"st",
						"nd",
						"rd"
					], n = t % 100;
					return "[" + t + (e[(n - 20) % 10] || e[n] || e[0]) + "]";
				}
			}, m = function(t, e, n) {
				var r = String(t);
				return !r || r.length >= e ? t : "" + Array(e + 1 - r.length).join(n) + t;
			}, v = {
				s: m,
				z: function(t) {
					var e = -t.utcOffset(), n = Math.abs(e), r = Math.floor(n / 60), i = n % 60;
					return (e <= 0 ? "+" : "-") + m(r, 2, "0") + ":" + m(i, 2, "0");
				},
				m: function t(e, n) {
					if (e.date() < n.date()) return -t(n, e);
					var r = 12 * (n.year() - e.year()) + (n.month() - e.month()), i = e.clone().add(r, c), s = n - i < 0, u = e.clone().add(r + (s ? -1 : 1), c);
					return +(-(r + (n - i) / (s ? i - u : u - i)) || 0);
				},
				a: function(t) {
					return t < 0 ? Math.ceil(t) || 0 : Math.floor(t);
				},
				p: function(t) {
					return {
						M: c,
						y: h,
						w: o,
						d: a,
						D: d,
						h: u,
						m: s,
						s: i,
						ms: r,
						Q: f
					}[t] || String(t || "").toLowerCase().replace(/s$/, "");
				},
				u: function(t) {
					return void 0 === t;
				}
			}, g = "en", D = {};
			D[g] = M;
			var p = "$isDayjsObject", S = function(t) {
				return t instanceof _ || !(!t || !t[p]);
			}, w = function t(e, n, r) {
				var i;
				if (!e) return g;
				if ("string" == typeof e) {
					var s = e.toLowerCase();
					D[s] && (i = s), n && (D[s] = n, i = s);
					var u = e.split("-");
					if (!i && u.length > 1) return t(u[0]);
				} else {
					var a = e.name;
					D[a] = e, i = a;
				}
				return !r && i && (g = i), i || !r && g;
			}, O = function(t, e) {
				if (S(t)) return t.clone();
				var n = "object" == typeof e ? e : {};
				return n.date = t, n.args = arguments, new _(n);
			}, b = v;
			b.l = w, b.i = S, b.w = function(t, e) {
				return O(t, {
					locale: e.$L,
					utc: e.$u,
					x: e.$x,
					$offset: e.$offset
				});
			};
			var _ = function() {
				function M(t) {
					this.$L = w(t.locale, null, !0), this.parse(t), this.$x = this.$x || t.x || {}, this[p] = !0;
				}
				var m = M.prototype;
				return m.parse = function(t) {
					this.$d = function(t) {
						var e = t.date, n = t.utc;
						if (null === e) return /* @__PURE__ */ new Date(NaN);
						if (b.u(e)) return /* @__PURE__ */ new Date();
						if (e instanceof Date) return new Date(e);
						if ("string" == typeof e && !/Z$/i.test(e)) {
							var r = e.match($);
							if (r) {
								var i = r[2] - 1 || 0, s = (r[7] || "0").substring(0, 3);
								return n ? new Date(Date.UTC(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s)) : new Date(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s);
							}
						}
						return new Date(e);
					}(t), this.init();
				}, m.init = function() {
					var t = this.$d;
					this.$y = t.getFullYear(), this.$M = t.getMonth(), this.$D = t.getDate(), this.$W = t.getDay(), this.$H = t.getHours(), this.$m = t.getMinutes(), this.$s = t.getSeconds(), this.$ms = t.getMilliseconds();
				}, m.$utils = function() {
					return b;
				}, m.isValid = function() {
					return !(this.$d.toString() === l);
				}, m.isSame = function(t, e) {
					var n = O(t);
					return this.startOf(e) <= n && n <= this.endOf(e);
				}, m.isAfter = function(t, e) {
					return O(t) < this.startOf(e);
				}, m.isBefore = function(t, e) {
					return this.endOf(e) < O(t);
				}, m.$g = function(t, e, n) {
					return b.u(t) ? this[e] : this.set(n, t);
				}, m.unix = function() {
					return Math.floor(this.valueOf() / 1e3);
				}, m.valueOf = function() {
					return this.$d.getTime();
				}, m.startOf = function(t, e) {
					var n = this, r = !!b.u(e) || e, f = b.p(t), l = function(t, e) {
						var i = b.w(n.$u ? Date.UTC(n.$y, e, t) : new Date(n.$y, e, t), n);
						return r ? i : i.endOf(a);
					}, $ = function(t, e) {
						return b.w(n.toDate()[t].apply(n.toDate("s"), (r ? [
							0,
							0,
							0,
							0
						] : [
							23,
							59,
							59,
							999
						]).slice(e)), n);
					}, y = this.$W, M = this.$M, m = this.$D, v = "set" + (this.$u ? "UTC" : "");
					switch (f) {
						case h: return r ? l(1, 0) : l(31, 11);
						case c: return r ? l(1, M) : l(0, M + 1);
						case o:
							var g = this.$locale().weekStart || 0, D = (y < g ? y + 7 : y) - g;
							return l(r ? m - D : m + (6 - D), M);
						case a:
						case d: return $(v + "Hours", 0);
						case u: return $(v + "Minutes", 1);
						case s: return $(v + "Seconds", 2);
						case i: return $(v + "Milliseconds", 3);
						default: return this.clone();
					}
				}, m.endOf = function(t) {
					return this.startOf(t, !1);
				}, m.$set = function(t, e) {
					var n, o = b.p(t), f = "set" + (this.$u ? "UTC" : ""), l = (n = {}, n[a] = f + "Date", n[d] = f + "Date", n[c] = f + "Month", n[h] = f + "FullYear", n[u] = f + "Hours", n[s] = f + "Minutes", n[i] = f + "Seconds", n[r] = f + "Milliseconds", n)[o], $ = o === a ? this.$D + (e - this.$W) : e;
					if (o === c || o === h) {
						var y = this.clone().set(d, 1);
						y.$d[l]($), y.init(), this.$d = y.set(d, Math.min(this.$D, y.daysInMonth())).$d;
					} else l && this.$d[l]($);
					return this.init(), this;
				}, m.set = function(t, e) {
					return this.clone().$set(t, e);
				}, m.get = function(t) {
					return this[b.p(t)]();
				}, m.add = function(r, f) {
					var d, l = this;
					r = Number(r);
					var $ = b.p(f), y = function(t) {
						var e = O(l);
						return b.w(e.date(e.date() + Math.round(t * r)), l);
					};
					if ($ === c) return this.set(c, this.$M + r);
					if ($ === h) return this.set(h, this.$y + r);
					if ($ === a) return y(1);
					if ($ === o) return y(7);
					var M = (d = {}, d[s] = e, d[u] = n, d[i] = t, d)[$] || 1, m = this.$d.getTime() + r * M;
					return b.w(m, this);
				}, m.subtract = function(t, e) {
					return this.add(-1 * t, e);
				}, m.format = function(t) {
					var e = this, n = this.$locale();
					if (!this.isValid()) return n.invalidDate || l;
					var r = t || "YYYY-MM-DDTHH:mm:ssZ", i = b.z(this), s = this.$H, u = this.$m, a = this.$M, o = n.weekdays, c = n.months, f = n.meridiem, h = function(t, n, i, s) {
						return t && (t[n] || t(e, r)) || i[n].slice(0, s);
					}, d = function(t) {
						return b.s(s % 12 || 12, t, "0");
					}, $ = f || function(t, e, n) {
						var r = t < 12 ? "AM" : "PM";
						return n ? r.toLowerCase() : r;
					};
					return r.replace(y, (function(t, r) {
						return r || function(t) {
							switch (t) {
								case "YY": return String(e.$y).slice(-2);
								case "YYYY": return b.s(e.$y, 4, "0");
								case "M": return a + 1;
								case "MM": return b.s(a + 1, 2, "0");
								case "MMM": return h(n.monthsShort, a, c, 3);
								case "MMMM": return h(c, a);
								case "D": return e.$D;
								case "DD": return b.s(e.$D, 2, "0");
								case "d": return String(e.$W);
								case "dd": return h(n.weekdaysMin, e.$W, o, 2);
								case "ddd": return h(n.weekdaysShort, e.$W, o, 3);
								case "dddd": return o[e.$W];
								case "H": return String(s);
								case "HH": return b.s(s, 2, "0");
								case "h": return d(1);
								case "hh": return d(2);
								case "a": return $(s, u, !0);
								case "A": return $(s, u, !1);
								case "m": return String(u);
								case "mm": return b.s(u, 2, "0");
								case "s": return String(e.$s);
								case "ss": return b.s(e.$s, 2, "0");
								case "SSS": return b.s(e.$ms, 3, "0");
								case "Z": return i;
							}
							return null;
						}(t) || i.replace(":", "");
					}));
				}, m.utcOffset = function() {
					return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
				}, m.diff = function(r, d, l) {
					var $, y = this, M = b.p(d), m = O(r), v = (m.utcOffset() - this.utcOffset()) * e, g = this - m, D = function() {
						return b.m(y, m);
					};
					switch (M) {
						case h:
							$ = D() / 12;
							break;
						case c:
							$ = D();
							break;
						case f:
							$ = D() / 3;
							break;
						case o:
							$ = (g - v) / 6048e5;
							break;
						case a:
							$ = (g - v) / 864e5;
							break;
						case u:
							$ = g / n;
							break;
						case s:
							$ = g / e;
							break;
						case i:
							$ = g / t;
							break;
						default: $ = g;
					}
					return l ? $ : b.a($);
				}, m.daysInMonth = function() {
					return this.endOf(c).$D;
				}, m.$locale = function() {
					return D[this.$L];
				}, m.locale = function(t, e) {
					if (!t) return this.$L;
					var n = this.clone(), r = w(t, e, !0);
					return r && (n.$L = r), n;
				}, m.clone = function() {
					return b.w(this.$d, this);
				}, m.toDate = function() {
					return new Date(this.valueOf());
				}, m.toJSON = function() {
					return this.isValid() ? this.toISOString() : null;
				}, m.toISOString = function() {
					return this.$d.toISOString();
				}, m.toString = function() {
					return this.$d.toUTCString();
				}, M;
			}(), Y = _.prototype;
			return O.prototype = Y, [
				["$ms", r],
				["$s", i],
				["$m", s],
				["$H", u],
				["$W", a],
				["$M", c],
				["$y", h],
				["$D", d]
			].forEach((function(t) {
				Y[t[1]] = function(e) {
					return this.$g(e, t[0], t[1]);
				};
			})), O.extend = function(t, e) {
				return t.$i || (t(e, _, O), t.$i = !0), O;
			}, O.locale = w, O.isDayjs = S, O.unix = function(t) {
				return O(1e3 * t);
			}, O.en = D[g], O.Ls = D, O.p = {}, O;
		}));
	})))(), 1);
	run(async () => {
		const pathParts = location.pathname.split("/").filter(Boolean);
		if (pathParts.length < 2) return;
		const [owner, repo] = pathParts;
		const repoInfo = {
			owner,
			repo
		};
		const sidebar = await waitElement(".BorderGrid");
		if (!sidebar) return;
		const sizeEl = html`
    <div class="mt-2">
      <span class="Link--muted" title="Repository Size">
        <img
          src="${dataIcon}"
          class="octicon octicon-people mr-2 tmp-mr-2"
          style="width: 16px; height: 16px;"
        />
        <span id="repo-size-value">Loading...</span>
      </span>
    </div>
    <div class="mt-2">
      <span class="Link--muted" title="First Commit Datetime">
        <img
          src="${sendIcon}"
          class="octicon octicon-people mr-2 tmp-mr-2"
          style="width: 16px; height: 16px;"
        />
        <span id="first-commit-date">Loading...</span>
      </span>
    </div>
  `;
		const readmeEl = sidebar.querySelector(".BorderGrid-cell .hide-sm")?.querySelector(".mt-2");
		if (!readmeEl) return;
		readmeEl?.parentElement?.insertBefore(sizeEl, readmeEl);
		await updateRepoSize(repoInfo);
		await updateFirstCommitDate(repoInfo);
	});
	async function updateFirstCommitDate(repoInfo) {
		const el = document.getElementById("first-commit-date");
		if (!el) return;
		try {
			const links = parseRawHeadersString((await GM.xmlHttpRequest({
				method: "GET",
				url: `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=1`,
				headers: { Accept: "application/vnd.github.v3+json" },
				responseType: "json"
			})).responseHeaders).get("link")?.split(",") || [];
			for (const link of links) {
				let [url, rel] = link.split(";");
				url = (url || "").trim().slice(1, -1);
				rel = (rel || "").trim().slice(5, -1);
				if (rel === "last") {
					const date = (await GM.xmlHttpRequest({
						method: "GET",
						url,
						headers: { Accept: "application/vnd.github.v3+json" },
						responseType: "json"
					})).response.at(0)?.commit.committer.date;
					if (date) {
						el.textContent = (0, import_dayjs_min.default)(date).format("YYYY-MM-DD HH:mm:ss");
						return;
					}
				}
			}
			el.textContent = "Unavailable";
		} catch (err) {
			console.error(err);
			el.textContent = "Unavailable";
		}
	}
	async function updateRepoSize(repoInfo) {
		const el = document.getElementById("repo-size-value");
		if (!el) return;
		try {
			const sizeKB = (await GM.xmlHttpRequest({
				method: "GET",
				url: `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
				headers: { Accept: "application/vnd.github.v3+json" },
				responseType: "json"
			})).response.size;
			el.textContent = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
		} catch (err) {
			console.error(err);
			el.textContent = "Unavailable";
		}
	}
	//#endregion
})();
