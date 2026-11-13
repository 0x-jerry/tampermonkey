// ==UserScript==
// @name         Enhance GitHub Mermaid Preview
// @namespace    0x-jerry
// @description  Enhance GitHub Mermaid diagrams with drag-to-pan and wheel / pinch zoom gestures
// @version      0.0.1
// @updateURL    https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/github-mermaid-preview.user.js
// @downloadURL  https://raw.githubusercontent.com/0x-jerry/tampermonkey/refs/heads/gh-pages/github-mermaid-preview.user.js
// @source       https://github.com/0x-jerry/tampermonkey/blob/main/src/github-mermaid-preview.user.ts
// @match        https://viewscreen.githubusercontent.com/*
// @run-at       document-idle
// ==/UserScript==
(function() {
	//#region src/utils/helper.ts
	function css(template, ...substitutions) {
		return String.raw(template, ...substitutions);
	}
	function html(template, ...substitutions) {
		const doc = document.createDocumentFragment();
		const div = document.createElement("div");
		div.innerHTML = String.raw(template, ...substitutions);
		doc.append(...div.childNodes);
		return doc;
	}
	function applyStyle(el, style) {
		for (const key in style) {
			const val = Reflect.get(style, key);
			el.style.setProperty(key, val);
		}
	}
	//#endregion
	//#region src/utils/utils.ts
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
	//#region src/github-mermaid-preview.user.ts
	const MARKER = "data-mermaid-panzoom";
	const DRAG_ATTR = "data-mermaid-panzoom-dragging";
	const MIN_SCALE = .25;
	const MAX_SCALE = 20;
	const DRAG_THRESHOLD = 3;
	const WHEEL_STEP = .002;
	run(() => {
		injectStyle();
		scan();
		new MutationObserver(() => scan()).observe(document.body, {
			childList: true,
			subtree: true
		});
	});
	function scan() {
		const svgs = document.querySelectorAll("svg");
		for (const svg of svgs) {
			if (svg.hasAttribute(MARKER)) continue;
			if (!isMermaidSvg(svg)) continue;
			svg.setAttribute(MARKER, "");
			new PanZoomController(svg);
		}
	}
	function isMermaidSvg(svg) {
		const vb = svg.viewBox?.baseVal;
		if (!vb || vb.width === 0 || vb.height === 0) return false;
		if (svg.getAttribute("aria-roledescription")) return true;
		if (svg.id === "diagram") return true;
		if (svg.closest(".mermaid, .mermaid-view")) return true;
		return !!svg.querySelector(".edgePaths, .edgePath, .cluster, .node");
	}
	/** The dedicated full-page preview served by the render service (already has a control panel). */
	function isPreviewPage() {
		return location.hostname.includes("viewscreen") || location.hostname.includes("render.githubusercontent") || !!document.querySelector(".render-shell, .mermaid-view");
	}
	var PanZoomController = class {
		svg;
		initial;
		pointers = /* @__PURE__ */ new Map();
		drag = null;
		pinch = null;
		scaleEl = null;
		constructor(svg) {
			this.svg = svg;
			this.initial = this.read();
			svg.addEventListener("pointerdown", this.handlePointerDown);
			svg.addEventListener("pointermove", this.handlePointerMove);
			svg.addEventListener("pointerup", this.handlePointerUp);
			svg.addEventListener("pointercancel", this.handlePointerUp);
			svg.addEventListener("lostpointercapture", this.handlePointerUp);
			svg.addEventListener("wheel", this.handleWheel, { passive: false });
			svg.addEventListener("dblclick", this.handleDoubleClick);
			if (!isPreviewPage()) this.createToolbar();
		}
		read() {
			const vb = this.svg.viewBox?.baseVal;
			return {
				x: vb?.x ?? 0,
				y: vb?.y ?? 0,
				w: vb?.width ?? 0,
				h: vb?.height ?? 0
			};
		}
		write(r) {
			const vb = this.svg.viewBox?.baseVal;
			if (!vb) return;
			vb.x = r.x;
			vb.y = r.y;
			vb.width = r.w;
			vb.height = r.h;
			this.updateToolbar();
		}
		/** Scale relative to the initial view, 1 means 100%. */
		scale() {
			const vb = this.read();
			return this.initial.w ? this.initial.w / vb.w : 1;
		}
		/** Uniform user-space scale used by the svg (preserveAspectRatio "xMinYMin meet"). */
		userScale() {
			const rect = this.svg.getBoundingClientRect();
			const vb = this.read();
			if (!rect.width || !rect.height || !vb.w || !vb.h) return 1;
			return Math.min(rect.width / vb.w, rect.height / vb.h);
		}
		pan(dx, dy) {
			const vb = this.read();
			const s = this.userScale();
			this.write({
				...vb,
				x: vb.x - dx / s,
				y: vb.y - dy / s
			});
		}
		zoomAt(px, py, factor) {
			if (!isFinite(factor) || factor <= 0) return;
			const vb = this.read();
			const rect = this.svg.getBoundingClientRect();
			const s = this.userScale();
			const userX = vb.x + px / s;
			const userY = vb.y + py / s;
			const applied = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale() * factor)) / this.scale();
			const w = vb.w / applied;
			const h = vb.h / applied;
			const ns = rect.width && rect.height ? Math.min(rect.width / w, rect.height / h) : s;
			this.write({
				x: userX - px / ns,
				y: userY - py / ns,
				w,
				h
			});
		}
		zoomCenter(factor) {
			const rect = this.svg.getBoundingClientRect();
			this.zoomAt(rect.width / 2, rect.height / 2, factor);
		}
		reset() {
			this.write(this.initial);
		}
		handlePointerDown = (e) => {
			if (e.pointerType === "mouse" && e.button !== 0) return;
			this.pointers.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY
			});
			if (this.pointers.size === 1) {
				try {
					this.svg.setPointerCapture(e.pointerId);
				} catch {}
				this.drag = {
					id: e.pointerId,
					last: {
						x: e.clientX,
						y: e.clientY
					},
					moved: false
				};
				this.pinch = null;
				this.svg.setAttribute(DRAG_ATTR, "");
			} else if (this.pointers.size === 2) {
				this.drag = null;
				this.pinch = this.createPinchState();
			}
		};
		handlePointerMove = (e) => {
			const point = this.pointers.get(e.pointerId);
			if (!point) return;
			const dx = e.clientX - point.x;
			const dy = e.clientY - point.y;
			point.x = e.clientX;
			point.y = e.clientY;
			if (this.pointers.size === 1) {
				const drag = this.drag;
				if (!drag || drag.id !== e.pointerId) return;
				if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
				drag.moved = true;
				this.pan(dx, dy);
				return;
			}
			if (this.pointers.size < 2 || !this.pinch) return;
			const [a, b] = [...this.pointers.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y);
			const mid = {
				x: (a.x + b.x) / 2,
				y: (a.y + b.y) / 2
			};
			this.pan(mid.x - this.pinch.mid.x, mid.y - this.pinch.mid.y);
			this.zoomAt(mid.x, mid.y, this.pinch.dist ? dist / this.pinch.dist : 1);
			this.pinch = {
				dist,
				mid
			};
		};
		handlePointerUp = (e) => {
			this.pointers.delete(e.pointerId);
			if (this.drag?.id === e.pointerId) this.drag = null;
			if (this.pointers.size < 2) this.pinch = null;
			if (this.pointers.size === 1) {
				const entry = this.pointers.entries().next().value;
				if (entry) this.drag = {
					id: entry[0],
					last: entry[1],
					moved: true
				};
			}
			if (this.pointers.size === 0) this.svg.removeAttribute(DRAG_ATTR);
		};
		createPinchState() {
			const [a, b] = [...this.pointers.values()];
			return {
				dist: Math.hypot(a.x - b.x, a.y - b.y),
				mid: {
					x: (a.x + b.x) / 2,
					y: (a.y + b.y) / 2
				}
			};
		}
		handleWheel = (e) => {
			if (!isPreviewPage() && !(e.ctrlKey || e.metaKey)) return;
			e.preventDefault();
			const rect = this.svg.getBoundingClientRect();
			const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
			this.zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-delta * WHEEL_STEP));
		};
		handleDoubleClick = (e) => {
			e.preventDefault();
			this.reset();
		};
		createToolbar() {
			const parent = this.svg.parentElement;
			if (!parent) return;
			const wrapper = document.createElement("div");
			applyStyle(wrapper, { position: "relative" });
			parent.insertBefore(wrapper, this.svg);
			wrapper.append(this.svg);
			const toolbar = html`
      <div class="mermaid-panzoom-toolbar" data-mermaid-panzoom-toolbar>
        <button type="button" data-action="zoom-out" title="Zoom out">−</button>
        <span class="mermaid-panzoom-scale" data-role="scale">100%</span>
        <button type="button" data-action="zoom-in" title="Zoom in">+</button>
        <button type="button" data-action="reset" title="Reset view">⟲</button>
      </div>
    `.firstElementChild;
			wrapper.append(toolbar);
			this.scaleEl = toolbar.querySelector("[data-role=\"scale\"]");
			toolbar.querySelector("[data-action=\"zoom-in\"]")?.addEventListener("click", () => {
				this.zoomCenter(1.25);
			});
			toolbar.querySelector("[data-action=\"zoom-out\"]")?.addEventListener("click", () => {
				this.zoomCenter(1 / 1.25);
			});
			toolbar.querySelector("[data-action=\"reset\"]")?.addEventListener("click", () => {
				this.reset();
			});
		}
		updateToolbar() {
			if (this.scaleEl) this.scaleEl.textContent = `${Math.round(this.scale() * 100)}%`;
		}
	};
	function injectStyle() {
		const el = document.createElement("style");
		el.textContent = css`
    [data-mermaid-panzoom] {
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-user-drag: none;
      cursor: grab;
    }

    [data-mermaid-panzoom][data-mermaid-panzoom-dragging] {
      cursor: grabbing;
    }

    [data-mermaid-panzoom-toolbar] {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(0, 0, 0, 0.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial,
        sans-serif;
    }

    [data-mermaid-panzoom-toolbar] button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: #24292f;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
    }

    [data-mermaid-panzoom-toolbar] button:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    [data-mermaid-panzoom-toolbar] .mermaid-panzoom-scale {
      min-width: 44px;
      text-align: center;
      font-size: 12px;
      color: #57606a;
      user-select: none;
    }

    html[data-color-mode="dark"] [data-mermaid-panzoom-toolbar] {
      background: rgba(22, 27, 34, 0.92);
      border-color: rgba(255, 255, 255, 0.15);
    }

    html[data-color-mode="dark"] [data-mermaid-panzoom-toolbar] button {
      color: #e6edf3;
    }

    html[data-color-mode="dark"] [data-mermaid-panzoom-toolbar] button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    html[data-color-mode="dark"] [data-mermaid-panzoom-toolbar] .mermaid-panzoom-scale {
      color: #8b949e;
    }
  `;
		document.head.append(el);
	}
	//#endregion
})();
